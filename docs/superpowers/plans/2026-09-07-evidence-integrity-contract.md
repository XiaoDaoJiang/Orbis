# 80A · Evidence Integrity Contract — Implementation Plan

> Status: Planned
> Milestone: H — Evidence Integrity
> Parent: [`docs/plan/80-evidence-integrity.md`](../../plan/80-evidence-integrity.md)
> Approved design: [`docs/superpowers/specs/2026-09-07-evidence-integrity-design.md`](../specs/2026-09-07-evidence-integrity-design.md)
> Implementation base: current `main` at implementation start
> Recommended branch: `feat/evidence-integrity-contract`

## 1. Objective

Implement only the first slice of Plan 80:

```text
Evidence V1 shape
    ↓
legacy boundary
    ↓
claim/reference integrity
    ↓
evidence report
    ↓
legacy + Evidence V1 renderer compatibility
    ↓
new Scheduled Daily must use Evidence V1
```

Do not implement the 2026-09-07 real migration, Reading correction notice, or correction-specific append-only workflow in 80A.

## 2. Hard boundaries

80A may change implementation needed for the contract, including:

```text
packages/content-schema/**
tools/validate-content/**
tools/evidence-integrity/**             # new, if useful
tools/content-automation/**
apps/web/src/components/briefs/**
apps/web/src/components/ReferenceList.astro
apps/slides/templates/daily-v1.ts
config/daily-task-prompt.md
config/scheduled-task-prompt.md         # only when contract wording must align
package.json                            # scripts only
contract / artifact tests
```

80A must not:

- modify `content/briefs/2026-09-07.yaml` into Evidence V1 yet;
- modify Source / Author / Topic Registry entries;
- add correction UI;
- add automatic historical migration;
- add merge / Pages authority;
- change Weekly semantics;
- introduce database / service runtime.

## 3. Step 0 — Preflight

Before creating the implementation branch:

1. resolve current `main` SHA;
2. confirm `planning/product-capability-roadmap` contains the approved design and Plan 80;
3. create `feat/evidence-integrity-contract` from current `main`;
4. verify working diff is empty;
5. run the existing baseline validation/build if execution environment supports it.

Record the exact `main` SHA in the PR body; do not reuse the planning branch as implementation base.

## 4. Step 1 — RED: Schema contract tests

First modify/add tests under:

```text
packages/content-schema/test/schema.test.ts
```

RED cases should prove the public type/schema contract is missing before implementation:

### Valid Evidence V1 Daily

Expect a Daily with:

```yaml
evidenceVersion: 1
sections:
  - id: example
    facts:
      - id: claim-one
        text: factual statement
        evidence: [source-one]
references:
  - id: source-one
    title: Example source
    url: https://example.com/source
    supports: factual statement
```

to parse after implementation.

### Shape failures

Add tests for:

- `facts[]` object missing `id`;
- missing `text`;
- empty `evidence`;
- invalid kebab-case fact ID;
- Evidence V1 reference missing `id`;
- malformed correction event shape;
- correction target without `section` / `fact`;
- Daily `evidenceVersion` other than `1` rejected.

Keep legacy Daily parsing available only because 80A still has a frozen migration boundary; do not make Weekly depend on Evidence V1 primitives.

Expected initial state: new assertions fail before implementation.

## 5. Step 2 — GREEN: Evidence V1 Schema primitives

Update:

```text
packages/content-schema/src/index.ts
```

Add reusable primitives conceptually equivalent to:

```ts
EvidenceReference
EvidenceFact
DailyEvidenceSection
DailyCorrectionTarget
DailyCorrection
EvidenceDailyBrief
```

Important implementation rule:

- do **not** change generic `briefSectionSchema` in a way that forces Weekly / Ad-hoc migration;
- Daily parsing must distinguish Evidence V1 from approved legacy Daily shape;
- Evidence V1 `facts` are objects, legacy facts remain strings;
- Evidence V1 section does not persist duplicated `references[]` objects;
- top-level Evidence V1 references require stable IDs.

Export the types actually consumed by Web / Slide / validation code.

Run schema tests to GREEN before moving to repository relation validation.

## 6. Step 3 — RED: Frozen legacy boundary

Add a repository-owned frozen allowlist, preferably as explicit configuration/data rather than date inference.

Recommended location:

```text
config/evidence-integrity.yaml
```

Conceptual content:

```yaml
version: 1
legacyDailyPaths:
  - content/briefs/2026-08-28.yaml
  - content/briefs/2026-09-04.yaml
  - content/briefs/2026-09-05.yaml
  - content/briefs/2026-09-06.yaml
  - content/briefs/2026-09-07.yaml
```

