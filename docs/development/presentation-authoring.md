# Presentation Authoring

Orbis supports two presentation authoring modes. They share the same discovery, validation, build, preview, assembly, and publication boundary, but they deliberately do not share the same authoring abstraction.

## 1. Structured presentations

Use structured content when Orbis owns the information shape and should guarantee a repeatable visual contract.

### Brief-derived decks

```text
content/briefs/<id>.yaml
  -> PresentationDescriptor
  -> daily-v1 / weekly-v1
  -> Slidev
```

Daily and Weekly presentations remain schema-driven. Their reading page and presentation are two outputs of the same structured Brief source.

### Template-driven standalone talks

```text
content/presentations/<slug>.yaml
  -> PresentationDescriptor
  -> talk-v1
  -> Slidev
```

Use this mode when a standalone presentation still benefits from an Orbis-owned section schema and deterministic template.

## 2. Native Slidev presentations

Use native Slidev for human-authored, free-form technical talks where Slidev itself is the right authoring abstraction.

The source unit is a directory:

```text
content/presentations/<slug>/
  slides.md
  style.css
  sections/
  components/
  assets/
  snippets/
  ...other deck-local files
```

`<slug>` must be lowercase kebab-case. `slides.md` is the entry point and uses normal Slidev Markdown. Deck-local support files use ordinary relative imports and Slidev features such as `src:` composition. Global deck styling follows Slidev's native directory convention (`style.css` or `styles/index.*`) rather than an Orbis-specific frontmatter field.

The entry headmatter keeps Slidev configuration native while adding only a small Orbis publication envelope:

```yaml
---
theme: default
title: Example Native Talk
favicon: ./favicon.svg
orbis:
  kind: native-presentation
  summary: A concise description used by Orbis discovery and SEO.
  publishedAt: 2026-09-15
  status: published
  topics:
    - coding-agent
---
```

Orbis does not translate the presentation into `talk-v1`. During generation it copies the complete deck directory into the generated Slidev workspace, supplies the default Orbis favicon only when the deck does not provide one, and creates Orbis SEO metadata. Slidev then builds the copied `slides.md` directly and discovers deck-local styles/components/assets through its normal project conventions.

The example `native-slidev-authoring` deck imports Orbis design tokens from its own `style.css`; this is normal authored Slidev content, not generated configuration.

## 3. Choosing a mode

Prefer structured authoring when:

- the content is generated from a Daily or Weekly Brief;
- field counts, section semantics, evidence, and visual shape should be deterministic;
- an automated content workflow owns the source.

Prefer native Slidev when:

- a human is creating a technical talk or demo;
- the presentation needs native layouts, Vue components, imported slides, snippets, animations, diagrams, or local assets;
- forcing the content through `talk-v1` would merely recreate Slidev features in an Orbis schema.

Do not migrate an existing structured presentation merely because native mode exists. The two modes solve different authoring problems.

## 4. Build and incremental behavior

A native presentation directory is one build unit.

Changes under:

```text
content/presentations/<slug>/...
```

are mapped to presentation ID `<slug>`. On the content fast path, a change to `slides.md`, an imported Markdown section, a component, stylesheet, snippet, or local asset rebuilds that deck only when a reusable historical deck cache is available.

Shared Slidev infrastructure such as `apps/slides/**`, presentation tooling, content schemas, site configuration, or lockfile changes still invalidate the full presentation set.

Cache is optional acceleration. A missing or incomplete restored deck cache falls back to a full presentation rebuild.

## 5. Governance boundary

Native Slidev is intentionally treated as human-authored code-like content.

- ordinary human PRs may change `content/presentations/<slug>/...`;
- the generic automated content-agent mode may continue to edit structured `content/presentations/*.yaml`;
- the content-agent path guard rejects nested native Slidev presentation directories;
- Scheduled Daily remains restricted to its exact Brief candidate path.

This keeps native Slidev expressive without silently expanding automated write or execution permissions.

## 6. Source-of-truth rule

Only files under `content/**` are editorial sources.

The following remain generated artifacts and must not be committed as editorial history:

```text
apps/slides/generated/**
dist/slides/**
dist/site/**
```

Both structured and native modes end at the same publication boundary:

```text
source content
  -> validation
  -> Astro / Slidev build
  -> complete dist/site
  -> artifact checks
  -> Preview
  -> human merge
  -> governed Pages promotion
```
