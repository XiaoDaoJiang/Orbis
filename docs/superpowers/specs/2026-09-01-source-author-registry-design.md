# Orbis Source & Author Registry Design

> Status: Approved
> Date: 2026-09-01
> Baseline: `main@241996d3b1ad3c38fcaaec7622e8f41c6641ab65`
> Roadmap: Plan 40 · Knowledge Identity

## 1. Purpose

Orbis already constrains content shape through Zod, but identity-bearing relations are still free strings:

- Essay `authors[]` does not resolve to a stable Author entity;
- `Reference.source` may drift by spelling or capitalization;
- content `topics[]` and Topic `related[]` are not validated across files;
- the Web UI cannot reliably display Author or Source metadata.

Plan 40 introduces the smallest useful registry and referential-integrity layer without adding a database, CMS, graph service, runtime API, or registry directory pages.

The product outcome is:

```text
structured content
      ↓
canonical entity IDs
      ↓
referential integrity at build time
      ↓
registry-backed Author and Source metadata in existing reading pages
```

## 2. Delivery decomposition

Plan 40 is delivered as two independently reviewable pull requests.

### 40A — Registry + Referential Integrity

- add Source and Author schemas and real registry entries;
- register Astro content collections;
- validate canonical registry IDs and all supported cross-file relations;
- migrate current content to registered IDs where already declared;
- keep registry changes human-governed;
- make invalid relations fail `pnpm content:validate` and therefore the full build.

### 40B — Registry-backed Web UI

- resolve Essay authors to Author metadata;
- render a shared Web Reference list with optional Source metadata;
- apply it to existing Essay, Brief and Knowledge reading surfaces;
- keep source-less references valid and visually stable;
- do not create `/sources/` or `/authors/` routes.

40B is developed as a stacked branch on 40A so both slices can be completed without bypassing the human merge decision.

## 3. Canonical identity

### 3.1 Filename-derived IDs

Registry IDs come only from the flat filename / Astro collection entry ID.

```text
content/sources/github.yaml
→ source ID: github

content/authors/xiaodaojiang.yaml
→ author ID: xiaodaojiang
```

Registry YAML must not repeat an `id` field. This prevents filename and body metadata from becoming two conflicting identity sources.

### 3.2 ID grammar

Every Source and Author ID must match:

