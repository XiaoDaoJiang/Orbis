# Weekly Artifact Real-Date-Order Regression

PR #27 introduced the first real Daily (`2026-09-04`) newer than the first real Weekly (`2026-09-01`). The Scheduled Daily content and guards were valid, but `tools/weekly-brief/weekly-artifact-check.ts` still assumed the real Weekly must always be newer than the real Daily.

That assumption was only useful when Plan 30 first shipped. It is not a durable repository invariant.

The regression fix keeps these durable invariants:

- Homepage Latest Brief follows actual published Brief ordering across Daily and Weekly content;
- Weekly remains discoverable through Weekly/Briefs/Archive/RSS/Topics/Slides;
- `archive.json.latest` remains the newest published Daily date;
- `archive.json.issues` remains Daily-only;
- `/latest/` remains the newest Daily stable route.

The fix deliberately does not modify PR #27 or any `content/**` source. PR #27 remains the real post-fix proof for the ordering `Daily 2026-09-04 > Weekly 2026-09-01`.
