# Plan 80C · Correction Guard + Production Closeout

> Status: Review Gate · PR #36
> Milestone: H — Evidence Integrity
> Implementation base: `main@ebd38ef890ba3f3d40d03b754085cbd73a44a080`
> Implementation branch: `feat/evidence-correction-guard`
> Final implementation head: `d8adc2e1d2468c63b8064ee45460b18851ea9742`
> 80B: PR #35 merged
> 80B fresh main Build: `34108101313` success
> Main artifact: `10013259615`
> Main artifact SHA-256: `1a5925bbea154e3f6ec5a06585498779467f53266a38c5ed09a22b06d17b5dae`

## Goal

Turn published Daily correction provenance into an enforceable repository contract without expanding Scheduled, merge, Registry, or Pages authority.

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
8. any factual text/evidence mutation requires a newly appended correction event targeting that fact;
9. newly added factual claims also require newly appended correction provenance;
10. changing an existing canonical reference requires explicit appended correction evidence plus targets for all affected facts;
11. every appended correction target/evidence resolves under the normal Evidence Integrity evaluator;
12. generic Path Guard and full `pnpm build` remain mandatory.

The guard validates structure/provenance, not truth.

## Branch / workflow isolation

PR Preview Build now keeps three distinct paths:

```text
feature/*                 -> generic Path Guard

automation/daily/*        -> generic Path Guard + Scheduled Daily guard

correction/daily/*        -> generic Path Guard + correction guard
```

Scheduled Daily never invokes correction mode automatically.

## Implemented TDD / behavior coverage

The final 80C build includes:

- valid append-only correction;
- wrong correction branch/date/change-set rejection;
- base target missing / non-published rejection;
- legacy base/candidate fail-closed behavior;
- publishedAt mismatch rejection;
- existing correction delete/edit/reorder rejection;
- candidate with no appended correction rejection;
- factual text/evidence mutation without new targeting correction rejection;
- factual mutation with new targeting correction acceptance;
- newly added fact requires appended correction target;
- stable section/fact/reference identity preservation;
- reference mutation requires correction evidence + affected fact target coverage;
- dangling correction target rejection through shared Evidence evaluator;
- real temporary-Git integration tests for valid and invalid correction history;
- PR Preview branch routing contract for Scheduled vs correction workflows.

No real published content is changed merely to demonstrate the guard.

## Implementation surface

The 80C implementation PR changes only guard/tooling/workflow/tests/docs/package wiring:

```text
.github/workflows/pr-preview-build.yml
AGENTS.md
docs/operations/chatgpt-scheduled-daily.md
docs/operations/published-daily-correction.md
package.json
tools/content-automation/preview-workflow.test.ts
tools/evidence-integrity/correction-policy.ts
tools/evidence-integrity/correction-policy.test.ts
tools/evidence-integrity/correction-legacy.test.ts
tools/evidence-integrity/correction-guard.ts
tools/evidence-integrity/correction-guard.integration.test.ts
```

No `content/**`, Registry identity, generated Slidev source, `dist/**`, merge policy, or Production Pages authority is changed.

## Final PR validation

```text
PR                           #36
Base                         main@ebd38ef890ba3f3d40d03b754085cbd73a44a080
Head                         d8adc2e1d2468c63b8064ee45460b18851ea9742
Read-only PR Build           34109064068 success
Preview Artifact             10013666375
Artifact SHA-256             f52672691bcd7c6c2670789cfa92d2682b2aa5129a875c4da648c39a342d8347
Trusted Preview              passed
Public availability smoke    passed
PR state                     Ready for review
```

Observed contract results:

```text
Generic Path Guard                               passed
Scheduled Daily guard                            skipped · correct feature-branch isolation
Published correction workflow step               skipped · correct feature-branch isolation
Scheduled + correction workflow contract         passed
Published Daily correction policy                passed
Legacy published correction fail-closed          passed
Published Daily correction real-Git integration  passed
Evidence V1 11-slide renderer                    passed
Evidence provenance UI artifact                  passed
Full pnpm build                                   passed
Preview artifact upload                           passed
```

Trusted Preview:

```text
https://raw.githack.com/XiaoDaoJiang/Orbis/preview-pr-36/index.html
```

## Human Review Gate

```text
80C implementation Build + Preview   Done
                ↓
Human Review / merge PR #36          ← current
                ↓
fresh main Site Build
                ↓
verify correction guard on main
                ↓
explicit exact-SHA Production Pages
                ↓
public HTTP smoke
                ↓
Plan 80 / Milestone H Done
```

PR #36 must not be auto-merged.

## Merge / production closeout

After human merge:

1. require fresh `main` Site Build and artifact;
2. confirm the correction guard and branch routing are present on the exact final main SHA;
3. because 80B changed public Reading UI, deploy Production Pages from that exact final main SHA through the repository's existing explicit deployment workflow only;
4. verify `/briefs/2026-09-07/` exposes the correction notice, stable claim/ref anchors and canonical identity;
5. verify `/2026/09/07/` still redirects to the 11-page Daily presentation while keeping Reading canonical identity;
6. verify public archive/latest/RSS/sitemap remain healthy;
7. update Plan 80 / README / Roadmap to Milestone H Done.

## Non-goals / authority boundary

- no automatic correction generation;
- no auto-merge;
- no automatic Pages deployment;
- no Source/Author/Topic Registry mutation;
- no truth scoring;
- no historical bulk migration;
- no Scheduled Daily authority expansion.
