export function extractPayloadText(payloads) {
  if (!Array.isArray(payloads)) return "";
  return payloads
    .map((payload) => {
      if (typeof payload === "string") return payload;
      if (!payload || typeof payload !== "object") return "";
      return payload.text || payload.content || payload.message || payload.body || "";
    })
    .filter((text) => typeof text === "string" && text.trim())
    .map((text) => text.trim())
    .join("\n\n")
    .trim();
}

export function extractAgentText(stdout) {
  const raw = String(stdout || "").trim();
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    const payloadText = extractPayloadText(parsed.payloads) ||
      extractPayloadText(parsed.result?.payloads) ||
      extractPayloadText(parsed.reply?.payloads);
    if (payloadText) return payloadText;

    const candidates = [
      parsed.text,
      parsed.message,
      parsed.reply,
      parsed.response,
      parsed.output,
      parsed.result?.text,
      parsed.result?.message,
      parsed.result?.reply,
      parsed.result?.response,
      parsed.result?.output,
      parsed.reply?.text,
      parsed.reply?.message,
      parsed.reply?.response,
      parsed.reply?.output,
      parsed.finalAssistantVisibleText,
      parsed.result?.meta?.finalAssistantVisibleText,
      parsed.result?.meta?.finalAssistantRawText,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    }

    // JSON agent output with no user-visible text should not be relayed as raw metadata.
    return "";
  } catch {
    // Non-JSON stdout can still be a valid plain-text reply.
    return raw;
  }
}