```regex
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

Examples:

```text
valid:   github, simon-willison, anthropic-docs
invalid: GitHub, github_docs, github/docs, github docs
```

Registry directories are flat in v1. Nested YAML files are rejected because their path-to-ID semantics are intentionally undefined.

A `.yaml` and `.yml` pair with the same basename is a duplicate canonical ID and must fail validation.

## 4. Source Registry contract

Directory:

```text
content/sources/*.yaml
```

Schema:

```yaml
name: GitHub
homepage: https://github.com/
type: official
trustTier: primary
status: active

# optional
feed: https://github.blog/feed/
aliases:
  - github-docs
description: GitHub official project, documentation and platform source.
```

Required fields:

- `name`: human-readable label;
- `homepage`: canonical public URL;
- `type`;
- `trustTier`;
- `status`.

Optional fields:

- `feed`;
- `aliases`;
- `description`.

Enums:

```text
type:
  official | publisher | individual | community | aggregator

trustTier:
  primary | secondary | discovery

status:
  active | archived
```

`type` describes what the source is. `trustTier` records editorial usage guidance, not an automated truth score.

- `primary`: original material, official documentation, or the author/project itself;
- `secondary`: high-quality analysis or reporting;
- `discovery`: a source suitable for finding candidates but insufficient by itself for important claims.

Initial Source entities are deliberately limited to current real usage:

```text
astro

github

slidev
```

## 5. Author Registry contract

Directory:

```text
content/authors/*.yaml
```

Schema:

```yaml
name: XiaoDaoJiang
status: active

# optional
url: https://github.com/XiaoDaoJiang
bio: Orbis author and maintainer.
```

Required fields:

- `name`;
- `status`.

Optional fields:

- `url`;
- `bio`.

Status:

```text
active | archived
```

An Author does not require a public URL. Identity is the registry ID plus stable metadata, not the existence of a social profile.

Initial Author entities:

```text
xiaodaojiang
```

## 6. Relation semantics

### 6.1 Essay authors

Every Essay `authors[]` item is a required Author ID and must resolve to `content/authors/<id>.yaml`.

No unknown-string compatibility mode is retained because Essay authors are already mandatory.

### 6.2 Reference Source

`Reference.source` remains optional.

```yaml
references:
  - title: Astro Content Collections
    url: https://docs.astro.build/...
    source: astro
    supports: ...
```

When present, it is a Source ID and must resolve to `content/sources/<id>.yaml`.

A Reference without `source` remains valid. This allows a scheduled content Agent to cite a newly discovered primary URL without gaining permission to create or edit Registry entities.

Source metadata is never embedded inside a Reference. The Registry remains the single metadata source.

### 6.3 Topics

All `topics[]` values on Brief, Presentation, Essay and Knowledge content must resolve to a Topic collection entry.

Every Topic `related[]` value must also resolve to another Topic entry. Self-reference is rejected because it has no useful product meaning.

### 6.4 Archived entities

An archived Source or Author remains a valid historical identity.

```text
active:
  may be used by current editorial work

archived:
  historical relations remain valid;
  new content should not adopt it
```

Build-time integrity checks enforce existence, not active-only usage. This prevents a registry status change from invalidating historical content.

The Agent contract states that new automated content must not intentionally introduce archived Source or Author IDs. V1 does not add Git-history-aware warnings for newly introduced archived references.

## 7. Referential-integrity architecture

Per-file schema validation and cross-file validation remain separate units.

```text
content files
   ↓
Schema parsing
   ↓
Validated content catalog
   ↓
Referential integrity validator
   ├── registry identity rules
   ├── Essay Author relations
   ├── optional Reference Source relations
   ├── content Topic relations
   └── Topic.related relations
   ↓
aggregated diagnostics + non-zero exit
```

The implementation uses focused modules under `tools/validate-content/` rather than growing the CLI entrypoint into one large function.

The validator must inspect every Reference-bearing location:

- Brief top-level `references`;
- Brief section `references`;
- Daily/Ad-hoc `archivePicks`;
- standalone Presentation top-level `references`;
- standalone Presentation section `references`;
- Essay frontmatter `references`;
- Knowledge frontmatter `references`.

Diagnostics include the missing ID, relation kind, source file and field path. Validation collects all relation failures in one run where practical.

Representative messages:

```text
Missing Source "unknown" at content/briefs/example.yaml references[0].source
Missing Author "unknown" at content/essays/example.md authors[0]
Missing Topic "unknown" at content/knowledge/example.md topics[0]
Missing related Topic "unknown" at content/topics/example.yaml related[0]
Invalid Source registry ID "GitHub" from content/sources/GitHub.yaml
Nested Source registry entries are not supported: content/sources/vendors/github.yaml
```

`pnpm content:validate` owns the complete validation result so every existing caller automatically receives the new gate.

## 8. Governance

Sources and Authors are editorial governance data, not routine Agent output.

The enforceable `content-agent` allowlist continues to permit only:

```text
content/briefs/**
content/presentations/**
content/essays/**
content/knowledge/**
```

It does not permit:

```text
content/sources/**
content/authors/**
content/topics/**
```

`AGENTS.md` explicitly records that Source, Author, Topic and configuration changes require human approval. A focused Path Guard test proves Registry paths remain denied to content-agent mode.

`CODEOWNERS` already assigns `/content/` to the repository owner and needs no narrower ownership rule in v1.

## 9. Astro collections

The Web content configuration adds `sources` and `authors` YAML collections using the shared schemas.

The collections provide:

- build-time metadata loading;
- filename-derived canonical IDs;
- type-safe consumption by 40B;
- no automatic public route.

Adding a collection does not imply adding an index or detail page.

## 10. Registry-backed Web UI

### 10.1 Author byline

Essay detail pages resolve `authors[]` through the Author collection and display a byline below the description/topics.

```text
By XiaoDaoJiang ↗
```

- an Author with `url` renders as an external link;
- an Author without `url` renders as text;
- an archived Author remains visible and receives an `archived` status label;
- raw Author IDs are not shown as the primary label.

### 10.2 Shared Reference list

A shared Astro `ReferenceList` component renders existing Reference semantics:

```text
title link — supports
Source: GitHub · primary
```

Rules:

- the concrete Reference URL remains the main link;
- when `source` exists, Source name and `trustTier` are displayed;
- archived Source state is displayed;
- when `source` is absent, rendering remains the existing title/supports form;
- the Source homepage is optional secondary metadata, not a replacement for the cited URL;
- inaccessible relations are treated as programmer/build errors because 40A already guarantees integrity.

The component is used by Web reading surfaces that expose References:

- Daily Brief;
- Weekly Brief;
- Ad-hoc Brief;
- Essay frontmatter References;
- Knowledge References.

Section-level Brief References use the same resolver where they are displayed.

Standalone Presentation has no reading detail page in v1. Slidev renderers remain unchanged: they keep rendering the concrete title, URL and support text. Plan 40 validates their `source` IDs but does not inject Registry metadata into the Presentation descriptor or Slidev runtime.

### 10.3 No Registry routes

V1 intentionally does not create:

```text
/sources/
/sources/:id/
/authors/
/authors/:id/
```

Those routes would introduce reverse aggregation, navigation, empty-state, SEO and lifecycle contracts without a demonstrated browsing need.

## 11. Testing and TDD sequence

### 40A RED

Before implementation, executable tests require:

- exported `sourceSchema` and `authorSchema`;
- valid filename-derived Registry IDs;
- a referential-integrity module;
- rejection of missing Source/Author/Topic relations;
- Registry paths denied in content-agent mode.

The first PR Build must fail at the intended missing Registry capability after existing baseline tests pass.

### 40A GREEN

- schema positive and negative cases pass;
- real Source and Author entries validate;
- current content relations resolve;
- missing Source, Author, content Topic and `Topic.related` fixtures fail through the real `content:validate` command;
- optional Source and archived entities remain valid;
- Path Guard proves automated content tasks cannot edit registries;
- complete `pnpm build`, artifact upload and Trusted Preview pass without UI changes.

### 40B RED

Before UI implementation, an artifact contract expects:

- the Essay Author label/link;
- Source metadata for a registered Reference;
- stable fallback for a source-less Reference;
- no Source or Author public routes.

The stacked PR Build must fail at these missing UI markers while 40A integrity remains green.

### 40B GREEN

- shared resolver/component contracts pass;
- Essay byline resolves Registry metadata;
- Brief/Essay/Knowledge Web Reference UI uses Registry metadata when available;
- archived and URL-less entities have deterministic rendering;
- RSS, Archive, Topic, Daily/Weekly/Talk Presentation builds and Daily latest routes do not regress;
- no `/sources/` or `/authors/` artifact exists;
- full build, artifact and Trusted Preview pass.

## 12. Scope exclusions

Plan 40 does not include:

- Source or Author directory/detail pages;
- automatic trust scoring or source verification;
- citation graph storage;
- ORCID, Google Scholar or social-profile integrations;
- automatic Source creation from domains;
- mandatory `Reference.source` for all citations;
- active-only relation enforcement;
- runtime APIs or client-side data fetching;
- Slidev Source badges;
- SEO/JSON-LD entity output, which remains Plan 50;
- Knowledge review automation, which remains Plan 60.

## 13. Acceptance criteria

Plan 40 is complete when both PRs are merged and publicly verified:

- Source and Author IDs are filename-derived and schema-validated;
- every Essay Author resolves;
- every declared Reference Source resolves;
- all content Topics and Topic.related relations resolve;
- invalid relations fail `pnpm content:validate` with actionable paths;
- archived entities preserve historical validity;
- Source/Author Registry edits remain outside the scheduled content-agent allowlist;
- Essay pages display resolved Author metadata;
- Web References display Source metadata when declared and preserve source-less fallback;
- no Registry public routes are introduced;
- current Daily, Weekly, Talk, RSS, Archive, Topic, Related and Daily latest contracts remain green;
- generated sources and `dist/**` remain uncommitted.
