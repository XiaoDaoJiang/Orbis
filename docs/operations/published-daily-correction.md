# Published Daily Correction Workflow

This is the explicit workflow for correcting an already-published Daily after Evidence Integrity activation.

It is separate from Scheduled Daily generation. A normal Scheduled Daily run must never enter this workflow automatically.

## Preconditions

The target on the PR integration base must:

- already exist at `content/briefs/YYYY-MM-DD.yaml`;
- have `status: published`;
- be an Evidence V1 Daily (`evidenceVersion: 1`).

A frozen legacy Daily is intentionally rejected by the correction guard. If a legacy Daily needs correction, first perform an explicit human-reviewed full re-verification / Evidence V1 migration. Do not mechanically map old section references onto every fact.

## Branch identity

Use:

```text
correction/daily/YYYY-MM-DD/<kebab-slug>
```

The branch date is authority: the PR may modify exactly:

```text
content/briefs/YYYY-MM-DD.yaml
```

No Registry, config, tool, UI, generated-source or other content path belongs in a published-content correction PR.

## Correction event contract

Existing correction history is append-only. A correction PR must append at least one new event:

```yaml
corrections:
  - id: stable-correction-id
    correctedAt: YYYY-MM-DD
    summary: Human-readable correction summary
    targets:
      - section: stable-section-id
        fact: stable-fact-id
    evidence:
      - canonical-reference-id
```

Rules:

- existing correction events cannot be deleted, edited, or reordered;
- existing section, fact and reference identities cannot be removed or renamed;
- changed factual `text` / `evidence` must be targeted by a newly appended correction;
- a new factual claim must also be targeted by the new correction;
- changing an existing canonical reference requires the new correction to name that evidence and target all affected facts;
- appended correction targets and evidence must resolve under the normal Evidence Integrity validator;
- the guard proves provenance structure, not factual truth.

Prefer adding a new canonical Evidence reference over rewriting historical evidence when the correction introduces a genuinely new source.

## Required validation

The PR Preview Build enforces:

```text
Generic Path Guard
        +
Published Daily correction guard
        +
full pnpm build
        +
read-only Preview artifact
        +
Trusted Preview public smoke
```

Equivalent local command:

```bash
pnpm evidence:daily:correction:guard \
  --base <integration-base> \
  --branch correction/daily/YYYY-MM-DD/<slug>
```

The guard uses the PR integration base, not a stale event payload.

## Authority boundary

Correction producers do not receive authority to:

- modify `main` directly;
- auto-merge;
- trigger Production Pages;
- create or mutate Source / Author / Topic Registry identities;
- enter correction mode from Scheduled Daily;
- rewrite other historical Daily files.

Human review and merge remain mandatory.

## After merge

Require a fresh `main` Site Build. If the correction changes public output, use the repository's existing explicit exact-SHA Production Pages workflow and verify public HTTP output afterwards.
