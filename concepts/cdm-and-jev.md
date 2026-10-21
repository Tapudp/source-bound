# Constrained Decoding Models, and how they relate to Jev

*Source-Bound · background · v0.1 · as of 21 October 2026*

> **In scope, a CDM is a superset of Jev. In proof, it is not yet.**

## What a "Constrained Decoding Model" is

On 13 October 2026 ScaleDown launched what it calls **Constrained Decoding Models (CDMs)**: small task models that are "200x faster and 467x cheaper" than frontier LLMs on narrow jobs, with a 1-million-token context that accepts text, images and PDFs, at $0.05 per million input tokens and no charge for output [1][2]. The family has four members [2][3]:

| Model | What it does | Kind of output |
|---|---|---|
| **Classify** | Scores your input against labels you define, each with a yes/no *rubric*; returns a probability per label and, optionally, a one-sentence reason | **decides** |
| **Extract** | Takes plain-English field descriptions; returns the matching text with its start and end position, a confidence score and the surrounding context | **points** |
| **Summarize** | Rewrites long input as a short summary in its own words | **writes** |
| **Compress** | Cuts context down to the parts relevant to a question | **cuts** |

The name needs one clarification. *Constrained decoding* is an established technique: masking a language model's next-token choices so its output must fit a grammar or schema (libraries such as Outlines and XGrammar do this for any model) [4][5]. ScaleDown uses the phrase as a product name for this family, and the family is not uniform: Summarize generates text in the usual way, despite the launch line that the models "skip the generative loop" [4][5].

## Jev, for comparison

TypeSafe's **Jev**, launched a month earlier, is a *decision model*: send text plus typed questions — **choice** (pick one of up to 255 options), **score** (a level on a 2–10 rubric) or **noul** (the probability a statement is true) — and get typed answers with calibrated probabilities, at $0.042 per million input tokens, with a 64k-token context [6][7].

## Why "superset" is fair — in scope

ScaleDown describes its decisions endpoint as "a drop-in replacement for the Jev Decisions API": the same request and response shape, with the same three question types — choice, noul and score [8]. On top of that, the CDM family adds things Jev does not offer:

| | Jev | CDMs |
|---|---|---|
| Decide: choice / score / yes-no | yes | **yes**, same API shape [8] |
| **Point** at text in the source (offsets + confidence) | no (Jev 1.14 adds a `box` answer for images [9]) | **yes** — Extract [3] |
| Write a summary | no, by design | **yes** — Summarize |
| Compress context | no | **yes** — Compress |
| Images and PDFs as input, OCR built in | no — text only [7] | **yes** [3][10] |
| Context window | 64k tokens [7] | **1M tokens** [2] |
| One-sentence reason with a decision | no | **yes** (optional; billed at 2x) [10] |
| Batch many chunks in one call | via many questions | **yes**, up to 50 chunks [10] |

Read as a menu of capabilities, CDMs cover what Jev does and add pointing, summarising, compressing and documents.

## Why "superset" is not the whole story

| | Jev | CDMs |
|---|---|---|
| State you can send | any JSON object; questions can point at named fields | decisions endpoint reads only `state.text` and `state.document` [8] |
| Options per decision | up to 255 | up to 20 labels on `/classify` (16 in multi-label mode) [10] |
| Model choice | several versions; pin a version | one model, `classify` / `classify-1` [8] |
| Image answers (`box`) | yes, in Jev 1.14 [9] | not documented [8] |
| Independent benchmark | on Hanno Labs' DecisionBench (Jev 1.13: 71.9%) [11] | **not listed**; the "77.2% vs Jev's 72%" figure appears only in ScaleDown's launch post [11][12] |
| Calibration evidence | claimed via training method; partially measured by third parties | claimed ("calibrated scores"); **no published reliability data** [10] |
| Accuracy claims | vendor + independent tests | **vendor only**, reported as deltas against averages of other providers [12][13] |

So the honest summary is: **a superset in scope, narrower in a few specifics, and unproven where it counts most** — whether its confidence scores mean what they say.