Do not include `2026-09-01-weekly.yaml` because the allowlist is specifically for pre-H Daily migration debt.

Tests must fail when:

- an arbitrary new legacy Daily is parsed as acceptable repository content;
- a path is appended dynamically based on date;
- Scheduled Daily candidate uses legacy shape.

The config is governance state. Scheduled Agent must not be authorized to edit it.

## 7. Step 4 — RED: Evidence relation evaluator

Create a focused pure module rather than expanding the existing referential-integrity loop indefinitely.

Recommended:

```text
tools/evidence-integrity/daily-evidence.ts
tools/evidence-integrity/daily-evidence.test.ts
```

Pure input/output contract should accept parsed Daily + path/mode and return deterministic errors/report data without filesystem/time dependencies.

RED cases:

```text
DUPLICATE_CLAIM_ID
DUPLICATE_REFERENCE_ID
MISSING_EVIDENCE
DANGLING_EVIDENCE_REFERENCE
UNUSED_REFERENCE
INVALID_CORRECTION_TARGET
INVALID_CORRECTION_EVIDENCE
LEGACY_DAILY_NOT_ALLOWLISTED
```

Use stable field addresses such as:

```text
sections[3].facts[0]
external-supervision/external-supervisor-introduced
references[4]
corrections[0].targets[1]
```

Do not use natural-language parsing of `supports` to determine relation validity.

## 8. Step 5 — GREEN: Evidence evaluator + report

Implement pure relation validation.

For Evidence V1:

- unique section IDs;
- unique fact IDs within each section;
- unique reference IDs;
- every fact has >= 1 unique evidence ID;
- every evidence ID resolves to top-level reference;
- every canonical reference is used by a fact or correction;
- every correction target resolves to stable section/fact;
- every correction evidence ID resolves;
- Source Registry validation remains delegated/integrated with existing referential integrity.

Provide report shape:

```ts
interface DailyEvidenceReport {
  version: 1
  path: string
  publishedAt: string
  mode: 'evidence-v1' | 'legacy-unverified'
  claimCount: number
  boundClaimCount: number
  referenceCount: number
  unusedReferenceCount: number
  correctionCount: number
  lastCorrectedAt?: string
  errors: EvidenceIntegrityError[]
}
```

For allowlisted legacy Daily:

```text
mode = legacy-unverified
```

Never synthesize claim bindings from section references.

## 9. Step 6 — Integrate repository content validation

Current `tools/validate-content/referential-integrity.ts` assumes every section has `section.references` and iterates it directly.

Refactor that coupling explicitly:

```text
legacy Daily / Weekly / Ad-hoc / Presentation
    → existing section reference collection

Evidence V1 Daily
    → top-level canonical EvidenceReference source collection
    → fact evidence relation validator
```

Do not weaken existing Source / Author / Topic / Knowledge integrity rules.

Update/add tests in:

```text
tools/validate-content/referential-integrity-unit.test.ts
tools/validate-content/referential-integrity.test.ts
```

Required regression coverage:

- legacy existing Daily passes only if allowlisted;
- Weekly existing fixture still passes unchanged;
- missing Source Registry ID in Evidence V1 reference still fails;
- Evidence V1 relation errors surface as repository validation errors;
- no section-reference property access crash occurs for Evidence V1 Daily.

## 10. Step 7 — Evidence report CLI

Expose a human + machine interface without creating a service.

Recommended commands:

```text
pnpm evidence:daily:report
pnpm evidence:daily:report --json
```

Behavior:

- enumerate Daily entries deterministically;
- report each as `evidence-v1` or `legacy-unverified`;
- structural integrity errors produce non-zero exit when used as validator;
- legacy allowlisted state itself is visible migration debt, not a fatal build error;
- output never claims factual truth.

Add package script(s) only after executable tests exist.

## 11. Step 8 — Renderer dual-mode compatibility

80A must keep current site / slides building while legacy content remains.

Update:

```text
apps/web/src/components/briefs/DailyBriefBody.astro
apps/slides/templates/daily-v1.ts
```

Prefer small adapter helpers that normalize only rendering access, not evidence semantics.

Conceptual functions:

```ts
factText(fact)
sectionPrimaryReference(section, brief)
```

Legacy Daily:

- renders existing string fact;
- section source link uses existing section reference.

Evidence V1 Daily:

- renders `fact.text`;
- section source link resolves first fact's first evidence ID through top-level reference map.

