---
theme: default
title: Native Slidev Authoring in Orbis
favicon: ./favicon.svg
css: ./orbis.css
transition: slide-left
orbis:
  kind: native-presentation
  summary: A direct Slidev Markdown talk proving that free-form human presentations can coexist with structured Orbis decks.
  publishedAt: 2026-09-10
  status: published
  topics:
    - agent-harness
    - coding-agent
---

# Native Slidev Authoring

Orbis can keep **structured Brief decks** and also let a human author speak native Slidev.

<div class="mt-8 opacity-70">
One repository · two authoring modes · one validated publishing pipeline
</div>

---
src: ./sections/why-native.md
---

---
layout: two-cols
---

# Structured when structure matters

Daily and Weekly Briefs remain schema-driven:

```text
Brief YAML
  -> PresentationDescriptor
  -> daily-v1 / weekly-v1
  -> Slidev
```

::right::

# Native when expression matters

Free-form talks use the upstream format:

```text
slides.md
  -> Slidev
```

Orbis only adds the publishing envelope.

---
layout: center
class: text-center
---

# One artifact boundary

Both modes still end at:

**validated `dist/site` → Preview → human merge → governed Pages promotion**

No generated HTML or generated slides become editorial source of truth.
