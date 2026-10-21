// Regenerates examples/*/ and verifier/examples.js with offsets computed from the source text. Run: node tools/build-examples.js
const SB = require("../verifier/verify.js");
const cp = (s, sub, from = 0) => { const i = s.indexOf(sub, from); if (i < 0) throw new Error("missing " + sub); return [SB.fromUtf16Index(s, i, "codepoint"), SB.fromUtf16Index(s, i + sub.length, "codepoint")]; };
const by = (s, sub) => { const i = s.indexOf(sub); return [SB.fromUtf16Index(s, i, "byte"), SB.fromUtf16Index(s, i + sub.length, "byte")]; };
const ent = (type, text, [start, end], confidence, s) => ({ text, type, confidence, start, end, context: s.slice(Math.max(0, s.indexOf(text) - 20), s.indexOf(text) + text.length + 20) });

// 1. Shipping email, ScaleDown Extract response shape
const email = `From: ops@northwind-logistics.example
Subject: Delay on order 44-1829

Hi Priya,

Your order 44-1829 (2 cartons, 18.4 kg) reached the Leicester depot at 06:40 on 14 Oct.
Customs hold: HS code 6110.20 flagged for review by Zöllner Brokerage.
New delivery estimate: 17 Oct. Carrier reference: NWL-77310.

Regards,
Tomás Ruiz`;
const bodyOrder = email.indexOf("44-1829", email.indexOf("Your order"));
const e1 = { entities: [
  { text: "44-1829", type: "order_id", confidence: 0.98, start: SB.fromUtf16Index(email, bodyOrder, "codepoint"), end: SB.fromUtf16Index(email, bodyOrder + 7, "codepoint"), context: "Your order 44-1829 (2 cartons" },
  { text: "18.4 kg", type: "weight", confidence: 0.95, start: cp(email, "18.4 kg")[0], end: cp(email, "18.4 kg")[1], context: "2 cartons, 18.4 kg) reached" },
  { text: "6110.20", type: "hs_code", confidence: 0.91, start: cp(email, "6110.20")[0], end: cp(email, "6110.20")[1], context: "HS code 6110.20 flagged" },
  { text: "Zöllner Brokerage", type: "customs_broker", confidence: 0.88, start: cp(email, "Zöllner Brokerage")[0], end: cp(email, "Zöllner Brokerage")[1], context: "review by Zöllner Brokerage." },
  { text: "17 Oct", type: "new_delivery_date", confidence: 0.86, start: cp(email, "14 Oct")[0], end: cp(email, "14 Oct")[1], context: "estimate: 17 Oct." },
  { text: "NWL-77130", type: "carrier_reference", confidence: 0.83, start: cp(email, "NWL-77310")[0], end: cp(email, "NWL-77310")[1], context: "Carrier reference: NWL-77310." },
  { text: "", type: "insurance_value", confidence: 0.0, start: 0, end: 0, context: "" },
  { text: "Tomás Ruiz", type: "sender_name", confidence: 0.97, start: cp(email, "Tomás Ruiz")[0], end: cp(email, "Tomás Ruiz")[1], context: "Regards,\nTomás Ruiz" },
]};

// 2. Hindi delivery note, offsets in UTF-8 bytes
const hindi = "ऑर्डर 44-1829 लेस्टर डिपो पहुँच गया है। नई डिलीवरी तारीख 17 अक्टूबर है। संदर्भ: NWL-77310";
const e2 = { entities: [
  { text: "44-1829", type: "order_id", confidence: 0.97, start: by(hindi, "44-1829")[0], end: by(hindi, "44-1829")[1], context: "" },
  { text: "लेस्टर डिपो", type: "location", confidence: 0.9, start: by(hindi, "लेस्टर डिपो")[0], end: by(hindi, "लेस्टर डिपो")[1], context: "" },
  { text: "17 अक्टूबर", type: "new_delivery_date", confidence: 0.92, start: by(hindi, "17 अक्टूबर")[0], end: by(hindi, "17 अक्टूबर")[1], context: "" },
  { text: "NWL-77310", type: "carrier_reference", confidence: 0.95, start: by(hindi, "NWL-77310")[0], end: by(hindi, "NWL-77310")[1], context: "" },
]};

