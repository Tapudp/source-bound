# Concepts

*Source-Bound · v0.1*

## Written up

- **[Point, Don't Write](point-dont-write.md)** — the four things a model can do with a document (decide, point, write, cut), the rule for choosing, and a ten-way taxonomy of how pointers fail.
- **[Verify by Slice](verify-by-slice.md)** — *verifiable* (the quote is really there, checked for free) versus *supported* (it is the right quote, checked at a price); three metrics; a cost model.
- **[Chain of Custody](chain-of-custody.md)** — every step between the document and the value; OCR and compression as places where pointers break; compression priced as a reject rule.

## Defined, not yet written up

**Source Pane.** Showing the highlighted source next to an AI answer is not enough: in one study it lowered people's trust in AI edits, but they still accepted them [1]. A Source Pane is a review pattern that makes the reviewer *decide* — confirm, correct, or reject — with the quote in view, and records that decision as the support check.

**Pointable Schema Design.** Design extraction schemas so that every stored field can be pointed at. Totals, normalised dates and converted units are not pointable; extract the parts verbatim and compute the rest in code. Mark each field `pointable: true/false` in the [Span Ledger](../spec/span-ledger-entry.schema.json).

**Absence Is an Answer.** "Not found" is a value, with its own status, its own log entry and its own review policy — never an empty string or position zero.

**The Span Ledger as Audit Evidence.** A ledger of values, source hashes, pointers and checks is the kind of record auditors and regulators are starting to ask for: EU AI Act Article 12 record-keeping [2], GDPR's right to meaningful information about automated decisions, and auditors' duty to evaluate electronic information provided by the company [3].

**Interoperable Pointers.** Every vendor returns pointers in a different shape. Use W3C Web Annotation selectors (`TextPositionSelector`, `TextQuoteSelector`) as the common form [4] — the Span Ledger does.

## Sibling project

**[Judgment Architecture](https://github.com/Tapudp/judgement-architecture)** covers the *decide* half: where to set a confidence threshold, what review and errors cost, and how to design for "the AI isn't sure". Source-Bound covers the *point* half. They share one idea: an AI output is only as useful as your ability to check it.

---

1. "PaperTrail", arXiv 2602.21045. https://arxiv.org/abs/2602.21045
2. EU AI Act, Article 12. https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-12
3. PCAOB — amendments on technology-assisted analysis of information in electronic form (AS 1105). https://pcaobus.org/oversight/standards/implementation-resources-PCAOB-standards-rules/amendments-related-to-aspects-of-designing-and-performing-audit-procedures-that-involve-technology-assisted-analysis-of-information-in-electronic-form
4. W3C — Web Annotation Data Model, selectors. https://www.w3.org/TR/annotation-model/#selectors