## What actually matters here: pointing

Of everything CDMs add, one capability changes how systems can be built: **Extract points instead of writing**. A written value cannot be checked without re-reading the document; a pointed value can be checked by anyone, for free, by slicing the source at the returned positions. That is the subject of this repository:

- [Point, Don't Write](point-dont-write.md) — when to decide, point, write or cut, and how pointers fail.
- [Verify by Slice](verify-by-slice.md) — the free check and the paid check.
- [Chain of Custody](chain-of-custody.md) — what OCR and compression do to pointers.
- [Pointer Verifier](../verifier/) — the check itself.

And two things in ScaleDown's own documentation show why the check is needed: Extract positions are described as characters in one place and bytes in another, and a field with no evidence comes back as `start: 0, end: 0` [3]. The verifier catches both.

## The wider category

CDMs and Jev are two of many. By 21 October OpenRouter's Decisions API listed 27 decision-type models, including OpenAI's (public beta 6 October, $0.10 per million) and Cloudflare's open-weight Clef (1 October) [14][15][16]. Pointing exists outside this category too: Anthropic's citations, Google's LangExtract and the open-source GLiNER all return positions [17][18][19]. Source-Bound is written to work with any of them.

---

### References

1. ScaleDown launch (via Exec Sum on X). https://x.com/exec_sum/status/2110045480398803243
2. LangChain — Building long-running agents with ScaleDown and Deep Agents. https://www.langchain.com/blog/building-long-running-agents-with-scaledown-and-deep-agents
3. ScaleDown — Extract API reference. https://docs.scaledown.ai/api-reference/extract.md
4. ibl.ai — "Constrained Decoding Models Are Not a New Architecture". https://ibl.ai/blog/constrained-decoding-models-not-a-new-architecture
5. "Your model doesn't need to write the answer. It needs to point at it." https://dev.to/smit153/your-model-doesnt-need-to-write-the-answer-it-needs-to-point-at-it-44p4
6. TypeSafe AI — Primitives and API reference. https://docs.typesafe.ai/primitives ; https://docs.typesafe.ai/api.md
7. TypeSafe AI — Models (pricing, 64k context, text only). https://docs.typesafe.ai/models
8. ScaleDown — Decisions API overview ("A drop-in replacement for the Jev Decisions API"). https://docs.scaledown.ai/api-reference/decisions-overview.md
9. OpenRouter — Jev guide (`box` answers in Jev 1.14; ScaleDown takes its own `state` shape). https://openrouter.ai/docs/guides/community/jev
10. ScaleDown — Classify API reference (20 labels, 50 chunks, documents, reasoning billed at 2x, "calibrated scores"). https://docs.scaledown.ai/api-reference/classify.md
11. Hanno Labs — DecisionBench. https://hannolabs.ai/field-notes/decisionbench
12. Advance Intelligence — launch coverage ("77.2% on DecisionBench, versus 72% for Jev"). https://www.advanceintelligence.ai/story/2026-10-13-02
13. ScaleDown — Benchmarks overview and methodology. https://docs.scaledown.ai/benchmarks/overview ; https://docs.scaledown.ai/benchmarks/methodology
14. OpenRouter — decision-output models. https://openrouter.ai/api/v1/models?output_modalities=decisions
15. OpenAI Decisions API public beta (summary). https://www.orcarouter.ai/blog/openai-decisions-api-public-beta
16. Cloudflare — Clef decision models. https://blog.cloudflare.com/clef-decision-models/
17. Anthropic citations `char_location`. https://preview.rubydoc.info/github/anthropics/anthropic-sdk-ruby/Anthropic/Models/CitationCharLocation
18. Google — LangExtract. https://developers.googleblog.com/en/introducing-langextract-a-gemini-powered-information-extraction-library/
19. GLiNER2.5. https://www.marktechpost.com/2026/08/24/fastino-releases-gliner2-5-a-boundary-prediction-architecture-that-removes-span-enumeration-from-information-extraction/
