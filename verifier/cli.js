#!/usr/bin/env node
// Usage: node verifier/cli.js <source.txt> <extraction.json> [--unit auto|codepoint|utf16|byte] [--json]
// Exit code 1 if any claimed value is unaligned, misplaced, unanchored or out of range.
"use strict";
const fs = require("fs");
const SB = require("./verify.js");

const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith("--") && !["auto", "codepoint", "utf16", "byte"].includes(a));
const unitIdx = args.indexOf("--unit");
const unit = unitIdx >= 0 ? args[unitIdx + 1] : "auto";
if (files.length !== 2) {
  console.error("Usage: node verifier/cli.js <source.txt> <extraction.json> [--unit auto|codepoint|utf16|byte] [--json]");
  process.exit(2);
}

const source = fs.readFileSync(files[0], "utf8");
const { format, spans } = SB.parseExtraction(fs.readFileSync(files[1], "utf8"));
const report = SB.verifyAll(source, spans, { unit });

if (args.includes("--json")) {
  console.log(JSON.stringify({ format, ...report }, null, 2));
} else {
  const pct = (x) => (x == null ? "n/a" : Math.round(x * 100) + "%");
  console.log(`Format: ${format}   Offsets: ${report.units.join(", ") || "none"}`);
  console.log(`Span-verifiable rate: ${pct(report.spanVerifiableRate)}   Provenance coverage: ${pct(report.provenanceCoverage)}\n`);
  for (const r of report.results) {
    const fix = r.correctedStart != null ? `  (found at ${r.correctedStart}-${r.correctedEnd})` : "";
    console.log(`${r.status.toUpperCase().padEnd(13)} ${String(r.field).padEnd(22)} ${JSON.stringify(r.claimed)}${fix}`);
  }
}

const bad = ["unaligned", "misplaced", "unanchored", "out_of_range"].reduce((n, k) => n + report.counts[k], 0);
process.exit(bad ? 1 : 0);
