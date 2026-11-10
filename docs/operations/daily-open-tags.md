# Daily open tags and stable topics

Evidence V1 Daily Briefs separate durable Registry identities (`topics`) from open descriptive labels (`tags`). A new concept must not require a Registry edit before the Daily can publish.

## Producer flow

1. Resolve `main` to one commit SHA and read contracts, classification code and the complete Topic Registry at that SHA. Check the deterministic Daily target and existing candidate as usual.
2. Generate the Daily JSON, including proposed topic/tag labels. Do not fabricate Registry files or force an unrelated formal topic.
3. In a checkout pinned to that base, run the existing safe serializer:

   ```bash
   pnpm --silent automation:daily:serialize YYYY-MM-DD /tmp/candidate.json > /tmp/candidate.yaml
   ```

   The CLI classifies labels, validates the candidate, and verifies exact round-trip values before emitting YAML. Diagnostics go to stderr. The pure serializer remains a value-preserving operation on the already-classified candidate.
4. Review the classification diagnostics. Copy the validated temporary YAML to the exact Daily content path; run normal content validation, Daily guard, build and evidence review. These stages have not been replaced by label classification.
5. Recheck main and candidate head before mutation. If main moved, refresh the snapshot and checks. Never overwrite a Daily already published on main.

`pnpm automation:daily:classify /tmp/candidate.json` can preview classification as JSON without writing repository content. Its optional second argument is the complete local Topic Registry directory.

## Deterministic resolution

- Canonical IDs are derived from registered filenames. An active canonical ID takes precedence over aliases.
- A unique explicit alias of an active topic resolves to its canonical ID. Display names and fuzzy similarity are not matching authority.
- Unknown labels, ambiguous aliases and labels matching inactive topics remain open tags, with diagnostics. They do not create or reactivate topics.
- Labels use NFKC and normalized whitespace, case-insensitive deduplication and stable input order. The shared policy caps each output list at 32 entries and labels at 64 UTF-16 code units, and rejects control/format characters and angle brackets. Invalid or excessive labels are errors, not silently truncated data.
- Empty `topics` is valid when at least one `tag` exists. Both lists empty is invalid.
- Only `topics` and `tags` may change. Facts, references, dates, corrections and presentation settings are preserved exactly.

For example, proposals `agent-harness`, `software-agent`, `agent-security` resolve to formal topics `agent-harness`, `coding-agent` and open tag `agent-security` with the current Registry. A later editorial decision may register that concept, but classification does not grant that authority.

## Without a complete checkout

The pure policy is `tools/content-automation/daily-classification.mjs`; its dependency is `packages/content-schema/src/open-tags.mjs`. Fetch both at the same main SHA and preserve their relative paths. Supply a complete parsed snapshot of Topic files as `[{ id, data }]` to `classifyDailyCandidate`.

Use a real YAML parser for Registry files. Complete enumeration and successful reads are required; reject truncated trees, incomplete pagination, malformed entries, duplicate identities and read failures. A missing Registry is not an empty set of known topics. The loader/policy does not infer that a connector has fetched every file: the transport must verify enumeration completeness.

Execute the shared policy and final JSON/YAML round-trip. If execution or reliable parsing is unavailable, report `blocked` before GitHub mutation. Keep repository validation and full build as `not-run` when not actually executed. Do not add undeclared fields to `DailyAutomationReport` or claim CI/preview/production results in advance.

## Publication and discovery

Open tags appear as labeled, nonlinked pills on Daily reading pages and archive cards and are included in archive search. They do not generate Topic routes, enter the formal-topic dropdown or contribute to formal-topic related-content ranking. Tags are rendered as escaped text.

Old content without tags remains valid and reads as an empty tag list. Other content kinds retain their existing contracts. No historical YAML is rewritten. `watch` is currently a public Topic state, not a private review queue; archived Registry identities remain historically resolvable.

Topic promotion is a separate reviewed editorial change. This feature does not automatically create Registry entries, candidate PRs, private queues or schedules. Existing one-file Daily guards, evidence checks, Trusted Preview, merge rules and production authority remain unchanged.

## Regression coverage

- `daily-classification.test.mjs`: known IDs, aliases, canonical precedence, ambiguity, inactive entries, unknown labels, idempotence, bounds, invalid Registry and preservation outside classification.
- `daily-classification-loader.test.ts`: real YAML parsing and fail-closed directory/entry handling.
- `daily-serialization.test.ts`: CLI classification before validated output and exact value round trips.
- `packages/content-schema/test/schema.test.ts`: tag-only Daily, normalized/unique/bounded tags and historical compatibility.
- `open-tags.test.ts` and `open-tags-fixture.test.ts`: archive search, unchanged formal-topic ranking/filtering and safe rendered detail/archive artifacts.
