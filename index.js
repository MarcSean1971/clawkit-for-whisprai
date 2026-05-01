import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import os from "node:os";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { extractAgentText } from "./extract-agent-text.js";

const execFileAsync = promisify(execFile);

const DEFAULT_STATE = {
  paired: false,
  pairingCode: null,
  pairingExpiresAt: null,
  whispraiUrl: "https://whisprai.app",
  relayUrl: null,
  relayToken: null,
  inboundUrl: null,
  inboundSecret: null,
  agentId: "main",
  pollIntervalMs: 5000,
  connectedAt: null,
  lastUpdatedAt: null,
};

let relayTimer = null;
let relayBusy = false;
let relayLockHeld = false;
let relayIdlePolls = 0;
let relayConsecutiveFailures = 0;
let memoryState = { ...DEFAULT_STATE };
let runtimeConfig = {};

function nowIso() {
  return new Date().toISOString();
}

function publicState(state) {
  return {
    paired: state.paired === true,
    pairingCode: state.pairingCode || null,
    pairingExpiresAt: state.pairingExpiresAt || null,
    whispraiUrl: state.whispraiUrl || DEFAULT_STATE.whispraiUrl,
    relayUrl: state.relayUrl || null,
    relayTokenConfigured: Boolean(state.relayToken),
    inboundUrl: state.inboundUrl || null,
    inboundSecretConfigured: Boolean(state.inboundSecret),
    agentId: state.agentId || "main",
    pollIntervalMs: state.pollIntervalMs || DEFAULT_STATE.pollIntervalMs,
    connectedAt: state.connectedAt || null,
    lastUpdatedAt: state.lastUpdatedAt || null,
  };
}

async function readState() {
  const configured = stateFromRuntimeConfig();
  return {
    ...DEFAULT_STATE,
    ...memoryState,
    ...configured,
    paired: Boolean(memoryState.paired || configured.paired),
  };
}

async function writeState(nextState) {
  const state = { ...DEFAULT_STATE, ...nextState, lastUpdatedAt: nowIso() };
  memoryState = state;
  return state;
}

function optionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function stateFromRuntimeConfig() {
  const relayUrl = optionalString(runtimeConfig.relayUrl) || optionalString(process.env.WHISPRAI_RELAY_URL);
  const relayToken = optionalString(runtimeConfig.relayToken) || optionalString(process.env.WHISPRAI_RELAY_TOKEN);
  const inboundUrl = optionalString(runtimeConfig.inboundUrl) || optionalString(process.env.WHISPRAI_INBOUND_URL);
  const inboundSecret = optionalString(runtimeConfig.inboundSecret) || optionalString(process.env.WHISPRAI_INBOUND_SECRET);
  const whispraiUrl = optionalString(runtimeConfig.whispraiUrl) || optionalString(process.env.WHISPRAI_URL) || DEFAULT_STATE.whispraiUrl;
  const agentId = optionalString(runtimeConfig.agentId) || optionalString(process.env.WHISPRAI_AGENT_ID) || DEFAULT_STATE.agentId;
  const pollIntervalMs =
    optionalNumber(runtimeConfig.pollIntervalMs) ||
    optionalNumber(process.env.WHISPRAI_POLL_INTERVAL_MS) ||
    DEFAULT_STATE.pollIntervalMs;

  return {
    paired: Boolean(relayUrl && relayToken),
    whispraiUrl,
    relayUrl,
    relayToken,
    inboundUrl,
    inboundSecret,
    agentId,
    pollIntervalMs,
    connectedAt: relayUrl && relayToken ? "configured" : null,
  };
}

function makePairingCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0").replace(/(\d{3})(\d{3})/, "$1-$2");
}

function localDeviceName() {
  return `${os.hostname()} (${os.platform()})`;
}

function isPairingExpired(state) {
  if (!state.pairingExpiresAt) return true;
  const expiresAt = new Date(state.pairingExpiresAt).getTime();
  return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
}

function workerId() {
  return `openclaw-${os.hostname()}-${process.pid}`;
}

async function acquireRelayLock() {
  if (relayLockHeld) {
    throw new Error("WhisprAI relay is already running in this OpenClaw process.");
  }
  relayLockHeld = true;
  return true;
}

