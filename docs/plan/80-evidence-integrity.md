# 80 · Evidence Integrity

> 状态：Done
> Roadmap Milestone：H — Evidence Integrity · Done
> Design：[`2026-09-07-evidence-integrity-design.md`](../superpowers/specs/2026-09-07-evidence-integrity-design.md) · Approved
> Final implementation main：`fee254c81e899bc77c4671eda472071c390621a9`
> Production run：`34191412383` · success
> Closeout：[`2026-09-08-milestone-h-evidence-integrity-closeout.md`](./2026-09-08-milestone-h-evidence-integrity-closeout.md)

## 1. Outcome

Plan 80 is complete. Orbis Daily content now has machine-checkable factual claim → evidence relations, reader-visible correction provenance, and an append-only repository guard for future published corrections.

```text
factual fact
    ↓ stable identity
fact.evidence[]
    ↓
canonical Daily reference
    ↓
existing Source Registry
    ↓
reader-visible claim/ref anchors
    ↓
content correction provenance
    ↓
append-only correction guard
```

Plan 80 validates evidence/provenance structure and auditability; **100% structural evidence coverage != 100% factual truth**.

## 2. 80A — Evidence Contract · Done

PR #34 delivered:

- Evidence V1 Daily Schema;
- stable `fact.id`;
- explicit `fact.evidence[]`;
- canonical top-level references;
- Evidence Integrity evaluator / report;
- frozen legacy Daily boundary;
- legacy / Evidence V1 renderer compatibility;
- new Scheduled Daily must be Evidence V1;
- 11-page Daily presentation contract preserved.

```text
PR Build        34096309697 success
Trusted Preview passed
Human merge     passed
fresh main      34098464587 success
```

## 3. 80B — Real Correction Provenance + Reading UI · Done

PR #35 fully re-verified and migrated `content/briefs/2026-09-07.yaml` to Evidence V1.

```text
sections                5
factual claims         16
canonical references    6
corrections             1
Evidence errors         0
slides                  11
```

The historical PR #33 correction is persisted as:

```text
id            openclaw-supervisor-version
correctedAt   2026-09-07
```

Reading now exposes stable claim/ref anchors, per-fact evidence links, correction notice/history, and correction → affected fact navigation.

Public identity remains:

```text
Reading canonical       /briefs/2026-09-07/
Stable date alias       /2026/09/07/
Alias behavior          redirect → /slides/2026-09-07/
Daily slides            11
```

```text
PR Build        34106452727 success
Trusted Preview passed
Human merge     passed
fresh main      34108101313 success
```

## 4. 80C — Published Correction Guard · Done

PR #36 established the future correction branch contract:

```text
correction/daily/YYYY-MM-DD/<kebab-slug>
```

A correction branch may modify exactly:

```text
content/briefs/YYYY-MM-DD.yaml
```

Guard rules include:

- base target already exists, is `published`, and is Evidence V1;
- existing correction history cannot be deleted, edited, or reordered;
- at least one new correction event must be appended;
- existing stable section/fact/reference identities cannot silently disappear or be renamed;
- factual text/evidence mutations require newly appended correction targets;
- new factual claims require new provenance;
- canonical reference mutation requires explicit correction evidence and affected fact target coverage;
- appended targets/evidence pass the normal Evidence Integrity evaluator;
- frozen legacy Daily correction fails closed until explicit human-reviewed Evidence V1 migration.

Authority remains isolated:

```text
feature/*
    → Generic Path Guard

automation/daily/*
    → Generic Path Guard + Scheduled Daily guard

correction/daily/*
    → Generic Path Guard + Published Daily correction guard
```

Scheduled Daily never enters correction mode automatically.

```text
PR Build                     34109064068 success
Trusted Preview              passed
Human merge                  passed
Merge commit                 fee254c81e899bc77c4671eda472071c390621a9
```

## 5. Final main Gate · Passed

```text
main                         fee254c81e899bc77c4671eda472071c390621a9
fresh Site Build             34179976055 success
main Artifact                10038587455
Artifact SHA-256             bb1ce4aaddbafa7d7423d9b1b182f6843760f6cb0dfd630ac70615462f0e01f5
```

The exact final main includes `correction/daily/* → evidence:daily:correction:guard` routing.

## 6. Exact-SHA Production · Passed

The existing explicit Production workflow was manually dispatched on `main` with deployment enabled.

```text
Production run               34191412383
head_sha                     fee254c81e899bc77c4671eda472071c390621a9
Build production artifact    success
Deploy to GitHub Pages       success
Pages Artifact               10042373095
Pages Artifact SHA-256       e0bed6d0c91b1fe095d42a807a73f1a8967a9d127c3babdcddc534d7412b45c9
Production URL               https://xiaodaojiang.github.io/Orbis/
```

The deploy job created the Pages deployment for the exact final main SHA.

Built-in public smoke passed:

```text
/                 PASS
/latest/          PASS
/archive.json     PASS
/rss.xml          PASS
/favicon.svg      PASS
/2026/09/07/      PASS
```

Latest structured Daily path resolved to `/2026/09/07/`.

## 7. Exact deployed-artifact checks · Passed

The exact `github-pages` artifact used by the successful deployment was inspected after deployment.

`/briefs/2026-09-07/` contains:

- `已修正 · 2026-09-07`;
- correction ID `openclaw-supervisor-version`;
- stable claim/ref anchors;
- claim → reference links;
- correction → affected claim links;
- canonical `https://xiaodaojiang.github.io/Orbis/briefs/2026-09-07/`;
- exactly 16 claim markers;
- exactly 1 correction event.

`/2026/09/07/` keeps the Slides redirect and Reading canonical.

Discovery/feed outputs remain healthy:

- `archive.json.latest == 2026-09-07`;
- first archive issue path is `2026/09/07/`;
- latest resolves 2026-09-07;
- RSS contains 2026-09-07;
- sitemap contains the canonical 2026-09-07 Reading URL.

## 8. Authority boundary preserved

Plan 80 did not add authority for:

- direct `main` writes;
- automatic merge;
- automatic Production Pages deployment;
- Scheduled Daily correction mode;
- automatic Source / Author / Topic Registry mutation;
- automatic correction generation;
- automatic historical rewrite;
- truth scoring or LLM fact judging.

Production remained an explicit human-triggered exact-main workflow.

## 9. Milestone H acceptance

- [x] Evidence V1 Daily Schema + relation contract integrated into main
- [x] frozen legacy migration boundary integrated into main
- [x] evidence report integrated into main
- [x] new Scheduled Daily requires Evidence V1
- [x] 2026-09-07 fully re-verified and migrated
- [x] PR #33 correction provenance persisted
- [x] reader-visible evidence/correction UI
- [x] Daily remains 11 slides
- [x] correction-specific append-only guard integrated into main
- [x] legacy correction fail-closed behavior verified
- [x] 80A / 80B / 80C independently passed Build + Trusted Preview
- [x] fresh final main Build
- [x] exact-main Production Pages deployment
- [x] public Production smoke
- [x] no authority expansion
- [x] planning closeout

**Plan 80 / Milestone H — Done.**

## 10. Next gate

Do not create Plan 90 by numbering inertia. Run a post-H Product Capability Roadmap Refresh using real usage evidence after Evidence Integrity. Previously deferred Static Full-text Search, Weekly Scheduled Automation, and Source / Author Directory remain candidates until re-ranked.
