# Plan 40A — Source & Author Registry + Referential Integrity Design

> Status: Approved for implementation
> Date: 2026-09-01
> Baseline: `main@241996d3b1ad3c38fcaaec7622e8f41c6641ab65`
> Roadmap: Plan 40 / Milestone D — Knowledge Identity

## 1. Purpose

Plan 40A upgrades Source and Author references from unconstrained strings to stable repository entities with build-time referential integrity.

The outcome is not merely two new content folders. The outcome is a content graph in which every Topic, declared Reference Source and Essay Author can be resolved deterministically before Astro, Slidev or RSS publishing begins.

Plan 40A is the identity and integrity layer. Plan 40B will consume the same registries in existing Web reading surfaces without redefining the contracts established here.

## 2. Approved product decisions

1. Source and Author canonical IDs come from their flat file names and Astro `entry.id` values.
2. Registry YAML must not repeat an `id` property.
3. IDs must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
4. `Reference.source` remains optional, but every declared value must resolve to a Source Registry entry.
5. Every Essay `authors[]` value is mandatory and must resolve to an Author Registry entry.
6. Every content `topics[]` value and every Topic `related[]` value must resolve to a Topic entry.
7. Archived Source and Author entities remain valid for historical references.
8. New content should not intentionally adopt archived entities, but Plan 40A does not attempt Git-history-aware warning enforcement.
9. Source and Author registries are human-governed; scheduled content agents cannot modify them.
10. Plan 40A adds no `/sources/` or `/authors/` routes and no Registry directory UI.

## 3. Canonical identity

Registry files are flat:

```text
content/sources/astro.yaml          -> source ID `astro`
content/sources/github.yaml         -> source ID `github`
content/sources/slidev.yaml         -> source ID `slidev`
content/authors/xiaodaojiang.yaml   -> author ID `xiaodaojiang`
```

Nested paths are rejected. Both of these are invalid:

```text
content/sources/github/docs.yaml
content/authors/team/xiaodaojiang.yaml
```

The validator also rejects two files that normalize to the same ID, such as `github.yaml` and `github.yml`.

## 4. Source entity contract

`sourceSchema` is strict and contains no `id` field.

```yaml
name: Astro
homepage: https://astro.build/
type: official
trustTier: primary
status: active
aliases:
  - withastro
description: Astro official project and documentation source.
```

Required fields:

- `name`: non-empty display name;
- `homepage`: absolute URL;
- `type`: `official | publisher | individual | community | aggregator`;
- `trustTier`: `primary | secondary | discovery`;
- `status`: `active | archived`.

Optional fields:

- `feed`: absolute URL;
- `aliases`: slug-like strings, default `[]`;
- `description`: meaningful text.

`type` describes what the entity is. `trustTier` is editorial governance metadata and does not automatically prove truth or reliability.

## 5. Author entity contract

`authorSchema` is strict and contains no `id` field.

```yaml
name: XiaoDaoJiang
status: active
url: https://github.com/XiaoDaoJiang
bio: Orbis author and maintainer.
```

Required fields:

- `name`;
- `status`: `active | archived`.

Optional fields:

- `url`: absolute URL;
- `bio`: meaningful text.

An Author does not require a public URL. Historical Essays may continue to resolve an archived Author.

## 6. Initial Registry data

Plan 40A registers only identities already required by real repository content:

```text
Sources
- astro
- github
- slidev

Authors
- xiaodaojiang
```

No broad third-party Source catalog is created in advance.

## 7. Astro content collections

`apps/web/src/content.config.ts` adds:

```ts
const sources = defineCollection({
  loader: glob({ pattern: '*.{yaml,yml}', base: '../../content/sources' }),
  schema: sourceSchema,
})

const authors = defineCollection({
  loader: glob({ pattern: '*.{yaml,yml}', base: '../../content/authors' }),
  schema: authorSchema,
})
```

The non-recursive glob is intentional and mirrors the flat canonical-ID contract.

These collections exist so Plan 40B and later SEO/JSON-LD work can consume validated metadata. Plan 40A does not add public Registry routes.

## 8. Validation architecture

Schema validation and cross-file integrity remain separate responsibilities.

```text
content/**
  -> per-file Zod schema validation
  -> parsed content snapshot
  -> referential integrity validation
  -> success / explicit relation failures
```

`tools/validate-content/index.ts` remains the CLI entry point. A focused module under `tools/validate-content/` owns Registry loading, canonical ID checks, relation extraction and relation validation.

The CLI must not place all relation logic into one large loop. The integrity module exposes small units for:

- deriving and validating canonical Registry IDs;
- loading Source, Author and Topic indexes;
- collecting references from each structured content shape;
- checking Topic, Source and Author relations;
- formatting deterministic error messages.

Per-file schema errors are reported first. Referential validation only runs over successfully parsed content, preventing cascades from malformed files.

## 9. Relations covered

Plan 40A validates all repository content, not only published entries.

### 9.1 Topic relations

The validator checks:

- Brief `topics[]`;
- Presentation `topics[]`;
- Essay `topics[]`;
- Knowledge `topics[]`;
- Weekly `trendMovements[].topic` because it is a Topic identity;
- Topic `related[]`.

Every referenced Topic must exist. A Topic may not list itself in `related[]`.

### 9.2 Source relations

The validator collects References from:

- Brief top-level `references`;
- Brief `sections[].references`;
- Daily/Ad-hoc `archivePicks`;
- standalone Presentation top-level `references`;
- standalone Presentation `sections[].references`;
- Essay frontmatter `references`;
- Knowledge frontmatter `references`.

