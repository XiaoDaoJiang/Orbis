# Plan 30B Implementation Plan Self-Review Corrections

This note records two corrections discovered immediately before execution so the implementation does not encode temporary checkpoint state or invent DOM contracts.

1. `tools/generate-slides/weekly-v1.test.ts` must **not** permanently assert `weekly.presentation.enabled === false`. The real Weekly is intentionally disabled during RED 1 / GREEN 1, but GREEN 2 enables it. Enablement state is proven by commit order and cloud checkpoints, not by a permanent template test.
2. `/slides/` currently exposes `data-presentation-id` and `data-presentation-source`; cadence appears in visible metadata text (`Brief presentation · weekly · <date>`). Integration tests must assert that real DOM contract rather than inventing a `data-presentation-cadence` attribute.

These corrections do not change the approved product design, architecture, slide-count contract, or TDD sequence.
