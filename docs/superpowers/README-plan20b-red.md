# Plan 20B RED boundary

This short-lived implementation note records the intended first RED boundary for Plan 20B.

At this commit, the branch contains the approved design/implementation plan and a new standalone Presentation contract, but intentionally does not yet contain:

- `presentationContentSchema`;
- standalone Presentation source adapter;
- descriptor discovery/duplicate gate;
- `talk-v1` renderer;
- standalone Presentation content.

The first Draft PR build is expected to fail in `standalone-presentation.test.ts` for the missing standalone Presentation capability. Production implementation starts only after that RED failure is observed.
