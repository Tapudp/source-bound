# Contributing

Source-Bound is a set of ideas plus a small tool. The most valuable contributions make the ideas **more tested**.

- **Run the verifier on real outputs.** Pick a pointing API (ScaleDown Extract, LangExtract, Anthropic citations, Reducto, GLiNER…), run it on documents you're allowed to share, and open an issue with the span-verifiable rate, provenance coverage and any unit problems. Non-English text is especially useful.
- **Add a format.** If an API returns pointers in a shape the verifier doesn't read, add an adapter to `parseExtraction` in [`verifier/verify.js`](verifier/verify.js) with a test.
- **Challenge a concept.** Open an issue titled `concept: <name>` with the case where it breaks.
- **Write up a stub** from [concepts/index.md](concepts/index.md).

House rules: cite sources inline as `[n]` with a References list; label illustrative numbers; stay vendor-neutral; use an existing name when another field already has one.

```bash
node --test
node tools/build-examples.js   # regenerate examples after changing them
```

Text is contributed under [CC BY 4.0](LICENSE-TEXT); code and schemas under [Apache-2.0](LICENSE-CODE).
