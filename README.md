# WhisprAI OpenClaw Plugin

WhisprAI OpenClaw Plugin lets a user pair their own OpenClaw computer with WhisprAI so Archie can act as a private local assistant.

Hosted WhisprAI does not need direct access to `127.0.0.1`, a home router, a public tunnel, or the user's OpenClaw gateway. The plugin polls WhisprAI for queued work, runs the local OpenClaw agent, and sends Archie the result.

## Early Public Release

This is an early public release. It is useful now for pairing WhisprAI with OpenClaw, but it will be updated continuously as real users test more computers, operating systems, relay flows, and assistant workflows.

Constructive feedback is very welcome, especially:

- Pairing steps that felt confusing.
- Relay jobs that did not complete.
- OpenClaw responses that were not returned to Archie.
- Security or privacy concerns.
- Better wording for non-technical users.
- Ideas for safer approval flows and richer assistant actions.

Open an issue on GitHub:

https://github.com/MarcSean1971/whisprai-openclaw-plugin/issues

## Product Promise

> Bring Archie to your own computer, without exposing your computer to the public internet.

The plugin is designed for people who want WhisprAI to be more than a chat app. With OpenClaw paired locally, Archie can use the user's own OpenClaw setup, local files, configured tools, browser, GitHub access, coding tools, and approval flows.

## What It Does

- Pairs this computer with WhisprAI using an explicit pairing flow.
- Stores relay and inbound secrets locally in the user's OpenClaw state.
- Polls WhisprAI for queued jobs.
- Runs `openclaw agent` locally with the queued user request.
- Sends Archie the assistant reply.
- Provides a local status endpoint and CLI commands.
- Allows the user to revoke the pairing.

## Commands

| Command | Purpose |
| --- | --- |
| `openclaw whisprai status` | Show local pairing and relay state without printing secrets. |
| `openclaw whisprai connect` | Print the local connect URL. |
| `openclaw whisprai pair start` | Create a short pairing code. |
| `openclaw whisprai pair complete` | Complete pairing from CLI or test flows. |
| `openclaw whisprai pair exchange` | Exchange a pairing code with WhisprAI when supported by the hosted app. |
| `openclaw whisprai relay poll` | Poll once for queued WhisprAI work. |
| `openclaw whisprai relay run` | Run the relay loop in the foreground. |
| `openclaw whisprai revoke` | Disconnect this computer from WhisprAI. |

## Local Gateway Routes

| Route | Purpose |
| --- | --- |
| `GET /whisprai/status` | Gateway-authenticated JSON status. |
| `GET /whisprai/connect` | Gateway-authenticated local pairing helper page. |
| `POST /whisprai/pair/start` | Create a short pairing code. |
| `POST /whisprai/pair/complete` | Store relay and inbound details after confirmation. |
| `POST /whisprai/revoke` | Disconnect this computer from WhisprAI. |

## Install From ClawHub

```bash
openclaw plugins install @whisprai/openclaw-plugin
openclaw plugins enable whisprai
openclaw gateway restart
openclaw whisprai status
```

## Development Install

From this repository:

```bash
npm test
openclaw plugins install -l . --force
openclaw gateway restart
openclaw whisprai status
```

## Pairing Flow

1. The user installs and enables the plugin in OpenClaw.
2. The user opens WhisprAI and chooses Connect My Computer.
3. The plugin creates a short pairing code.
4. WhisprAI exchanges the pairing code for relay and inbound details.
5. The plugin stores those details locally.
6. The plugin polls for work and runs OpenClaw locally when Archie needs help.
7. The user can revoke pairing at any time.

## Production Flow

1. WhisprAI queues work in the hosted relay.
2. The plugin polls the relay with the local relay token.
3. The plugin runs:

```bash
openclaw agent --session-id whisprai:<conversation_id> --message <request> --json --timeout 600
```

4. The plugin extracts the visible assistant reply from OpenClaw output.
5. The plugin posts the reply to WhisprAI using the inbound secret.
6. The relay job is acknowledged as completed or failed.

## Security Model

- Pairing is explicit and revocable.
- Relay and inbound secrets are stored only in the local OpenClaw state file.
- Status output masks secrets.
- Hosted WhisprAI should never expose OpenClaw gateway URLs or secrets to normal users.
- The plugin does not open public inbound access to the user's computer.
- Sensitive computer actions should continue to rely on OpenClaw approval flows.

Important: this plugin intentionally launches the local `openclaw` executable with `node:child_process`. That is the core bridge behavior. ClawHub or other scanners may flag this as command execution. The command is scoped to `openclaw agent`, and users should install it only if they want WhisprAI to be able to ask their local OpenClaw agent for help.

## Privacy Notes

The plugin sends the queued WhisprAI request to the local OpenClaw agent and sends the assistant reply back to WhisprAI. It does not intentionally collect analytics or send local files by itself. Any tool, file, browser, GitHub, or computer action comes from the user's local OpenClaw configuration and approval model.

## Example CLI Pairing

```bash
openclaw whisprai pair complete \
  --code 123-456 \
  --relay-url https://<project-ref>.supabase.co/functions/v1/openclaw-relay \
  --relay-token <OPENCLAW_RELAY_TOKEN> \
  --inbound-url https://<project-ref>.supabase.co/functions/v1/openclaw-inbound \
  --inbound-secret <OPENCLAW_INBOUND_SECRET> \
  --agent-id main

openclaw whisprai relay poll
```

## Package Shape

- `index.js`: OpenClaw plugin entry, CLI commands, local routes, relay polling, and agent handoff.
- `extract-agent-text.js`: extracts user-visible assistant text from OpenClaw JSON/stdout.
- `extract-agent-text.test.mjs`: focused parser tests.
- `openclaw.plugin.json`: native OpenClaw manifest.
- `docs/clawhub-listing.md`: marketplace listing draft.
- `docs/product-strategy.md`: positioning and roadmap.

## Roadmap

- Friendlier pairing page copy for non-technical users.
- Stronger relay diagnostics and self-healing status messages.
- Richer job types beyond simple assistant text.
- Better user consent screens before sensitive local actions.
- Optional GitHub issue/PR workflows through the user's OpenClaw tools.
- Signed release and verification guidance.
