# Plan 80C · Correction Guard + Production Closeout

> Status: Production Gate
> Milestone: H — Evidence Integrity
> Implementation base: `main@ebd38ef890ba3f3d40d03b754085cbd73a44a080`
> Implementation branch: `feat/evidence-correction-guard`
> Final implementation head: `d8adc2e1d2468c63b8064ee45460b18851ea9742`
> PR: #36 merged
> Final main: `fee254c81e899bc77c4671eda472071c390621a9`
> Fresh main Build: `34179976055` success
> Main artifact: `10038587455`
> Main artifact SHA-256: `bb1ce4aaddbafa7d7423d9b1b182f6843760f6cb0dfd630ac70615462f0e01f5`

## Goal

Turn published Daily correction provenance into an enforceable repository contract without expanding Scheduled, merge, Registry, or Pages authority, then close Milestone H through an explicit Production deployment and public smoke.

## Implemented correction contract

Repository command:

```text
pnpm evidence:daily:correction:guard --base <integration-base> --branch <correction-branch>
```

A valid correction PR must satisfy all of the following:

1. branch identity is `correction/daily/<YYYY-MM-DD>/<slug>`;
2. exactly one changed path exists and it is `content/briefs/<YYYY-MM-DD>.yaml`;
3. the target already exists in base and is `published`;
4. base and candidate are both Evidence V1 Daily briefs with matching `publishedAt`;
5. all pre-existing correction events are semantically immutable and preserve order;
6. candidate appends at least one new correction event;
7. existing stable sections/facts/references may not be silently removed or renamed;
8. factual text/evidence mutation requires a newly appended correction targeting that fact;
9. newly added factual claims also require appended correction provenance;
10. changing an existing canonical reference requires explicit appended correction evidence plus targets for all affected facts;
11. every appended correction target/evidence resolves under the normal Evidence Integrity evaluator;
12. Generic Path Guard and full `pnpm build` remain mandatory.

The guard validates provenance structure, not factual truth.

## Branch / workflow isolation

PR Preview Build keeps three distinct paths:

```text
feature/*                 -> Generic Path Guard

automation/daily/*        -> Generic Path Guard + Scheduled Daily guard

correction/daily/*        -> Generic Path Guard + Published Daily correction guard
```

Scheduled Daily never invokes correction mode automatically.

## TDD / behavior coverage

The final implementation proves:

- valid append-only correction passes;
- correction-history delete/edit/reorder fails closed;
- wrong branch/date/change-set fails closed;
- base missing / non-published / legacy Daily correction fails closed;
- factual mutation without matching new correction target fails closed;
- factual mutation with matching new correction target passes;
- stable section/fact/reference identity cannot silently disappear;
- reference mutation requires correction evidence and affected fact targets;
- dangling correction target/evidence fails through the shared Evidence evaluator;
- real temporary-Git integration exercises both valid and invalid correction flows;
- normal feature, Scheduled Daily and correction PR authority remain isolated.

No real published content was modified merely to demonstrate the guard.

## 80C implementation validation

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

PR #36 was human-merged. The repository default branch is exactly:

```text
main                         fee254c81e899bc77c4671eda472071c390621a9
fresh Site Build             34179976055 success
main Artifact                10038587455
main Artifact SHA-256        bb1ce4aaddbafa7d7423d9b1b182f6843760f6cb0dfd630ac70615462f0e01f5
```

The current main PR Preview workflow contains the `correction/daily/*` routing and invokes `evidence:daily:correction:guard`, so the correction contract is integrated into the exact final main tree rather than existing only on the feature branch.

## Current Production Gate

80C implementation and final-main validation are complete. The remaining authority boundary is intentionally explicit:

```text
PR #36 Human merge              Done
        ↓
fresh main Site Build           Done
        ↓
correction guard on exact main  Verified
        ↓
Orbis Pages Production
workflow_dispatch on main
inputs.deploy = true            ← current
        ↓
public HTTP smoke
        ↓
Plan 80 / Milestone H Done
```

The Production workflow is manual by design. It grants Pages write / OIDC only to its deploy job when `github.ref == refs/heads/main` and `inputs.deploy == true`; merge, Scheduled Daily, correction producer, and ordinary PR builds do not receive that authority.

## Production closeout acceptance

After the explicit Production run succeeds, verify:

1. Production run `head_sha` equals `fee254c81e899bc77c4671eda472071c390621a9`;
2. `/briefs/2026-09-07/` exposes the correction notice and stable claim/ref anchors;
3. `/2026/09/07/` keeps its stable redirect to the 11-page Daily presentation;
4. `/archive.json`, `/latest/`, `/rss.xml`, `/sitemap.xml` remain healthy;
5. canonical identity does not contain Preview paths;
6. Roadmap / Plan 80 / README are closed as Milestone H Done.

## Non-goals / authority boundary

- no automatic correction generation;
- no auto-merge;
- no automatic Pages deployment;
- no Source/Author/Topic Registry mutation;
- no truth scoring;
- no historical bulk migration;
- no Scheduled Daily authority expansion.
