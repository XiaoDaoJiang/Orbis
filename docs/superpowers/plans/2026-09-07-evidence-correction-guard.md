# Plan 80C · Correction Guard + Production Closeout

> Status: In Progress
> Milestone: H — Evidence Integrity
> Implementation base: `main@ebd38ef890ba3f3d40d03b754085cbd73a44a080`
> Implementation branch: `feat/evidence-correction-guard`
> 80B: PR #35 merged
> 80B fresh main Build: `34108101313` success
> Main artifact: `10013259615`
> Main artifact SHA-256: `1a5925bbea154e3f6ec5a06585498779467f53266a38c5ed09a22b06d17b5dae`

## Goal

Turn published Daily correction provenance into an enforceable repository contract without expanding Scheduled, merge, Registry, or Pages authority.

## 80C contract

Add:

```text
pnpm evidence:daily:correction:guard --base <integration-base> --branch <correction-branch>
```

A valid correction PR must satisfy all of the following:

1. branch identity is `correction/daily/<YYYY-MM-DD>/<slug>`;
2. exactly one changed path exists and it is `content/briefs/<YYYY-MM-DD>.yaml`;
3. the target already exists in base and is `published`;
4. base and candidate are both Evidence V1 Daily briefs with matching `publishedAt`;
5. all pre-existing correction events are byte-for-semantics immutable and preserve order;
6. candidate appends at least one new correction event;
7. existing stable sections/facts/references may not be silently removed or renamed as a side effect of correction;
8. any factual mutation requires at least one newly appended correction event targeting that fact;
9. every appended correction target/evidence resolves under the normal Evidence Integrity evaluator;
10. generic Path Guard and full `pnpm build` remain mandatory.

The guard validates structure/provenance, not truth.

## Branch / workflow isolation

PR Preview Build keeps three distinct paths:

```text
feature/*                 -> generic Path Guard

automation/daily/*        -> generic Path Guard + Scheduled Daily guard

correction/daily/*        -> generic Path Guard + correction guard
```

Scheduled Daily must never invoke correction mode automatically.

## TDD cases

RED/GREEN coverage must include:

- valid append-only correction;
- wrong correction branch date;
- more than one changed path;
- non-Daily path;
- base target missing;
- base target not published;
- legacy base/candidate rejected;
- publishedAt mismatch;
- existing correction deleted;
- existing correction edited;
- existing correction reordered;
- candidate with no appended correction rejected;
- factual text/evidence mutation without a new targeting correction rejected;
- factual mutation with a new targeting correction accepted;
- appended correction with dangling target rejected;
- appended correction with dangling evidence rejected;
- pure correction-summary append without factual mutation accepted;
- Scheduled Daily branch continues to use only the Scheduled guard.

## Implementation files

Expected minimal surface:

```text
tools/evidence-integrity/correction-policy.ts
tools/evidence-integrity/correction-policy.test.ts
tools/evidence-integrity/correction-guard.ts
tools/evidence-integrity/correction-guard.integration.test.ts
.github/workflows/pr-preview-build.yml
package.json
docs/operations/published-daily-correction.md
AGENTS.md
```

Do not modify `content/**` in the 80C implementation PR.

## Behavior drills

After the implementation reaches GREEN, create temporary test branches/fixtures or local git integration fixtures that prove:

1. valid append-only correction passes;
2. correction-history mutation fails closed;
3. factual mutation without provenance fails closed;
4. correction branch cannot touch another path;
5. normal `automation/daily/*` remains isolated from correction flow.

No real published content must be changed merely to demonstrate the guard.

## PR Gate

Before Human Review:

- exact-base PR integration;
- Generic Path Guard success;
- correction guard workflow contract tests success;
- full `pnpm build` success;
- read-only PR artifact upload success;
- Trusted Preview public smoke success;
- no `content/**`, generated source, Registry, or Production authority changes.

## Merge / production closeout

After human merge:

1. require fresh `main` Site Build and artifact;
2. because 80B changed public Reading UI, deploy Production Pages from the exact final main SHA through the repository's existing explicit deployment workflow only;
3. verify public Reading page exposes correction notice, claim/ref anchors and canonical identity;
4. verify stable date alias still redirects to the 11-page Daily presentation;
5. verify public archive/latest/RSS/sitemap remain healthy;
6. update Plan 80 / README / Roadmap to Milestone H Done.

## Non-goals

- no automatic correction generation;
- no auto-merge;
- no automatic Pages deployment;
- no Source/Author/Topic Registry mutation;
- no truth scoring;
- no historical bulk migration;
- no Scheduled Daily authority expansion.
