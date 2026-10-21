// Source-Bound pointer verifier — pure functions, no DOM. Works in the browser and in Node.
(function (root) {
  "use strict";

  const UNITS = ["codepoint", "utf16", "byte"];

  function utf8Len(code) {
    return code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
  }

  // Convert an offset measured in `unit` into a JavaScript (UTF-16) string index.
  // Returns -1 when the offset does not land on a character boundary in that unit.
  function toUtf16Index(str, idx, unit) {
    if (!Number.isInteger(idx) || idx < 0) return -1;
    if (unit === "utf16") return idx <= str.length ? idx : -1;
    let cp = 0, bytes = 0, i = 0;
    for (;;) {
      const pos = unit === "codepoint" ? cp : bytes;
      if (pos === idx) return i;
      if (pos > idx || i >= str.length) return -1;
      const code = str.codePointAt(i);
      bytes += utf8Len(code);
      cp += 1;
      i += code > 0xffff ? 2 : 1;
    }
  }

  function fromUtf16Index(str, i16, unit) {
    if (unit === "utf16") return i16;
    let cp = 0, bytes = 0, i = 0;
    while (i < i16 && i < str.length) {
      const code = str.codePointAt(i);
      bytes += utf8Len(code);
      cp += 1;
      i += code > 0xffff ? 2 : 1;
    }
    return unit === "codepoint" ? cp : bytes;
  }

  function norm(s) {
    return String(s).normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function findAll(source, text) {
    const out = [];
    if (!text) return out;
    let i = source.indexOf(text);
    while (i !== -1 && out.length < 10) {
      out.push({ start16: i, end16: i + text.length });
      i = source.indexOf(text, i + 1);
    }
    return out;
  }

  const NOTES = {
    exact: "The text at these offsets is exactly what the model claimed.",
    normalized: "Matches after normalising case and whitespace. Usually fine; decide whether formatting matters for this field.",
    misplaced: "The claimed text is in the source, but not where the offsets point. Fix or recompute the offsets before storing the pointer.",
    unaligned: "The claimed text does not appear anywhere in the source. Treat as fabricated or transformed: never store it without review.",
    unanchored: "A value with no pointer. It cannot be checked by slicing; route it to review or re-extract.",
    absent: "No span was returned. Record 'not found', never a value at position 0.",
    out_of_range: "The offsets fall outside the source. The source may have changed, or a transform (OCR, compression) moved the text.",
    pointer_only: "A pointer with no claimed text to compare. The slice is shown; nothing can be verified.",
  };

  // span: { field?, text?, value?, start?, end?, confidence?, context? }
  function verifySpan(source, span, opts) {
    const unitOpt = (opts && opts.unit) || "auto";
    const units = unitOpt === "auto" ? UNITS : [unitOpt];
    const claimed = span.text != null && span.text !== "" ? String(span.text)
      : span.value != null && span.value !== "" ? String(span.value) : "";
    const base = { field: span.field || "", claimed, start: span.start, end: span.end,
      confidence: typeof span.confidence === "number" ? span.confidence : null };
    const noOffsets = span.start == null || span.end == null || (span.start === 0 && span.end === 0);

    if (noOffsets) {
      if (!claimed) return Object.assign(base, { status: "absent", note: NOTES.absent });
      const found = findAll(source, claimed);
      return Object.assign(base, { status: "unanchored", found,
        note: NOTES.unanchored + (found.length ? " The text does appear in the source." : " The text does not appear in the source.") });
    }

    let firstSlice = null;
    for (const unit of units) {
      const s = toUtf16Index(source, span.start, unit);
      const e = toUtf16Index(source, span.end, unit);
      if (s < 0 || e < 0 || e < s) continue;
      const slice = source.slice(s, e);
      if (!firstSlice) firstSlice = { unit, start16: s, end16: e, slice };
      if (!claimed) return Object.assign(base, { status: "pointer_only", unit, start16: s, end16: e, slice, note: NOTES.pointer_only });
      if (slice === claimed || norm(slice) === norm(claimed)) {
        const status = slice === claimed ? "exact" : "normalized";
        let note = NOTES[status];
        if (unit === "byte") note += " Warning: these offsets are UTF-8 bytes. Slicing them as characters breaks on any non-ASCII text (accents, Hindi, Arabic, emoji).";
        if (unit === "utf16" && unitOpt === "auto") note += " Note: these offsets are UTF-16 code units (JavaScript-style), not characters.";
        return Object.assign(base, { status, unit, start16: s, end16: e, slice, note });
      }
    }

    if (!firstSlice) return Object.assign(base, { status: "out_of_range", note: NOTES.out_of_range });
    const found = findAll(source, claimed);
    if (found.length) {
      const f = found[0];
      return Object.assign(base, {
        status: "misplaced", unit: firstSlice.unit, start16: firstSlice.start16, end16: firstSlice.end16, slice: firstSlice.slice, found,
        correctedStart: fromUtf16Index(source, f.start16, "codepoint"), correctedEnd: fromUtf16Index(source, f.end16, "codepoint"),
        note: NOTES.misplaced,
      });
    }
    return Object.assign(base, { status: "unaligned", unit: firstSlice.unit, start16: firstSlice.start16, end16: firstSlice.end16, slice: firstSlice.slice, note: NOTES.unaligned });
  }

  function verifyAll(source, spans, opts) {
    const results = spans.map((sp) => verifySpan(source, sp, opts));
    const counts = { exact: 0, normalized: 0, misplaced: 0, unaligned: 0, unanchored: 0, absent: 0, out_of_range: 0, pointer_only: 0 };
    results.forEach((r) => { counts[r.status] += 1; });
    const claims = results.length - counts.absent - counts.pointer_only;
    const verified = counts.exact + counts.normalized;
    const pointed = claims - counts.unanchored;
    return {
      results, counts, total: results.length, claims, verified,
      spanVerifiableRate: claims ? verified / claims : null,
      provenanceCoverage: claims ? pointed / claims : null,
      units: Array.from(new Set(results.map((r) => r.unit).filter(Boolean))),
    };
  }

  // Accepts several published extraction shapes and returns { format, spans }.
  function parseExtraction(input) {
    let obj = typeof input === "string" ? JSON.parse(input) : input;
    if (obj && Array.isArray(obj.choices) && obj.choices[0] && obj.choices[0].message) {
      const c = obj.choices[0].message.content;
      obj = typeof c === "string" ? JSON.parse(c) : c;
    }
    if (obj && Array.isArray(obj.entities)) {
      return { format: "ScaleDown Extract", spans: obj.entities.map((e) => ({
        field: e.type, text: e.text, start: e.start, end: e.end, confidence: e.confidence, context: e.context })) };
    }
    if (obj && Array.isArray(obj.extractions)) {
      return { format: "Google LangExtract", spans: obj.extractions.map((x) => ({
        field: x.extraction_class, text: x.extraction_text,
        start: x.char_interval ? x.char_interval.start_pos : null, end: x.char_interval ? x.char_interval.end_pos : null })) };
    }
    const cites = Array.isArray(obj) && obj.length && obj[0] && "start_char_index" in obj[0] ? obj
      : obj && Array.isArray(obj.citations) ? obj.citations : null;
    if (cites) {
      return { format: "Anthropic citations (char_location)", spans: cites.map((c, i) => ({
        field: "citation " + (i + 1), text: c.cited_text, start: c.start_char_index, end: c.end_char_index })) };
    }
    const entries = obj && obj.spec_version ? [obj] : obj && Array.isArray(obj.entries) ? obj.entries
      : Array.isArray(obj) && obj.length && obj[0] && obj[0].selector ? obj : null;
    if (entries) {
      return { format: "Span Ledger", spans: entries.map((r) => {
        const pos = r.selector && r.selector.position;
        const quote = r.selector && r.selector.quote;
        return { field: r.field && r.field.name, text: quote ? quote.exact : null, value: r.value,
          start: pos ? pos.start : null, end: pos ? pos.end : null, confidence: r.confidence };
      }) };
    }
    if (Array.isArray(obj)) {
      return { format: "Generic [{start, end, text}]", spans: obj.map((x, i) => ({
        field: x.field || x.type || x.label || "span " + (i + 1), text: x.text != null ? x.text : x.value,
        start: x.start, end: x.end, confidence: x.confidence })) };
    }
    throw new Error("Unrecognised extraction format. Expected ScaleDown Extract, LangExtract, Anthropic citations, Span Ledger, or an array of {start, end, text}.");
  }

  const api = { UNITS, NOTES, toUtf16Index, fromUtf16Index, verifySpan, verifyAll, parseExtraction };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SourceBound = api;
})(typeof window !== "undefined" ? window : globalThis);