// 3. Contract clause, Anthropic char_location citations
const contract = `7.2 Termination. Either party may terminate this Agreement for convenience on thirty (30) days' written notice to the other party.
7.3 Fees on termination. On termination under clause 7.2 the Customer shall pay all fees accrued up to the termination date.
9.1 Liability cap. Each party's total liability shall not exceed the fees paid in the twelve (12) months before the claim.`;
const c = (t) => { const [s, e] = cp(contract, t); return { type: "char_location", cited_text: t, document_index: 0, start_char_index: s, end_char_index: e }; };
const c2 = c("Either party may terminate this Agreement for convenience on thirty (30) days' written notice to the other party.");
const c3 = c("the Customer shall pay all fees accrued up to the termination date.");
c3.cited_text = "the Customer shall pay  all fees accrued up to the\ntermination date.";
const c4 = { type: "char_location", cited_text: "Each party's total liability shall not exceed twice the fees paid in the twelve (12) months before the claim.", document_index: 0, start_char_index: cp(contract, "Each party's")[0], end_char_index: cp(contract, "before the claim.")[1] };
const e3 = { citations: [c2, c3, c4] };

// 4. Invoice text, Google LangExtract shape
const invoice = `INVOICE No. INV-2026-0418
Bill to: Harbour Freight Traders Ltd, 12 Quay Road, Felixstowe IP11 3DL
Date: 2 Oct 2026    Due: 1 Nov 2026
Ocean freight Shanghai to Felixstowe, 1 x 40ft container    USD 3,840.00
Terminal handling                                            USD   265.00
Total due                                                    USD 4,105.00`;
const lx = (cls, t, status, override) => { const [s, e] = override || cp(invoice, t); return { extraction_class: cls, extraction_text: t, char_interval: { start_pos: s, end_pos: e }, alignment_status: status }; };
const e4 = { extractions: [
  lx("invoice_number", "INV-2026-0418", "match_exact"),
  lx("customer", "Harbour Freight Traders Ltd", "match_exact"),
  lx("due_date", "1 Nov 2026", "match_exact"),
  lx("total", "USD 4,105.00", "match_exact"),
  lx("total", "USD 4,150.00", "match_fuzzy", cp(invoice, "USD 4,105.00")),
] };

const fs = require("fs"); process.chdir(require("path").join(__dirname, ".."));
const ex = [
  { id: "email", title: "Shipping email (ScaleDown Extract shape)", source: email, extraction: e1 },
  { id: "hindi", title: "Hindi delivery note: offsets in bytes", source: hindi, extraction: e2 },
  { id: "contract", title: "Contract clause (Anthropic citations shape)", source: contract, extraction: e3 },
  { id: "invoice", title: "Freight invoice (Google LangExtract shape)", source: invoice, extraction: e4 },
];
for (const x of ex) {
  fs.mkdirSync(`examples/${x.id}`, { recursive: true });
  fs.writeFileSync(`examples/${x.id}/source.txt`, x.source);
  fs.writeFileSync(`examples/${x.id}/extraction.json`, JSON.stringify(x.extraction, null, 2) + "\n");
}
fs.writeFileSync("verifier/examples.js", "// Generated from examples/*/ — illustrative inputs in the documented response shapes, not real model outputs.\nwindow.SOURCE_BOUND_EXAMPLES = " + JSON.stringify(ex, null, 2) + ";\n");
for (const x of ex) {
  const { format, spans } = SB.parseExtraction(x.extraction);
  const r = SB.verifyAll(x.source, spans);
  console.log(`\n== ${x.id} [${format}] SVR=${r.spanVerifiableRate && r.spanVerifiableRate.toFixed(2)} coverage=${r.provenanceCoverage && r.provenanceCoverage.toFixed(2)} units=${r.units}`);
  r.results.forEach((q) => console.log(`  ${q.field.padEnd(20)} ${q.status.padEnd(12)} unit=${q.unit || "-"} slice=${JSON.stringify(q.slice || "")}${q.correctedStart != null ? " fix=" + q.correctedStart + "-" + q.correctedEnd : ""}`));
}
// forced unit check: hindi as codepoint must fail
const h = SB.verifyAll(hindi, SB.parseExtraction(e2).spans, { unit: "codepoint" });
console.log("\nhindi forced codepoint:", JSON.stringify(h.counts));
// emoji utf16 vs codepoint
const em = "Box 📦 arrived: ID A-9";
const i = em.indexOf("A-9");
console.log("emoji utf16:", SB.verifySpan(em, { text: "A-9", start: i, end: i + 3 }).unit, " codepoint:", SB.verifySpan(em, { text: "A-9", start: i - 1, end: i + 2 }).unit);
