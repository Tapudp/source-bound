# Source-Bound

**AI that points at its evidence instead of writing its answers — and how to check it.**

*For teams pulling facts out of documents with AI: invoices, emails, contracts, shipping updates, forms. Works with LLMs, extraction models such as ScaleDown's Constrained Decoding Models, Google LangExtract, Anthropic citations, or GLiNER.*

> **Never let a model write what it could point at. Never trust a pointer you haven't checked.**

→ **[Pointer Verifier](verifier/)**: paste a document and an AI extraction; see which answers really come from the source, which were invented, and which point at the wrong place. Runs entirely in your browser. Open `verifier/index.html`, or use this repo's GitHub Pages site.

→ **[How we got here](JOURNEY.md)**: the research behind this repo.

---

## The idea in one example

An AI reads a shipping email and returns the carrier reference.

- A model that **writes** answers returns `NWL-77130`. It looks right. The email actually says `NWL-77310`. Nothing in the answer tells you two digits are swapped.
- A model that **points** returns *characters 291 to 300*. You look at characters 291 to 300. Either the text is there or it isn't.

The second answer can be checked by anyone, for free, in a microsecond. That changes how extraction systems should be built — but only if somebody actually does the check. In October 2026, every API that returns pointers leaves that check to you.

## Why now

Since September 2026 a new class of AI models has appeared that does not write text at all. TypeSafe's Jev *decides* [1]. On 13 October, ScaleDown launched "Constrained Decoding Models", whose Extract model *points*: it returns the exact span of your document, with start and end positions and a confidence score [2]. OpenRouter already lists 27 decision-type models [3].

These models are fast and cheap. What is missing is a vendor-neutral way to use them safely: how to check a pointer, what the checks cost, what to log, and what happens to pointers when documents are OCR'd or compressed on the way in.

## The concepts

| Concept | One line | Status |
|---|---|---|
| **[Point, Don't Write](concepts/point-dont-write.md)** | Four things a model can do — decide, point, write, cut — and a ten-way taxonomy of how pointers fail. | **v0.1** |
| **[Verify by Slice](concepts/verify-by-slice.md)** | *Verifiable* (the quote is really there: free) vs *supported* (it's the right quote: costs money). Three metrics and a cost model. | **v0.1** |
| **[Chain of Custody](concepts/chain-of-custody.md)** | Every step from document to value. OCR and compression break pointers; compression priced as a reject rule. | **v0.1** |
| Source Pane · Pointable Schema Design · Absence Is an Answer · Span Ledger as Audit Evidence · Interoperable Pointers | | [stubs](concepts/index.md) |

## What's in the repo

| Path | What it is |
|---|---|
| [`verifier/`](verifier/) | The Pointer Verifier page, plus `verify.js` (dependency-free; browser and Node) and `cli.js` for CI |
| [`spec/span-ledger-entry.schema.json`](spec/span-ledger-entry.schema.json) | **Span Ledger** — one extracted value with its source hash, pointer, transform chain and check results. Uses W3C Web Annotation selectors. Draft. |
| [`examples/`](examples/) | Four inputs in the documented response shapes of ScaleDown Extract, Google LangExtract and Anthropic citations — including a Hindi document with byte offsets |
| [`tests/`](tests/) | `node --test` |

### Use it in CI

```bash
node verifier/cli.js examples/email/source.txt examples/email/extraction.json
# exits 1 if any value is unaligned, misplaced, unanchored or out of range
```

```
Format: ScaleDown Extract   Offsets: codepoint
Span-verifiable rate: 71%   Provenance coverage: 100%

EXACT         order_id               "44-1829"
EXACT         hs_code                "6110.20"
MISPLACED     new_delivery_date      "17 Oct"  (found at 264-270)
UNALIGNED     carrier_reference      "NWL-77130"
ABSENT        insurance_value        ""
...
```

## Two traps the verifier catches that you might not expect

1. **Offsets in the wrong unit.** Python counts characters, JavaScript counts UTF-16 units, some APIs count bytes. They agree on English and disagree on "Zöllner", Hindi, Arabic and emoji. ScaleDown's documentation describes Extract offsets as characters in one place and bytes in another [4]. Slice with the wrong unit and every pointer after the first accent is off. The verifier detects the unit.
2. **"Not found" returned as position 0.** One documented response returns `start: 0, end: 0` when there is no evidence [4]. The verifier reports it as *absent*, not as a value at the start of the document.

## What this is not

- **Not a vendor.** Nothing here depends on any one model or API.
- **Not new science.** Pointing goes back to Pointer Networks (2015) and SQuAD (2016); attribution research named the problem in 2023; W3C standardised text selectors years ago. See the references in each concept page.
- **Not a correctness checker.** A verified pointer proves the quote is real, not that it answers the question. That second check is the subject of [Verify by Slice](concepts/verify-by-slice.md).
- **Not finished.** v0.1. The examples are illustrative inputs in real response shapes, not real model outputs.

## Sibling project

**[Judgment Architecture](https://github.com/Tapudp/judgement-architecture)**: the same thinking for the *decide* half — where to set the confidence threshold, and what review and mistakes really cost.

## Licence

Text: [CC BY 4.0](LICENSE-TEXT). Code and schemas: [Apache-2.0](LICENSE-CODE).

---

### References

1. TypeSafe AI — Jev introduction. https://docs.typesafe.ai/introduction
2. ScaleDown — documentation. https://docs.scaledown.ai/introduction ; LangChain integration https://www.langchain.com/blog/building-long-running-agents-with-scaledown-and-deep-agents
3. OpenRouter — decision-output models. https://openrouter.ai/api/v1/models?output_modalities=decisions
4. ScaleDown — Extract API reference. https://docs.scaledown.ai/api-reference/extract.md
