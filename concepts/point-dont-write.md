# Point, Don't Write

*Source-Bound · concept · v0.1*

> **Never let a model write what it could point at.**

## Four things a model can do with your document

Until recently, asking AI for a fact from a document meant asking a generative model to *write* the fact. In 2026 a set of models appeared that do something else [1][2][3]. Seen from the outside, a model can now do one of four things:

| Kind | What it returns | Can it invent? | Can you check it for free? | Examples |
|---|---|---|---|---|
| **Decide** | one option from a list you gave it, with a probability | no: only your options | no: you need a labelled sample | TypeSafe Jev, ScaleDown Classify, OpenAI Decisions, Cloudflare Clef [1][2][4][5] |
| **Point** | a position in your document: *characters 93 to 100* | no: only text that is there | **yes**: look at the source | ScaleDown Extract, Google LangExtract, Anthropic citations, GLiNER [2][6][7][8] |
| **Write** | new text in the model's own words | yes | no | any LLM; ScaleDown Summarize [2][9] |
| **Cut** | a shorter version of your input | depends: selection can't invent, rewriting can | partly | ScaleDown Compress, LLMLingua [2][10] |

The fourth column is the whole idea. A written value — an order number, a date, an amount — looks equally plausible whether it is right or has two digits swapped. A **pointed** value carries its own receipt: anyone can slice the source at those positions and see whether the text is really there. That check is deterministic, needs no model, and costs nothing.

## The rule

1. **Decide** whenever the answer is one of a known set of options.
2. **Point** whenever the answer is text that exists in the source.
3. **Compute** in ordinary code anything derived from pointed values: totals, normalised dates, unit conversions.
4. **Write** only what genuinely cannot be pointed at: a summary for a person, a draft reply.
5. **Cut** only with a record of what was cut — see [Chain of Custody](chain-of-custody.md).

Most extraction pipelines today do the opposite: they ask a generative model to write every field, then try to catch mistakes afterwards.

## What pointing guarantees, and what it does not

Pointing removes one failure — invented text — *if and only if someone checks the pointer*. Every product that returns offsets today leaves that check to you. The [Pointer Verifier](../verifier/) does it.

A pointer can still be wrong in other ways. This is the taxonomy the verifier and the [Span Ledger](../spec/span-ledger-entry.schema.json) use:

| Failure | What happened | Caught by slicing? |
|---|---|---|
| **Unaligned** | the claimed text appears nowhere in the source | **yes** |
| **Misplaced** | the text exists, the offsets point elsewhere | **yes** (and the right position can be found) |
| **Out of range** | the offsets fall outside the document | **yes** |
| **Unit mismatch** | offsets counted in bytes, read as characters (or the reverse) | **yes**, by trying each unit |
| **Absent as zero** | "not found" returned as position 0 | **yes**, if you look for it [11] |
| **Unanchored** | a value returned with no pointer at all | **yes**: it fails by definition |
| **Wrong span** | a real quote, but not the answer to the question | no: needs a second check |
| **Wrong field** | the right text assigned to the wrong field | no: needs a second check |
| **Transform drift** | OCR misread or compression rewrote the text the pointer refers to | only if the transform is recorded |
| **Hostile source** | the document contains text written to mislead the extractor | no |

The first six are free to catch. The last four are why [Verify by Slice](verify-by-slice.md) separates *verifiable* from *supported*.

## Two traps found in the 2026 documentation

- **What do the offsets count?** Python counts characters (code points). JavaScript counts UTF-16 units. Some APIs count UTF-8 bytes. They agree on plain English and disagree on "Zöllner", on Hindi, Arabic and emoji. ScaleDown's own documentation describes Extract offsets as character positions in one place and byte positions in another [11]. If you slice with the wrong unit, every pointer after the first non-ASCII character lands in the wrong place. The verifier detects the unit automatically.
- **Is zero "nothing" or "the start"?** One documented response returns `start = 0, end = 0` for a field with no evidence [11]. That is indistinguishable from a real span at the start of the document unless the text is also empty. Treat it as *absent*.

## Prior art

Pointing is not new. Pointer Networks (2015) taught models to output positions in their input [12]; SQuAD (2016) made span extraction the standard reading-comprehension task [13]; the attribution literature defined *Attributable to Identified Sources* [14]; W3C Web Annotation standardised how to point at text, with `TextPositionSelector` and `TextQuoteSelector` [15]. The closest named idea is "Warranted Extraction", a September 2026 defensive publication in which a deterministic verifier ties every claim to a verbatim span in a hash-pinned source [16].

What is new in 2026 is that pointing models became cheap commodity APIs — and nothing vendor-neutral tells teams how to use them, check them, or log them. That is what Source-Bound is for.

---

### References

1. TypeSafe AI — Jev introduction. https://docs.typesafe.ai/introduction
2. ScaleDown — documentation. https://docs.scaledown.ai/introduction ; LangChain integration post https://www.langchain.com/blog/building-long-running-agents-with-scaledown-and-deep-agents
3. OpenRouter — models with decision output (27 at the time of writing). https://openrouter.ai/api/v1/models?output_modalities=decisions
4. OpenAI Decisions API public beta (summary). https://www.orcarouter.ai/blog/openai-decisions-api-public-beta
5. Cloudflare — Clef decision models. https://blog.cloudflare.com/clef-decision-models/
6. Google — LangExtract. https://developers.googleblog.com/en/introducing-langextract-a-gemini-powered-information-extraction-library/
7. Anthropic citations `char_location` (SDK reference). https://preview.rubydoc.info/github/anthropics/anthropic-sdk-ruby/Anthropic/Models/CitationCharLocation
8. GLiNER2.5 (Fastino). https://www.marktechpost.com/2026/08/24/fastino-releases-gliner2-5-a-boundary-prediction-architecture-that-removes-span-enumeration-from-information-extraction/
9. "Constrained Decoding Models Are Not a New Architecture" (Summarize is generative). https://ibl.ai/blog/constrained-decoding-models-not-a-new-architecture
10. Microsoft Research — LLMLingua. https://www.microsoft.com/en-us/research/project/llmlingua/
11. ScaleDown — Extract API reference. https://docs.scaledown.ai/api-reference/extract.md
12. Vinyals, Fortunato & Jaitly, "Pointer Networks", 2015. https://arxiv.org/abs/1506.03134
13. Rajpurkar et al., "SQuAD", 2016. https://arxiv.org/abs/1606.05250
14. Rashkin et al., "Measuring Attribution in Natural Language Generation Models", Computational Linguistics, 2023. https://aclanthology.org/2023.cl-4.2/
15. W3C — Web Annotation Data Model, selectors. https://www.w3.org/TR/annotation-model/#text-position-selector
16. J. Rosing, "Warranted Extraction", Technical Disclosure Commons, Sept 2026. https://www.tdcommons.org/dpubs_series/11564
