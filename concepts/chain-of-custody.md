# Chain of Custody

*Source-Bound · concept · v0.1*

> **A pointer is only as good as the weakest step between the original document and the text the model actually read.**

## The problem

Real pipelines rarely give a model the original document. They give it something derived from it:

```
scanned PDF → OCR → chunking → compression → extraction → stored value
```

Each arrow can move, merge, misread or rewrite text. If the extractor returns "characters 93 to 100", those positions refer to whatever text it was handed — not necessarily the document a customer, an auditor or a court will look at.

One 2026 study measured exactly this. After compressing context, citation precision checked against the compressed text was **0.86**; checked against the original source it was **0.12** [1]. The citations looked right and pointed at nothing.

## The rule

Record every step between the source and the value, and for each one say what happened to positions:

| Offsets | Meaning | What a pointer after this step is worth |
|---|---|---|
| **preserved** | positions are unchanged (e.g. chunking that keeps global offsets) | as good as the step before |
| **mapped** | an offset map back to the input exists (e.g. OCR with character boxes, selection-only compression) | good, once mapped back |
| **lost** | the step rewrote text and positions can't be traced (e.g. abstractive summarising) | **nothing** — re-anchor against the original or treat as unanchored |

This is the `transforms` list in the [Span Ledger](../spec/span-ledger-entry.schema.json). Each entry also carries a hash of the step's output, so the chain can be replayed.

## Compression is a reject rule — price it like one

Compressing context throws text away to save tokens. Sometimes the text it throws away was the fact you needed. That makes a compressor the same kind of decision as Chow's reject rule in [Judgment Economics](https://github.com/Tapudp/judgement-architecture/blob/main/concepts/judgment-economics.md): a trade between a certain saving and an uncertain cost.

```
compress when:   tokens saved × price per token  −  cost of compressing   >   P(needed fact dropped) × cost of that miss
```

### Worked example

LangChain's published trace compressed a documentation page from 18,402 to 3,110 characters [2] — roughly 4,600 to 780 tokens at four characters per token.

| | Value |
|---|---|
| Tokens saved | ≈ 3,800 |
| Saved at $2 per million input tokens (a frontier model [3]) | ≈ $0.0076 per call |
| Cost of compressing at $0.05 per million [4] | ≈ $0.0002 per call |
| **Net saving** | ≈ **$0.0074 per call** |
| Break-even drop rate if a miss costs a $12 customer re-contact | **0.06%** |
| Break-even drop rate if a miss only costs re-calling the tool ($0.50) | **1.5%** |

So, on cost alone, compression only pays if it almost never drops the fact you needed — or if a miss is cheap to recover from. That is why the best-designed compressor in this example lets the agent re-call the tool without compression to get the full output [2]: it turns an expensive miss into a cheap one.

There are good reasons to compress that are not about price: staying inside a context window, and keeping irrelevant text away from a model whose accuracy falls as context grows [5]. Those are real. They are still trades, and should be measured as trades.

## Practice

- Hash the original. Every pointer resolves against that hash.
- Prefer steps that **select** over steps that **rewrite** wherever a value will later be pointed at.
- Point **before** you compress where you can: extract from the original, compress what is left for the reasoning model.
- If a value was pointed at in compressed text, re-anchor it against the original (search for the quote) before storing it; the [Pointer Verifier](../verifier/) reports where the text really is.
- Measure your drop rate on a labelled sample before trusting the break-even maths.

---

### References

1. "Attribution-Compression Frontier", arXiv 2609.14245. https://arxiv.org/abs/2609.14245
2. LangChain — Building long-running agents with ScaleDown and Deep Agents (tool-compression trace; re-call without query). https://www.langchain.com/blog/building-long-running-agents-with-scaledown-and-deep-agents
3. Frontier input price used for illustration ($2 per million input tokens). https://dev.to/smit153/your-model-doesnt-need-to-write-the-answer-it-needs-to-point-at-it-44p4
4. ScaleDown pricing ($0.05 per million input tokens; OpenRouter lists $0.04). https://openrouter.ai/scaledown/extract
5. TypeSafe AI — Jev 1.13 known limitations ("accuracy falls as state grows with unrelated content"). https://docs.typesafe.ai/model-jaggedness/jev-1.13.md
