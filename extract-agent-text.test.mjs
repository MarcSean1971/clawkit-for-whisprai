import assert from "node:assert/strict";
import { test } from "node:test";
import { extractAgentText, extractPayloadText } from "./extract-agent-text.js";

test("extractPayloadText joins visible payload text", () => {
  assert.equal(extractPayloadText([{ text: " hello " }, { content: "world" }]), "hello\n\nworld");
});

test("extractAgentText prefers top-level payload text", () => {
  assert.equal(extractAgentText(JSON.stringify({ payloads: [{ text: "hello" }] })), "hello");
});

test("extractAgentText reads nested result payloads", () => {
  assert.equal(extractAgentText(JSON.stringify({ result: { payloads: [{ message: "nested" }] } })), "nested");
});

test("extractAgentText reads final visible text fallback", () => {
  assert.equal(extractAgentText(JSON.stringify({ finalAssistantVisibleText: "visible" })), "visible");
});

test("extractAgentText does not relay raw JSON metadata", () => {
  assert.equal(extractAgentText(JSON.stringify({ payloads: [], meta: { ok: true } })), "");
});

test("extractAgentText returns plain non-JSON stdout", () => {
  assert.equal(extractAgentText(" plain reply "), "plain reply");
});