80A does not yet show per-fact citation markers or correction notice; that belongs to 80B.

Slide count must remain exactly 11.

## 12. Step 9 — Scheduled Daily enforcement

After Schema + validator + renderer compatibility are GREEN, update the producer/repository contract.

### Prompt

Update `config/daily-task-prompt.md` so newly produced Scheduled Daily must include:

```text
evidenceVersion: 1
stable fact IDs
explicit evidence IDs
canonical top-level reference IDs
no duplicated section reference objects
```

Editorial rule remains:

- every core claim uses primary evidence where required;
- synthesis fields must not invent new key external facts outside evidence-bound facts.

### Guard

Update:

```text
tools/content-automation/daily-guard.ts
```

so an `automation/daily/<targetDate>` candidate must be Evidence V1 and pass evidence integrity validation.

Do not grant the guard or Agent permission to edit:

```text
config/evidence-integrity.yaml
content/sources/**
content/authors/**
content/topics/**
```

Add/extend Scheduled Daily tests to prove legacy-shaped new candidate is rejected.

## 13. Step 10 — Build regression contracts

Before PR completion, prove the migration boundary has not altered public identity.

Required full-build regression areas:

- existing legacy Daily reading pages still render;
- Daily latest still resolves correctly;
- archive JSON ordering / identity unchanged;
- RSS Daily identity unchanged;
- Sitemap route set unchanged;
- JSON-LD required fields remain present;
- Weekly remains isolated from Daily Evidence V1;
- daily-v1 generates exactly 11 slides;
- no `dist/**` or generated Slidev source committed.

80A does not require visible public evidence markers yet, so there should be no intentional product UI change beyond compatibility code.

## 14. Suggested RED → GREEN sequence

Use small commits / CI checkpoints conceptually:

```text
RED 1   Evidence V1 Schema tests fail
GREEN 1 Schema primitives + types

RED 2   legacy boundary / evidence relation tests fail
GREEN 2 frozen allowlist + pure evaluator

RED 3   repository validation integration fails
GREEN 3 legacy/Evidence V1 referential-integrity adapter

RED 4   renderer contract fails for Evidence V1 fixture
GREEN 4 Web + Slide dual-mode compatibility

RED 5   Scheduled Daily accepts legacy candidate
GREEN 5 prompt + exact guard requires Evidence V1

FINAL    full pnpm validate / build / artifact regressions GREEN
```

Do not combine all REDs into one giant unreviewable branch state.

## 15. PR contract

Recommended PR title:

```text
feat: add Daily Evidence V1 integrity contract
```

PR body must state:

- exact main base SHA;
- approved Design / Plan 80 / 80A references;
- Evidence V1 contract implemented;
- exact frozen legacy Daily list;
- no historical claim coverage was fabricated;
- Scheduled Daily authority is unchanged;
- tests / validation / full build actually run;
- unverified items, if any;
- no claim that 80B correction UI/provenance migration is complete.

## 16. 80A acceptance gate

80A is ready for Human Review only when all are true:

- [ ] Evidence V1 schema parses valid Daily and rejects invalid shapes;
- [ ] existing Weekly / Ad-hoc schemas are not forced into Evidence V1;
- [ ] frozen legacy allowlist is explicit and finite;
- [ ] arbitrary new legacy Daily is rejected;
- [ ] evidence evaluator returns stable errors;
- [ ] dangling evidence / unused reference fail;
- [ ] Source Registry relation remains enforced;
- [ ] legacy Daily report is `legacy-unverified`;
- [ ] no auto-generated historical bindings exist;
- [ ] Web renderer supports legacy + Evidence V1;
- [ ] Slide renderer supports legacy + Evidence V1 and stays 11 pages;
- [ ] Scheduled Daily candidate must Evidence V1;
- [ ] `pnpm validate` passes;
- [ ] full `pnpm build` passes;
- [ ] generic Path Guard passes;
- [ ] Scheduled Daily contract tests pass;
- [ ] PR Preview Build succeeds;
- [ ] Trusted Preview succeeds;
- [ ] Human review before merge。

## 17. Stop condition

After 80A merges and a fresh `main` Build is green, stop and reassess before starting 80B.

Do not immediately bundle the real `2026-09-07` Evidence V1 migration into the same PR. That migration requires factual re-verification and is intentionally a separate review surface.

**Next executable action after this plan: create `feat/evidence-integrity-contract` from current `main`, write RED schema/evidence contract tests first, and do not touch production content yet.**