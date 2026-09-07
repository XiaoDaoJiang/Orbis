# 80B · Real Correction Provenance + Reading UI — Implementation Plan

> Status: Planned
> Milestone: H — Evidence Integrity
> Parent: [`docs/plan/80-evidence-integrity.md`](../../plan/80-evidence-integrity.md)
> Approved design: [`docs/superpowers/specs/2026-09-07-evidence-integrity-design.md`](../specs/2026-09-07-evidence-integrity-design.md)
> Implementation base: `main@3a7245aa907fedeb10141bbb05deb718c6fa7e7d`
> 80A merge: PR #34
> Fresh main Build: `34098464587` success
> Main Artifact: `10009585595`
> Main Artifact SHA-256: `661b64ec92e251ded54a5f68be30e1f9b9752c5460e47ecb973ab55ced5a89fd`
> Recommended branch: `feat/evidence-correction-provenance`

## 1. Objective

80B turns the Evidence V1 contract from 80A into a real, reader-visible product capability using the already-published 2026-09-07 Daily and its real OpenClaw correction.

The slice has two inseparable responsibilities:

```text
2026-09-07 factual re-verification
        ↓
full Daily Evidence V1 migration
        ↓
PR #33 correction provenance
        ↓
reader-visible evidence + correction UI
```

80B must not fabricate historical coverage by mechanically mapping every fact to all old section references. Every persisted Evidence V1 edge must result from explicit re-verification.

## 2. Hard boundaries

80B may modify:

```text
content/briefs/2026-09-07.yaml
config/evidence-integrity.yaml
apps/web/src/components/briefs/DailyBriefBody.astro
apps/web/src/components/ReferenceList.astro
small Web helpers/tests needed for Evidence V1 reading UI
apps/slides/templates/daily-v1.ts only if migration exposes a compatibility bug
artifact / UI contract tests
```

80B must not:

- migrate any other legacy Daily;
- change Source / Author / Topic Registry identities unless re-verification proves an existing reference cannot be represented with an already registered source — if that occurs, fail closed and split the Registry change into a separate reviewed decision;
- add correction-specific append-only branch guard (80C);
- change Scheduled Daily authority;
- auto-merge or deploy Production Pages;
- change canonical Daily route/date identity;
- increase the Daily slide count beyond 11.

## 3. Step 0 — Preflight

Before implementation:

1. confirm PR #34 merged to `main@3a7245aa907fedeb10141bbb05deb718c6fa7e7d`;
2. confirm fresh `Orbis Site Build` run `34098464587` succeeded on that exact SHA;
3. create `feat/evidence-correction-provenance` from that SHA;
4. verify `content/briefs/2026-09-07.yaml` is still legacy and remains in `config/evidence-integrity.yaml`;
5. record existing canonical/public behavior for `/2026/09/07/`, `/latest/`, `/archive.json`, RSS and 11-slide presentation.

## 4. Step 1 — Re-verify all five sections before changing shape

Use current primary-source evidence, not the old `supports` strings, to validate every factual fact in all five sections:

```text
workspace-trust
deterministic-boundary
mcp-policy-plane
egress-boundary
external-supervision
```

For each old fact, classify:

```text
VERIFIED        exact claim can remain
REFINE          source supports a narrower/more precise claim
REMOVE          source does not support the claim strongly enough
SPLIT           one old sentence contains multiple claims needing separate evidence
```

Prefer official releases, repositories and official docs already represented by the Daily references. Do not introduce new claims merely to make the migration richer.

The re-verification matrix is review evidence; it does not need to be persisted into `content/**`.

## 5. Step 2 — Migrate the full Daily atomically to Evidence V1

The same content PR must convert all five sections, never a partial Evidence V1 Daily.

Required changes:

- add `evidenceVersion: 1`;
- convert each factual fact from string to `{ id, text, evidence[] }`;
- use stable lowercase kebab-case fact IDs meaningful enough to survive wording refinements;
- remove duplicated section-level reference objects;
- normalize actual claim evidence into top-level canonical `references[]` with stable IDs;
- ensure every canonical reference is used by at least one fact or correction;
- keep `signals`, conclusions, limitations, projects, radar, actions and archive picks semantically consistent with re-verified facts;
- do not claim machine-proven truth.

After migration, remove only:

