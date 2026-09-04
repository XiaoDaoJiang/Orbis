# Weekly Artifact Date-Order Regression Fix

## Context

PR #27 (`automation/daily/2026-09-04`) is the first real Scheduled Daily candidate newer than the existing Weekly (`2026-09-01`). Its Path Guard, Scheduled Daily Guard, schema/content validation, Astro build, Slidev build, assembly, site checks and presentation-scope checks all passed. The build failed only at the legacy Weekly artifact assertion that required real Weekly content to remain newer than real Daily content.

## Scope

- remove the real-content date-order precondition from `tools/weekly-brief/weekly-artifact-check.ts`;
- derive Homepage Latest Brief from actual published Daily + Weekly ordering;
- keep Weekly discovery assertions;
- keep Daily-only `archive.json` and `/latest/` isolation assertions;
- add a focused source-level regression contract preventing the old assumption from returning;
- do not modify PR #27 or `content/**`.

## Verification

1. focused regression contract passes;
2. full PR Build passes on the fix branch;
3. Trusted Preview passes;
4. merge fix to main;
5. re-run/re-evaluate PR #27 against updated main;
6. require PR #27 to pass with real ordering `Daily 2026-09-04 > Weekly 2026-09-01` before closing the incident.