A Reference without `source` remains valid. A declared `source` must resolve to `content/sources/<id>.yaml|yml`.

### 9.3 Author relations

Every Essay `authors[]` ID must resolve to the Author Registry.

## 10. Error contract

Failures are deterministic and include the content path, field path, relation kind and missing ID. Representative messages:

```text
Invalid relation: content/essays/example.md: authors[0] -> missing author "unknown-author"
Invalid relation: content/briefs/example.yaml: sections[1].references[0].source -> missing source "unknown-source"
Invalid relation: content/knowledge/example.md: topics[0] -> missing topic "unknown-topic"
Invalid relation: content/topics/example.yaml: related[0] -> missing topic "unknown-topic"
Invalid relation: content/topics/example.yaml: related[0] -> topic "example" cannot reference itself
Invalid registry ID: content/sources/GitHub.yaml -> "GitHub" must match ^[a-z0-9]+(?:-[a-z0-9]+)*$
Duplicate registry ID: source "github"
```

The CLI aggregates independent relation failures in stable path order, prints them, and exits non-zero.

## 11. Archived entities

`status: archived` means the identity remains part of the historical graph but should not be selected for new work.

Therefore:

- archived Source references pass validation;
- archived Author references pass validation;
- Plan 40A does not rewrite historical content;
- Plan 40A does not add a warning based on whether a relation is newly introduced;
- Plan 40B may display archived status inline.

## 12. Agent governance

`content/sources/**` and `content/authors/**` are not added to `content-agent` Path Guard allowlists.

`AGENTS.md` is updated to state explicitly:

- scheduled agents may use registered IDs;
- scheduled agents must not create or modify Source/Author Registry entries;
- proposed new Registry identities require explicit human review;
- generated Slidev and Web artifacts remain forbidden.

The existing repository-wide CODEOWNER continues to cover all `content/**` changes.

## 13. TDD and executable acceptance

Plan 40A uses two observable RED stages.

### RED 1 — Registry capability missing

A new contract test is wired into `pnpm validate` before production schemas or Registry files exist. It must fail because `sourceSchema` / `authorSchema` and Registry collections are absent while all pre-existing contracts remain green.

### GREEN 1 — Entity contracts and real registries

Implement schemas, real Source/Author files and Astro collections. Verify:

- valid entities parse;
- invalid enums, URLs, unknown properties and embedded `id` fail;
- canonical IDs come from file names;
- the real repository has exactly the expected initial IDs.

### RED 2 — Cross-file integrity missing

Add execution-level fixtures that run the real `pnpm content:validate` command and require rejection of missing Source, Author and Topic relations. Before the integrity module exists, the fixtures must incorrectly pass or lack the required explicit relation errors.

### GREEN 2 — Referential Integrity

Implement the integrity module and CLI integration. Verify:

- missing Source, Author, content Topic and related Topic fail;
- Topic self-relation fails;
- nested/invalid/duplicate Registry IDs fail;
- optional `Reference.source` remains valid when omitted;
- archived Source/Author relations remain valid;
- all real repository content validates;
- full Daily + Weekly + Talk build remains green;
- no new public routes are emitted;
- no generated source or `dist/**` is committed.

## 14. Expected file scope

Production files expected to change:

```text
packages/content-schema/src/index.ts
apps/web/src/content.config.ts
tools/validate-content/index.ts
tools/validate-content/referential-integrity.ts
content/sources/astro.yaml
content/sources/github.yaml
content/sources/slidev.yaml
content/authors/xiaodaojiang.yaml
AGENTS.md
```

Test and documentation files expected:

```text
packages/content-schema/test/schema.test.ts
tools/validate-content/registry-contract.test.ts
tools/validate-content/referential-integrity.test.ts
package.json
docs/superpowers/specs/2026-09-01-source-author-registry-integrity-design.md
docs/superpowers/plans/2026-09-01-source-author-registry-integrity.md
```

No changes are expected in Slide renderers, Presentation discovery/generation, build-slides, assembly, Archive/RSS/Topic product code or GitHub workflows.

## 15. Plan 40B boundary

Plan 40B will consume the validated registries in existing Web pages:

- resolve Essay authors into display names and optional profile links;
- render Reference Source name/type/trust metadata through a shared component;
- cover Brief, Essay and Knowledge reading surfaces;
- preserve unsourced References;
- display archived status;
- add no Source/Author directory routes.

Plan 40B must not redefine canonical IDs, schemas or integrity rules.

## 16. Non-goals

Plan 40A does not implement:

- Source/Author public directory or detail pages;
- reverse content aggregation by Source/Author;
- automatic trust scoring;
- source authenticity determination;
- citation graph storage;
- aliases as automatic relation resolution;
- ORCID, Google Scholar or account integration;
- Git-history-aware warnings for newly introduced archived relations;
- new databases, CMS or server runtime.

## 17. Exit criteria

Plan 40A is complete when:

1. Source and Author entities have strict schemas and canonical file-name IDs.
2. Initial real Registry entries exist and are Astro collections.
3. Every Essay Author resolves.
4. Every declared Reference Source resolves.
5. Every content Topic, Weekly trend Topic and Topic.related relation resolves.
6. Invalid or duplicate Registry IDs fail deterministically.
7. Archived entities remain historically resolvable.
8. Scheduled agents remain unable to modify registries.
9. The full repository build and public Preview pass without Slide/RSS/Archive regressions.
10. Plan 40B can consume the registries without changing the identity contract.