async function releaseRelayLock() {
  relayLockHeld = false;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function sendHtml(res, status, html) {
  res.statusCode = status;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(html);
}

function errorSummary(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

async function relayRequest(state, body, { timeoutMs = 30000 } = {}) {
  if (!state.relayUrl || !state.relayToken) {
    throw new Error("WhisprAI relay is not configured");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(state.relayUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${state.relayToken}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    if (!response.ok) {
      throw new Error(data?.error || data?.raw || `WhisprAI relay HTTP ${response.status}`);
    }
    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`WhisprAI relay request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function openclawCommand() {
  return { file: "openclaw", argsPrefix: [] };
}

function openclawSessionId(sessionKey) {
  return String(sessionKey || "whisprai-session")
    .replace(/[^a-zA-Z0-9_.-]/g, "-")
    .slice(0, 120) || "whisprai-session";
}

function persistenceNote() {
  return {
    mode: "memory",
    message:
      "Marketplace-safe mode does not write pairing secrets to disk. Add relayUrl, relayToken, inboundUrl, and inboundSecret to OpenClaw plugin config or WHISPRAI_* environment variables for restart persistence.",
  };
}

async function runAgentJob(job, state) {
  const args = [
    "agent",
    "--session-id",
    openclawSessionId(job.session_key),
    "--message",
    job.message,
    "--json",
    "--timeout",
    "600",
  ];
  const agentId = job.agent_id || state.agentId || "main";
  if (agentId && agentId !== "main") args.splice(1, 0, "--agent", agentId);
  const command = openclawCommand();
  const { stdout } = await execFileAsync(command.file, [...command.argsPrefix, ...args], {
    timeout: 15 * 60 * 1000,
    maxBuffer: 1024 * 1024,
    windowsHide: true,
  });
  const response = extractAgentText(stdout);
  if (!response) return "Archie ran locally, but didn't produce a reply this time. Please try again.";
  return response;
}

async function postInboundReply(state, job, response) {
  if (!state.inboundUrl || !state.inboundSecret) return false;
  const inbound = await fetch(state.inboundUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${state.inboundSecret}`,
    },
    body: JSON.stringify({
      jobId: job.id,
      sessionKey: job.session_key,
      response,
    }),
  });
  if (!inbound.ok) {
    const text = await inbound.text();
    throw new Error(`WhisprAI inbound failed (${inbound.status}): ${text}`);
  }
  return true;
}

function nextRelayDelayMs(result, baseIntervalMs) {
  if (result?.jobs > 0) {
    relayIdlePolls = 0;
    relayConsecutiveFailures = 0;
    return baseIntervalMs;
  }
  if (result?.skipped === "busy") return Math.min(baseIntervalMs, 5000);
  const pressure = result?.ok === false ? Math.max(relayIdlePolls, relayConsecutiveFailures) : relayIdlePolls;
  relayIdlePolls = Math.min(pressure + 1, 6);
  const backoff = Math.min(60000, baseIntervalMs * Math.pow(2, Math.max(0, relayIdlePolls - 1)));
  const jitter = Math.round(Math.random() * Math.min(3000, Math.floor(backoff * 0.15)));
  return backoff + jitter;
}

async function processRelayOnce(logger = console) {
  if (relayBusy) return { ok: true, skipped: "busy" };
  relayBusy = true;
  try {
    const state = await readState();
    if (!state.paired || !state.relayUrl || !state.relayToken) {
      return { ok: true, skipped: "not_configured" };
    }
    let polled;
    try {
      polled = await relayRequest(state, {
        action: "poll",
        workerId: workerId(),
        limit: 1,
      });
      if (relayConsecutiveFailures > 0) {
        logger.info?.(`[whisprai] relay poll recovered after ${relayConsecutiveFailures} failure(s)`);
      }
      relayConsecutiveFailures = 0;
    } catch (error) {
      relayConsecutiveFailures += 1;
      const summary = errorSummary(error);
      const log = relayConsecutiveFailures <= 2 ? logger.warn || logger.error : logger.debug || logger.warn || logger.error;
      log?.(`[whisprai] relay poll failed (${relayConsecutiveFailures} consecutive): ${summary}`);
      return { ok: false, jobs: 0, error: summary, consecutiveFailures: relayConsecutiveFailures };
    }
    const jobs = Array.isArray(polled.jobs) ? polled.jobs : [];
    for (const job of jobs) {
      try {
        const response = await runAgentJob(job, state);
        await postInboundReply(state, job, response);
        await relayRequest(state, {
          action: "ack",
          workerId: workerId(),
          jobId: job.id,
          ok: true,
          response,
        });
        logger.info?.(`[whisprai] completed relay job ${job.id}`);
      } catch (error) {
        const message = errorSummary(error);
        await relayRequest(state, {
          action: "ack",
          workerId: workerId(),
          jobId: job.id,
          ok: false,
          error: message,
        }).catch((ackError) => logger.error?.(`[whisprai] relay ack failed for job ${job.id}: ${errorSummary(ackError)}`));
        logger.error?.(`[whisprai] failed relay job ${job.id}: ${message}`);
      }
    }
    return { ok: true, jobs: jobs.length };
  } finally {
    relayBusy = false;
  }
}

async function handleStatus(_req, res) {
  sendJson(res, 200, { ok: true, status: publicState(await readState()) });
  return true;
}

async function handleConnect(_req, res) {
  const state = publicState(await readState());
  sendHtml(res, 200, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Connect WhisprAI</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; max-width: 720px; margin: 48px auto; padding: 0 20px; line-height: 1.5; }
    .card { border: 1px solid #ddd; border-radius: 18px; padding: 20px; box-shadow: 0 8px 30px rgba(0,0,0,.06); }
    code { background: #f4f4f5; padding: 2px 6px; border-radius: 6px; }
    .status { font-weight: 700; color: ${state.paired ? "#15803d" : "#a16207"}; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Connect WhisprAI to this computer 👻</h1>
    <p>Status: <span class="status">${state.paired ? "Connected" : "Not connected"}</span></p>
    <p>This local plugin uses an outbound relay, so WhisprAI does not need access to your private OpenClaw gateway.</p>
    <p>Relay configured: <strong>${state.relayUrl && state.relayToken ? "yes" : "no"}</strong></p>
    ${state.pairingCode ? `<p>Current pairing code: <code>${state.pairingCode}</code></p>` : ""}
  </div>
</body>
</html>`);
  return true;
}

async function handlePairStart(req, res) {
  const body = await readJsonBody(req).catch(() => ({}));
  const state = await readState();
  const next = await writeState({
    ...state,
    paired: false,
    pairingCode: makePairingCode(),
    pairingExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    whispraiUrl: typeof body.whispraiUrl === "string" && body.whispraiUrl.trim() ? body.whispraiUrl.trim() : state.whispraiUrl,
  });
  sendJson(res, 200, { ok: true, status: publicState(next) });
  return true;
}

async function handlePairComplete(req, res) {
  const body = await readJsonBody(req);
  const state = await readState();
  if (!state.pairingCode || body.pairingCode !== state.pairingCode || isPairingExpired(state)) {
    sendJson(res, 400, { ok: false, error: "Invalid or expired pairing code" });
    return true;
  }
  const next = await writeState({
    ...state,
    paired: true,
    pairingCode: null,
    pairingExpiresAt: null,
    whispraiUrl: typeof body.whispraiUrl === "string" && body.whispraiUrl.trim() ? body.whispraiUrl.trim() : state.whispraiUrl,
    relayUrl: typeof body.relayUrl === "string" && body.relayUrl.trim() ? body.relayUrl.trim() : state.relayUrl,
    relayToken: typeof body.relayToken === "string" && body.relayToken.trim() ? body.relayToken.trim() : state.relayToken,
    inboundUrl: typeof body.inboundUrl === "string" && body.inboundUrl.trim() ? body.inboundUrl.trim() : state.inboundUrl,
    inboundSecret: typeof body.inboundSecret === "string" && body.inboundSecret.trim() ? body.inboundSecret.trim() : state.inboundSecret,
    agentId: typeof body.agentId === "string" && body.agentId.trim() ? body.agentId.trim() : state.agentId,
    connectedAt: nowIso(),
  });
  sendJson(res, 200, { ok: true, status: publicState(next) });
  return true;
}

async function handleRevoke(_req, res) {
  const next = await writeState({ ...DEFAULT_STATE });
  sendJson(res, 200, { ok: true, status: publicState(next) });
  return true;
}

function registerHttp(api) {
  api.registerHttpRoute({ path: "/whisprai/status", auth: "gateway", handler: handleStatus });
  api.registerHttpRoute({ path: "/whisprai/connect", auth: "gateway", handler: handleConnect });
  api.registerHttpRoute({ path: "/whisprai/pair/start", auth: "gateway", handler: handlePairStart });
  api.registerHttpRoute({ path: "/whisprai/pair/complete", auth: "gateway", handler: handlePairComplete });
  api.registerHttpRoute({ path: "/whisprai/revoke", auth: "gateway", handler: handleRevoke });
}

function registerService(api) {
  if (typeof api.registerService !== "function") return;
  api.registerService({
    id: "whisprai-relay",
    async start(ctx) {
      const state = await readState();
      if (!state.paired || !state.relayUrl || !state.relayToken) {
        ctx.logger.info?.("[whisprai] relay service idle; not paired/configured");
        return;
      }
      await acquireRelayLock();
      const intervalMs = Math.max(2000, Math.min(60000, state.pollIntervalMs || DEFAULT_STATE.pollIntervalMs));
      ctx.logger.info?.(`[whisprai] relay service polling with adaptive backoff from ${intervalMs}ms`);
      const schedule = (delayMs = 0) => {
        relayTimer = setTimeout(async () => {
          try {
            const result = await processRelayOnce(ctx.logger);
            schedule(nextRelayDelayMs(result, intervalMs));
          } catch (error) {
            ctx.logger.error?.(`[whisprai] relay loop crashed: ${errorSummary(error)}`);
            schedule(Math.min(60000, intervalMs * 2));
          }
        }, delayMs);
      };
      schedule(0);
    },
    stop() {
      if (relayTimer) clearTimeout(relayTimer);
      relayTimer = null;
      releaseRelayLock().catch(() => {});
    },
  });
}

function registerCli(api) {
  api.registerCli((ctx) => {
    const whisprai = ctx.program
      .command("whisprai")
      .description("Pair this OpenClaw computer with WhisprAI");

    whisprai.command("status").description("Show WhisprAI pairing status").action(async () => {
      console.log(JSON.stringify(publicState(await readState()), null, 2));
    });

    whisprai.command("connect").description("Show the local WhisprAI connect URL").action(async () => {
      console.log("Open: http://127.0.0.1:18900/whisprai/connect");
    });

    const pair = whisprai.command("pair").description("Manage WhisprAI pairing state");

    pair.command("start").description("Create a short WhisprAI pairing code")
      .option("--whisprai-url <url>", "WhisprAI app URL", DEFAULT_STATE.whispraiUrl)
      .action(async (opts) => {
        const state = await readState();
        const next = await writeState({
          ...state,
          paired: false,
          pairingCode: makePairingCode(),
          pairingExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          whispraiUrl: opts.whispraiUrl || state.whispraiUrl,
        });
        console.log(JSON.stringify({ status: publicState(next), persistence: persistenceNote() }, null, 2));
      });

    pair.command("complete").description("Complete WhisprAI pairing using the current code")
      .requiredOption("--code <code>", "Pairing code shown by pair start")
      .option("--relay-url <url>", "WhisprAI outbound relay Edge Function URL")
      .option("--relay-token <token>", "WhisprAI outbound relay token")
      .option("--inbound-url <url>", "WhisprAI inbound Edge Function URL")
      .option("--inbound-secret <secret>", "Shared inbound secret")
      .option("--whisprai-url <url>", "WhisprAI app URL")
      .option("--agent-id <id>", "OpenClaw agent id", "main")
      .action(async (opts) => {
        const state = await readState();
        if (state.pairingCode && (opts.code !== state.pairingCode || isPairingExpired(state))) {
          console.error("Invalid or expired pairing code");
          process.exitCode = 1;
          return;
        }
        const next = await writeState({
          ...state,
          paired: true,
          pairingCode: null,
          pairingExpiresAt: null,
          relayUrl: opts.relayUrl || state.relayUrl,
          relayToken: opts.relayToken || state.relayToken,
          inboundUrl: opts.inboundUrl || state.inboundUrl,
          inboundSecret: opts.inboundSecret || state.inboundSecret,
          whispraiUrl: opts.whispraiUrl || state.whispraiUrl,
          agentId: opts.agentId || state.agentId,
          connectedAt: nowIso(),
        });
        console.log(JSON.stringify({ status: publicState(next), persistence: persistenceNote() }, null, 2));
      });

    pair.command("exchange").description("Exchange a WhisprAI pairing code for this device's relay token")
      .requiredOption("--code <code>", "Pairing code shown in WhisprAI")
      .requiredOption("--pair-url <url>", "WhisprAI openclaw-pair Edge Function URL")
      .option("--device-name <name>", "Device name shown in WhisprAI", localDeviceName())
      .option("--agent-id <id>", "OpenClaw agent id", "main")
      .action(async (opts) => {
        const response = await fetch(opts.pairUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "complete",
            pairingCode: opts.code,
            deviceName: opts.deviceName,
            platform: os.platform(),
            agentId: opts.agentId,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          console.error(data?.error || `WhisprAI pairing failed (${response.status})`);
          process.exitCode = 1;
          return;
        }
        const state = await readState();
        const next = await writeState({
          ...state,
          paired: true,
          pairingCode: null,
          pairingExpiresAt: null,
          relayUrl: data.relay_url,
          relayToken: data.device_token,
          inboundUrl: data.inbound_url,
          inboundSecret: data.device_token,
          agentId: data.agent_id || opts.agentId || state.agentId,
          connectedAt: nowIso(),
        });
        console.log(JSON.stringify({ ok: true, deviceId: data.device_id, status: publicState(next), persistence: persistenceNote() }, null, 2));
      });

    const relay = whisprai.command("relay").description("Run or test the WhisprAI outbound relay");
    relay.command("poll").description("Poll once for queued WhisprAI work").action(async () => {
      console.log(JSON.stringify(await processRelayOnce(console), null, 2));
    });
    relay.command("run").description("Run the WhisprAI relay poll loop in the foreground")
      .option("--interval-ms <ms>", "Polling interval in milliseconds", String(DEFAULT_STATE.pollIntervalMs))
      .action(async (opts) => {
        const intervalMs = Math.max(2000, Math.min(60000, Number(opts.intervalMs) || DEFAULT_STATE.pollIntervalMs));
        await acquireRelayLock();
        const cleanup = () => releaseRelayLock().finally(() => process.exit(0));
        process.once("SIGINT", cleanup);
        process.once("SIGTERM", cleanup);
        console.log(`WhisprAI relay running; adaptive polling starts at ${intervalMs}ms. Press Ctrl+C to stop.`);
        const loop = async () => {
          try {
            const result = await processRelayOnce(console);
            setTimeout(loop, nextRelayDelayMs(result, intervalMs));
          } catch (error) {
            console.error(`[whisprai] relay loop crashed: ${errorSummary(error)}`);
            setTimeout(loop, Math.min(60000, intervalMs * 2));
          }
        };
        loop();
      });

    whisprai.command("revoke").description("Disconnect this computer from WhisprAI").action(async () => {
      const state = await writeState({ ...DEFAULT_STATE });
      console.log(JSON.stringify(publicState(state), null, 2));
    });
  }, {
    descriptors: [{ name: "whisprai", description: "Pair this OpenClaw computer with WhisprAI", hasSubcommands: true }],
  });
}

export default definePluginEntry({
  id: "whisprai",
  name: "ClawKit for WhisprAI (Legacy Package)",
  description: "Pair this OpenClaw computer with WhisprAI as a private local assistant.",
  register(api) {
    runtimeConfig = api.pluginConfig || {};
    memoryState = { ...memoryState, ...stateFromRuntimeConfig() };
    if (api.registrationMode === "cli-metadata" || api.registrationMode === "discovery" || api.registrationMode === "full") {
      registerCli(api);
      if (api.registrationMode === "cli-metadata") return;
    }
    if (api.registrationMode === "full" || api.registrationMode === "setup-runtime") {
      registerHttp(api);
      registerService(api);
    }
  },
});
