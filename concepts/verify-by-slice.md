# Verify by Slice

*Source-Bound · concept · v0.1*

> **Two questions, never one: is the quote really in the source — and is it the right quote?**

## Two checks with very different prices

A value an AI pointed at can be checked in two ways:

| Check | Question | How | Cost | Catches |
|---|---|---|---|---|
| **Verifiable** | Is the claimed text really at those offsets? | slice the source and compare | ~$0, deterministic, instant | invented text, wrong offsets, unit mismatch, absent-as-zero |
| **Supported** | Does that text actually mean this value? | a person, a judge model, or a rule | real money per item | wrong span, wrong field, misread meaning |

Research shows why both are needed. Returning only verbatim spans stops invented text, yet in one 2026 study the best span selector reached just 53.6 word-level F1 — real quotes, often not the right ones [1]. Separately, constrained decoding lifted small models' schema validity to 100% without closing their accuracy gap [2]. The form can be perfect while the meaning is wrong.

So **verifiable is necessary, not sufficient.** The economics come from doing the free check on everything and spending the expensive check only where it matters.

## Three numbers to report

| Metric | Definition | What it tells you |
|---|---|---|
| **Provenance coverage** | values that came with a pointer ÷ values claimed | how much of your data *can* be checked at all |
| **Span-verifiable rate** | values whose pointer slices to the claimed text ÷ values claimed | how much of it *is* what the source says |
| **Support rate** | sampled verified values a reviewer confirmed ÷ verified values sampled | how often a correct quote is also the correct answer |

The first two cost nothing to compute on 100% of traffic. The third needs a sample; a few hundred reviews per field is a sensible start.

## The cost model

For `N` extracted values a month, a review cost `r` per value, and an error cost `e` for a wrong value that reaches your systems:

**A pipeline that writes values** cannot tell its good outputs from its bad ones. With an error rate `f`, you pay one of:

```
no review:      N · f · e
review all:     N · r
```

**A pipeline that points** splits the stream for free. With a slice-failure share `u` (sent to review) and a residual wrong-but-real rate `w` among verified values:

```
N · u · r   +   N · (1 − u) · w · e
reviewed        slipped through
```

### Worked example (illustrative numbers)

10,000 invoice fields a month; review `r = $2` per field; a wrong field posted to accounts `e = $40`; the writing pipeline is wrong 4% of the time; the pointing pipeline fails the slice check 3% of the time and is wrong-but-real 1% of the time.

| Pipeline | Monthly cost |
|---|---|
| Writes values, no review | **$16,000** |
| Writes values, review everything | **$20,000** |
| Points, review only failed slices | $600 + $3,880 = **$4,480** |

The saving comes entirely from the free check telling you *where to look*. It shrinks fast if `w` is large — which is exactly why the support rate must be measured, not assumed.

To decide which *verified* values still deserve review, use the extractor's confidence and the cost-optimal threshold from [Judgment Economics](https://github.com/Tapudp/judgement-architecture/blob/main/concepts/judgment-economics.md): review below `1 − r/e` — but only once the confidence has been shown to be calibrated. No 2026 pointing API publishes calibration evidence for its confidence scores [3].

## Policy

- **Unaligned, unanchored** → never store; review or re-extract.
- **Misplaced, out of range** → recompute the pointer against the original source; if it can't be re-anchored, treat as unaligned.
- **Absent** → store "not found" explicitly.
- **Exact, normalized** → store with the pointer; sample for support; review below the threshold.
- **Log every one** as a [Span Ledger entry](../spec/span-ledger-entry.schema.json), so the check can be replayed by an auditor.

## Why "slice"

Because the check really is that small: `source[start:end] == claimed`. Everything else on this page is about the cases where that line is not enough.

---

### References

1. "ACL-Verbatim" / VerbatimRAG, arXiv 2605.21102. https://arxiv.org/abs/2605.21102
2. "Constrained Decoding Eliminates Structural Failures in Small LLMs but Reveals a Scale-Dependent Semantic Gap", arXiv 2609.23742. https://arxiv.org/abs/2609.23742
3. ScaleDown benchmarks and methodology (accuracy deltas; no calibration figures published). https://docs.scaledown.ai/benchmarks/overview ; https://docs.scaledown.ai/benchmarks/methodology
