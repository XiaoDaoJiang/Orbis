# Plan 30A RED Boundary

This short-lived note records the intended first TDD boundary for Plan 30A.

At this commit, the branch has the approved design/implementation plan and a Weekly schema contract, but production `weeklyBriefSchema` does not exist yet.

The first Draft PR build is expected to pass the existing baseline checks and fail at `tools/weekly-brief/weekly-schema.test.ts` with:

```text
weeklyBriefSchema must exist before Weekly Briefs can be validated
```

This note will be removed after the failing cloud run is recorded in the PR history.
