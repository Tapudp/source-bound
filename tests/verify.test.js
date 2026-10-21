"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const SB = require("../verifier/verify.js");

const ex = (name) => ({
  source: fs.readFileSync(path.join(__dirname, "..", "examples", name, "source.txt"), "utf8"),
  extraction: JSON.parse(fs.readFileSync(path.join(__dirname, "..", "examples", name, "extraction.json"), "utf8")),
});

test("email example: every verdict", () => {
  const { source, extraction } = ex("email");
  const { format, spans } = SB.parseExtraction(extraction);
  assert.strictEqual(format, "ScaleDown Extract");
  const status = Object.fromEntries(SB.verifyAll(source, spans).results.map((r) => [r.field, r.status]));
  assert.deepStrictEqual(status, {
    order_id: "exact", weight: "exact", hs_code: "exact", customs_broker: "exact",
    new_delivery_date: "misplaced", carrier_reference: "unaligned", insurance_value: "absent", sender_name: "exact",
  });
});

test("misplaced value reports where the text really is", () => {
  const { source, extraction } = ex("email");
  const r = SB.verifyAll(source, SB.parseExtraction(extraction).spans).results.find((x) => x.field === "new_delivery_date");
  const chars = Array.from(source);
  assert.strictEqual(chars.slice(r.correctedStart, r.correctedEnd).join(""), "17 Oct");
});

test("Hindi example: byte offsets detected; forcing characters fails", () => {
  const { source, extraction } = ex("hindi");
  const spans = SB.parseExtraction(extraction).spans;
  const auto = SB.verifyAll(source, spans);
  assert.strictEqual(auto.verified, 4);
  assert.deepStrictEqual(auto.units, ["byte"]);
  assert.strictEqual(SB.verifyAll(source, spans, { unit: "codepoint" }).verified, 0);
});

test("Anthropic citations and LangExtract shapes", () => {
  const c = ex("contract");
  assert.deepStrictEqual(SB.verifyAll(c.source, SB.parseExtraction(c.extraction).spans).results.map((r) => r.status), ["exact", "normalized", "unaligned"]);
  const i = ex("invoice");
  assert.deepStrictEqual(SB.verifyAll(i.source, SB.parseExtraction(i.extraction).spans).counts.unaligned, 1);
});

test("UTF-16 vs code point offsets around an emoji", () => {
  const s = "Box 📦 arrived: ID A-9";
  const i = s.indexOf("A-9");
  assert.strictEqual(SB.verifySpan(s, { text: "A-9", start: i, end: i + 3 }).unit, "utf16");
  assert.strictEqual(SB.verifySpan(s, { text: "A-9", start: i - 1, end: i + 2 }).unit, "codepoint");
});

test("unanchored and out-of-range", () => {
  assert.strictEqual(SB.verifySpan("abc", { text: "abc" }).status, "unanchored");
  assert.strictEqual(SB.verifySpan("abc", { text: "x", start: 10, end: 11 }).status, "out_of_range");
});

test("Span Ledger example verifies itself", () => {
  const entry = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "spec", "examples", "span-ledger-entry.email-hs-code.json"), "utf8"));
  const { source } = ex("email");
  const r = SB.verifyAll(source, SB.parseExtraction(entry).spans).results[0];
  assert.strictEqual(r.status, entry.verification.status);
});

test("ScaleDown chat-completions wrapper is unwrapped", () => {
  const wrapped = { choices: [{ message: { content: JSON.stringify({ entities: [{ text: "b", type: "t", start: 1, end: 2 }] }) } }] };
  assert.strictEqual(SB.verifyAll("abc", SB.parseExtraction(wrapped).spans).results[0].status, "exact");
});
