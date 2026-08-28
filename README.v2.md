# Orbis Site V2 Prototype

This branch implements the first vertical prototype of the planned Astro + Slidev monorepo.

## What is included

- Astro static content site for Essays, Briefs, Topics and Knowledge;
- Slidev rendering for a structured Daily Brief;
- shared Zod content schema;
- shared design tokens;
- RSS output at `/rss.xml`;
- content validation and prototype artifact checks;
- GitHub Actions build workflow that does not replace the current production Pages site.

## Commands

```bash
corepack enable
pnpm install --no-frozen-lockfile
pnpm build
```

The assembled static prototype is written to:

```text
dist/site/
```

## Architecture boundary

Automated content agents may update files under `content/`, but must not modify application components, design tokens, workflows or build tools without explicit review.
