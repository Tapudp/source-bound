# How we got here

*The research behind Source-Bound. Written 21 October 2026.*

---

## 1. Where it started

A month earlier we had published [Judgment Architecture](https://github.com/Tapudp/judgement-architecture), after studying TypeSafe's Jev — a model that *decides* instead of writing. On 13 October a second launch arrived: ScaleDown's **Constrained Decoding Models**, presented as "a new AI model architecture" for classification, extraction and summarisation, "200x faster and 467x cheaper" than frontier models [1][2].

The question was the same as before: is there something worth building on top of this?

## 2. Reading past the launch

We read ScaleDown's documentation, its benchmark pages, the LangChain integration, and the first independent write-ups [2][3][4][5]. What we found:

- **The name is a product name, not an architecture.** "Constrained decoding" normally means masking a language model's tokens so its output fits a schema [4]. ScaleDown's family is four small task models: Classify *decides*; **Extract points**; Summarize *writes* — it is generative, despite the launch line that the models "skip the generative loop"; Compress *cuts* context [4][5].
- **The accuracy claims are the vendor's own.** Results are published as deltas against averages of other providers' models, without absolute scores or sample sizes. ScaleDown's extraction model beats the free, open GLiNER2.5 by 0.2 points on its own benchmark [3][4]. ScaleDown does not appear on the independent DecisionBench leaderboard [6].
- **It is not alone.** By 21 October OpenRouter listed 27 decision-type models from TypeSafe, ScaleDown, OpenAI, Cloudflare, Microsoft, Perplexity, Together and others [7].

So, again, building a wrapper or a router would mean joining a crowd.

## 3. The one genuinely different thing

One capability stood out: **Extract returns a position, not a value.** It says "the order number is characters 93 to 100", with a confidence score and the surrounding text [3][5]. A position can be checked by anyone, for free, by looking at the document. A written answer cannot.

Then we noticed what nobody was doing with that. Anthropic's citations, Google's LangExtract, document-AI vendors and ScaleDown all return pointers — and **none of them checks the pointer against the source for you** [8].

## 4. What we found when we looked closely

- **Offsets in the wrong unit.** ScaleDown's documentation describes Extract positions as characters in one place and bytes in another [3]. On English text the difference is invisible; on "Zöllner", Hindi or Arabic it moves every pointer.
- **"Not found" as position 0.** One documented response returns `start = 0, end = 0` when there is no evidence [3] — indistinguishable from a real span unless you check.
- **A real quote can still be the wrong quote.** The best verbatim-span selector in one study reached only 53.6 F1 [9]. Pointing stops invention, not error.
- **Compression detaches pointers.** After compressing context, citation precision fell from 0.86 to 0.12 when checked against the original source [10].
- **Showing the source is not enough.** In a user study, highlighting sources lowered trust in AI edits but people accepted them anyway [11].
- **No calibration evidence.** No pointing API publishes evidence that its confidence scores mean what they say [3].

## 5. Prior art, and what was missing

Pointing is old: Pointer Networks (2015), SQuAD span extraction (2016), the attribution literature's *Attributable to Identified Sources* (2023), and W3C's text selectors [12][13][14][15]. The nearest named idea is "Warranted Extraction", a September 2026 defensive publication about verifying claims against verbatim spans in hash-pinned sources [16].

What we could not find anywhere was a vendor-neutral, practical package: a check anyone can run, a record format to log it, a taxonomy of how pointers fail, and the economics of checking versus reviewing. So that is what this repository is.

## 6. What this repository is

- **[Point, Don't Write](concepts/point-dont-write.md)** — decide, point, write, cut; when to use which; how pointers fail.
- **[Verify by Slice](concepts/verify-by-slice.md)** — free checks versus paid checks, three metrics, a cost model.
- **[Chain of Custody](concepts/chain-of-custody.md)** — OCR and compression as places where evidence gets lost, and compression priced as a trade.
- **[Pointer Verifier](verifier/)** — the check itself, in a browser page and a CI command.
- **[Span Ledger](spec/span-ledger-entry.schema.json)** — a draft record format for one extracted value and its evidence.

## 7. How the research was done

Primary sources first — vendor documentation, API references, benchmark pages, papers — then independent write-ups. We used AI-assisted parallel web research to cover ground quickly and treated its output as leads to verify. Every behaviour of the verifier is tested in code; the examples are inputs written in each product's documented response shape, not real model outputs.

## 8. Where it goes next

- Run the verifier against real outputs from each pointing API and publish the span-verifiable rates.
- Test offsets on Hindi, Gujarati, Arabic and emoji text per vendor.
- Write up the stub concepts — Source Pane, Pointable Schema Design, Absence Is an Answer.
- Propose the Span Ledger shape to anyone building extraction tooling; adopt rather than compete where a better shape exists.

---

### References

1. ScaleDown launch post (via Exec Sum). https://x.com/exec_sum/status/2110045480398803243
2. LangChain — Building long-running agents with ScaleDown and Deep Agents. https://www.langchain.com/blog/building-long-running-agents-with-scaledown-and-deep-agents
3. ScaleDown — Extract API reference and benchmarks. https://docs.scaledown.ai/api-reference/extract.md ; https://docs.scaledown.ai/benchmarks/overview
4. ibl.ai — "Constrained Decoding Models Are Not a New Architecture". https://ibl.ai/blog/constrained-decoding-models-not-a-new-architecture
5. "Your model doesn't need to write the answer. It needs to point at it." https://dev.to/smit153/your-model-doesnt-need-to-write-the-answer-it-needs-to-point-at-it-44p4
6. Hanno Labs — DecisionBench. https://hannolabs.ai/field-notes/decisionbench
7. OpenRouter — decision-output models. https://openrouter.ai/api/v1/models?output_modalities=decisions
8. Pointer formats: Anthropic `char_location` https://preview.rubydoc.info/github/anthropics/anthropic-sdk-ruby/Anthropic/Models/CitationCharLocation ; Google LangExtract https://developers.googleblog.com/en/introducing-langextract-a-gemini-powered-information-extraction-library/ ; Reducto citations https://docs.reducto.ai/configs/extract/citations
9. ACL-Verbatim, arXiv 2605.21102. https://arxiv.org/abs/2605.21102
10. Attribution-Compression Frontier, arXiv 2609.14245. https://arxiv.org/abs/2609.14245
11. PaperTrail, arXiv 2602.21045. https://arxiv.org/abs/2602.21045
12. Pointer Networks, 2015. https://arxiv.org/abs/1506.03134
13. SQuAD, 2016. https://arxiv.org/abs/1606.05250
14. Attributable to Identified Sources, 2023. https://aclanthology.org/2023.cl-4.2/
15. W3C Web Annotation selectors. https://www.w3.org/TR/annotation-model/#selectors
16. Warranted Extraction, Sept 2026. https://www.tdcommons.org/dpubs_series/11564
