# Plan 80C · Correction Guard + Production Closeout

> Status: Done
> Milestone: H — Evidence Integrity · Done
> Implementation base: `main@ebd38ef890ba3f3d40d03b754085cbd73a44a080`
> Implementation branch: `feat/evidence-correction-guard`
> Final implementation head: `d8adc2e1d2468c63b8064ee45460b18851ea9742`
> PR: #36 merged
> Final main: `fee254c81e899bc77c4671eda472071c390621a9`
> Production run: `34191412383` success
> Closeout: [`../../plan/2026-09-08-milestone-h-evidence-integrity-closeout.md`](../../plan/2026-09-08-milestone-h-evidence-integrity-closeout.md)

## Goal · Achieved

Published Daily correction provenance is now an enforceable repository contract without expanding Scheduled, merge, Registry, or Pages authority.

Repository command:

```text
pnpm evidence:daily:correction:guard --base <integration-base> --branch <correction-branch>
```

## Implemented correction contract

A valid correction PR must satisfy:

1. branch identity `correction/daily/<YYYY-MM-DD>/<slug>`;
2. exactly one changed path: `content/briefs/<YYYY-MM-DD>.yaml`;
3. base target exists and is `published`;
4. base and candidate are Evidence V1 Daily with matching identity;
5. pre-existing correction events are immutable and order-preserving;
6. candidate appends at least one new correction event;
7. existing stable section/fact/reference identities cannot silently disappear or be renamed;
8. factual text/evidence mutations require newly appended correction targets;
9. new factual claims require new provenance;
10. canonical reference mutation requires explicit correction evidence plus affected fact targets;
11. appended targets/evidence resolve through normal Evidence Integrity;
12. Generic Path Guard and full `pnpm build` remain mandatory.

The guard validates provenance structure, not factual truth.

## Branch / workflow isolation

```text
feature/*                 → Generic Path Guard

automation/daily/*        → Generic Path Guard + Scheduled Daily guard

correction/daily/*        → Generic Path Guard + Published Daily correction guard
```

Scheduled Daily never invokes correction mode automatically.

## TDD / behavior coverage · Passed

The implementation proves:

- valid append-only correction passes;
- correction-history delete/edit/reorder fails closed;
- wrong branch/date/change-set fails closed;
- missing/non-published/legacy base fails closed;
- factual mutation without matching provenance fails closed;
- factual mutation with matching new correction target passes;
- stable section/fact/reference identity is preserved;
- reference mutation requires correction evidence + affected fact target coverage;
- dangling correction target/evidence fails through the shared Evidence evaluator;
- real temporary-Git integration covers valid and invalid flows;
- feature, Scheduled Daily and correction PR authority remain isolated.

No real published content was changed merely to demonstrate the guard.

## Implementation validation · Passed

```text
PR                           #36
Base                         main@ebd38ef890ba3f3d40d03b754085cbd73a44a080
Head                         d8adc2e1d2468c63b8064ee45460b18851ea9742
Read-only PR Build           34109064068 success
Preview Artifact             10013666375
Artifact SHA-256             f52672691bcd7c6c2670789cfa92d2682b2aa5129a875c4da648c39a342d8347
Trusted Preview              passed
Public availability smoke    passed
Human merge                  passed
Merge commit                 fee254c81e899bc77c4671eda472071c390621a9
```

## Fresh final main Gate · Passed

```text
main                         fee254c81e899bc77c4671eda472071c390621a9
fresh Site Build             34179976055 success
main Artifact                10038587455
main Artifact SHA-256        bb1ce4aaddbafa7d7423d9b1b182f6843760f6cb0dfd630ac70615462f0e01f5
```

The exact final main includes `correction/daily/* → evidence:daily:correction:guard` routing.

## Production closeout · Passed

The existing explicit Production workflow was manually dispatched on the exact final main with deployment enabled.

```text
Production run               34191412383
head_sha                     fee254c81e899bc77c4671eda472071c390621a9
Build production artifact    success
Deploy to GitHub Pages       success
Pages Artifact               10042373095
Pages Artifact SHA-256       e0bed6d0c91b1fe095d42a807a73f1a8967a9d127c3babdcddc534d7412b45c9
Production URL               https://xiaodaojiang.github.io/Orbis/
```

Built-in public smoke passed `/`, `/latest/`, `/archive.json`, `/rss.xml`, `/favicon.svg`, and latest structured Daily `/2026/09/07/`.

The exact deployed artifact was also inspected and confirms the 2026-09-07 Reading correction notice, stable claim/ref anchors, evidence links, correction history, stable Slides redirect, Reading canonical, archive/latest identity, RSS and sitemap.

## Authority boundary preserved

- no automatic correction generation;
- no auto-merge;
- no automatic Pages deployment;
- no Source/Author/Topic Registry mutation;
- no truth scoring;
- no historical bulk migration;
- no Scheduled Daily authority expansion.

**80C — Done. Milestone H production closeout passed.**
