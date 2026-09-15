import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GROK_SYSTEM_PROMPT,
  grokChips,
  grokContextLabel,
  grokModelFromEnv,
  parseGrokPath,
  parseGrokRef,
  sanitizeTurns,
} from "./grok-shared";

describe("parseGrokPath", () => {
  it("maps dashboard and record pages", () => {
    assert.deepEqual(parseGrokPath("/dashboard"), { type: "dashboard" });
    assert.deepEqual(parseGrokPath("/jobs/abc123"), { type: "job", id: "abc123" });
    assert.deepEqual(parseGrokPath("/customers/c1"), { type: "customer", id: "c1" });
    assert.deepEqual(parseGrokPath("/properties/p1"), { type: "property", id: "p1" });
    assert.deepEqual(parseGrokPath("/quotes/q1"), { type: "quote", id: "q1" });
    assert.deepEqual(parseGrokPath("/follow-ups"), { type: "follow-ups" });
    assert.deepEqual(parseGrokPath("/invoices/i1"), { type: "invoice", id: "i1" });
    assert.deepEqual(parseGrokPath("/maintenance/m1"), { type: "maintenance", id: "m1" });
  });

  it("does not treat /new as a record id", () => {
    assert.deepEqual(parseGrokPath("/jobs/new"), { type: "general" });
    assert.deepEqual(parseGrokPath("/customers/new"), { type: "general" });
  });
});

describe("grok chips and labels", () => {
  it("offers job and dashboard actions", () => {
    const jobIds = grokChips("job").map((c) => c.id);
    assert.deepEqual(jobIds, ["sms", "call", "status", "notes", "maint"]);
    assert.equal(grokContextLabel({ type: "job", id: "x" }), "This job");
    assert.ok(grokChips("dashboard").some((c) => c.id === "cards"));
  });
});

describe("sanitizeTurns", () => {
  it("keeps only user/assistant text and caps length", () => {
    const turns = sanitizeTurns([
      { role: "system", content: "nope" },
      { role: "user", content: "  Hello  " },
      { role: "assistant", content: "Hi" },
      { role: "user", content: "" },
    ]);
    assert.deepEqual(turns, [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi" },
    ]);
  });
});

describe("parseGrokRef", () => {
  it("rejects unknown types", () => {
    assert.deepEqual(parseGrokRef({ type: "admin", id: "1" }), { type: "general" });
    assert.deepEqual(parseGrokRef({ type: "job", id: "job_1" }), { type: "job", id: "job_1" });
  });
});

describe("GROK_SYSTEM_PROMPT", () => {
  it("includes confirmed Kaizen Coastal contact details", () => {
    assert.match(GROK_SYSTEM_PROMPT, /The Parc, 2 Inland Dr, Tugun QLD 4224/);
    assert.match(GROK_SYSTEM_PROMPT, /0428 316 868/);
    assert.match(GROK_SYSTEM_PROMPT, /tel:\+61428316868/);
    assert.match(GROK_SYSTEM_PROMPT, /closes 21:00/);
    assert.match(GROK_SYSTEM_PROMPT, /home service in Tugun/i);
  });
});

describe("grokModelFromEnv", () => {
  it("defaults to grok-4", () => {
    assert.equal(grokModelFromEnv(undefined), "grok-4");
    assert.equal(grokModelFromEnv(" grok-4.6 "), "grok-4.6");
  });
});