```text
content/briefs/2026-09-07.yaml
```

from the frozen legacy allowlist. Other pre-H Daily debt remains unchanged.

## 6. Step 3 — Persist the real PR #33 correction event

Represent the already-completed OpenClaw attribution correction as one canonical event:

```yaml
corrections:
  - id: openclaw-supervisor-version
    correctedAt: 2026-09-07
    summary: ...
    targets:
      - section: external-supervision
        fact: <stable fact id>
      - section: external-supervision
        fact: <stable fact id if needed>
    evidence:
      - openclaw-v2026-7-2-beta-2
      - openclaw-v2026-9-2
```

Rules:

- target the corrected current facts, not array indexes;
- preserve Git history as the source of previous wording; do not duplicate old text in YAML;
- do not persist PR number, workflow IDs or provider metadata into content provenance;
- use the primary releases proving early introduction and later recovery improvements.

## 7. Step 4 — RED/GREEN Reading evidence UI

Add contract tests before visible UI implementation.

Evidence V1 Daily Reading page must provide:

### Stable fact anchors

```text
#claim-<section-id>-<fact-id>
```

Each fact displays compact evidence links/markers resolving to canonical references.

### Stable reference anchors

```text
#ref-<reference-id>
```

`ReferenceList.astro` must continue Source Registry enrichment while accepting an optional Evidence V1 reference ID.

### Correction notice

When `corrections.length > 0`, show near the article start:

```text
已修正 · <lastCorrectedAt>
<latest correction summary>
```

and expose links to affected fact anchors. Full correction history remains on the same canonical page.

Legacy Daily pages must continue rendering without evidence/correction UI errors.

## 8. Step 5 — Presentation and public identity regression

Evidence UI is a Reading concern. Daily Slidev must remain exactly 11 pages.

Verify:

- section fact text renders from Evidence V1 objects;
- section source link derives from fact evidence as 80A designed;
- Extended Reading uses canonical top-level references;
- correction does not add a slide;
- canonical Daily URL remains unchanged;
- `/latest/`, archive identity, RSS identity and sitemap routes remain unchanged;
- JSON-LD required fields remain green.

If mapping `lastCorrectedAt` to JSON-LD `dateModified` is small and local, it may be added with a focused contract test. Do not trigger a global SEO redesign.

## 9. Step 6 — Real evidence report acceptance

The migrated 2026-09-07 Daily must produce a report equivalent to:

```text
mode                    evidence-v1
claims                  N
claims with evidence    N
references              M
unused references        0
corrections              1
last corrected           2026-09-07
errors                    0
```

The report/documentation must continue to state:

```text
100% structural evidence coverage != 100% factual truth
```

## 10. Step 7 — PR validation and review gate

Require:

1. generic Path Guard;
2. full `pnpm validate` / `pnpm build` through read-only PR Build;
3. Evidence V1 report green for 2026-09-07;
4. Evidence Reading UI artifact checks;
5. Daily 11-page regression;
6. Trusted Preview publish from the read-only artifact;
7. public Preview smoke;
8. Human Review.

Do not auto-merge and do not trigger Production Pages from the producer.

## 11. Acceptance criteria

80B reaches Review Gate only when:

- [ ] all five 2026-09-07 sections were explicitly re-verified;
- [ ] the entire Daily is Evidence V1, not partially migrated;
- [ ] every factual fact has a stable ID and >=1 explicit evidence edge;
- [ ] no canonical evidence reference is unused;
- [ ] 2026-09-07 is removed from frozen legacy debt;
- [ ] the real PR #33 OpenClaw correction exists as one correction event;
- [ ] correction targets resolve to stable current facts;
- [ ] Reading exposes claim anchors, evidence links, reference anchors and correction notice/history;
- [ ] legacy Daily rendering remains green;
- [ ] Daily remains 11 slides;
- [ ] canonical/date/archive/RSS/sitemap identities remain stable;
- [ ] full PR Build + Trusted Preview + public smoke pass;
- [ ] no Registry / merge / Pages authority expansion occurs.

## 12. Next gate

```text
80A merged + fresh main Build · Done
        ↓
80B full re-verification + migration + Reading provenance
        ↓
PR Build / Trusted Preview
        ↓
Human Review / merge
        ↓
fresh main Build
        ↓
80C correction-specific append-only guard + Production closeout
```
