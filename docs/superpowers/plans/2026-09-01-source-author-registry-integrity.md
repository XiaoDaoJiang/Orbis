# Source & Author Registry + Referential Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add canonical Source/Author registries and make all Topic, declared Source and Essay Author relations fail-fast during `pnpm content:validate`.

**Architecture:** Source and Author YAML files use flat file-name IDs and strict Zod schemas. The existing validation CLI first validates each file, then passes successfully parsed entries into a focused referential-integrity module that builds indexes, extracts relations and returns deterministic errors. Astro registers the entities as build-time collections, while scheduled-agent write boundaries remain unchanged.

**Tech Stack:** TypeScript 5.9, Node.js 22, Zod, YAML, Astro Content Collections, pnpm, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-01-source-author-registry-integrity-design.md`

## Global Constraints

- Baseline is `main@241996d3b1ad3c38fcaaec7622e8f41c6641ab65`.
- Source/Author canonical IDs come only from flat file names and must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- Registry YAML must not declare `id`.
- `Reference.source` is optional; declared values must resolve.
- Every Essay author, content Topic, Weekly trend Topic and Topic.related value must resolve.
- Archived Source/Author relations remain valid.
- No `/sources/` or `/authors/` routes are added.
- `content-agent` must remain unable to modify `content/sources/**` and `content/authors/**`.
- Do not modify Slide renderers, Presentation discovery/generation, build-slides, assembly, Archive/RSS/Topic product code or workflows.
- Do not commit `apps/slides/generated/**` or `dist/**`.

---

### Task 1: Establish RED 1 for missing Registry capability

**Files:**
- Create: `tools/validate-content/registry-contract.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: current `@orbis/content-schema` exports, `apps/web/src/content.config.ts`, `config/path-guard.yaml`, `AGENTS.md`.
- Produces: executable `pnpm test:content-registry` contract that later tasks must satisfy.

- [ ] **Step 1: Add a test that requires Registry exports and real files**

Create `tools/validate-content/registry-contract.test.ts` with these behaviors:

```ts
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const schema = await import('@orbis/content-schema')

assert.equal(typeof schema.sourceSchema?.parse, 'function', 'sourceSchema must exist')
assert.equal(typeof schema.authorSchema?.parse, 'function', 'authorSchema must exist')

for (const path of [
  'content/sources/astro.yaml',
  'content/sources/github.yaml',
  'content/sources/slidev.yaml',
  'content/authors/xiaodaojiang.yaml',
]) {
  await access(resolve(root, path))
}

const contentConfig = await readFile(resolve(root, 'apps/web/src/content.config.ts'), 'utf8')
assert.match(contentConfig, /const sources = defineCollection/)
assert.match(contentConfig, /const authors = defineCollection/)
assert.match(contentConfig, /pattern: '\*\.\{yaml,yml\}'/)

const pathGuard = await readFile(resolve(root, 'config/path-guard.yaml'), 'utf8')
assert.doesNotMatch(pathGuard, /content\/sources\//)
assert.doesNotMatch(pathGuard, /content\/authors\//)

const agents = await readFile(resolve(root, 'AGENTS.md'), 'utf8')
assert.match(agents, /Source\/Author Registry/)
assert.match(agents, /explicit human review/)

console.log('Source/Author Registry contract passed')
```

Use optional property access on the dynamically imported module so failure is an intentional assertion rather than a TypeScript import error.

- [ ] **Step 2: Wire the test before `content:validate`**

Add:

```json
"test:content-registry": "tsx tools/validate-content/registry-contract.test.ts",
```

Change `validate` to:

```json
"validate": "pnpm --filter @orbis/content-schema test && pnpm test:presentation-platform && pnpm test:weekly-brief && pnpm test:content-registry && pnpm content:validate"
```

- [ ] **Step 3: Commit and open a Draft PR**

Commit only the test, package script, approved spec and this plan. Create Draft PR:

```text
feat: add source and author registry integrity
```

The PR body must identify the expected RED 1 checkpoint and state that no production Registry capability exists yet.

- [ ] **Step 4: Verify RED 1 in the read-only PR Build**

Run through the existing PR workflow. Expected sequence:

```text
content-schema tests passed
Presentation Platform contracts pass
Weekly contracts pass
AssertionError: sourceSchema must exist
```

The failure must occur before `content:validate` and must not be a dependency, Path Guard or syntax failure.

---

### Task 2: Implement Registry schemas and schema tests

**Files:**
- Modify: `packages/content-schema/src/index.ts`
- Modify: `packages/content-schema/test/schema.test.ts`

**Interfaces:**
- Produces:
  - `registryIdPattern: RegExp`
  - `registryIdSchema: ZodString`
  - `sourceSchema`
  - `authorSchema`
  - `Source` type
  - `Author` type

- [ ] **Step 1: Add failing schema assertions before production exports**

Extend `packages/content-schema/test/schema.test.ts` to require:

```ts
const validSource = {
  name: 'Astro',
  homepage: 'https://astro.build/',
  type: 'official',
  trustTier: 'primary',
  status: 'active',
  aliases: ['withastro'],
  description: 'Astro official project and documentation source.',
} as const

const validAuthor = {
  name: 'XiaoDaoJiang',
  status: 'active',
  url: 'https://github.com/XiaoDaoJiang',
  bio: 'Orbis author and maintainer.',
} as const
```

Assertions must prove:

```ts
sourceSchema.parse(validSource).aliases.length === 1
authorSchema.parse(validAuthor).status === 'active'
sourceSchema.parse({ ...validSource, status: 'archived' }) succeeds
authorSchema.parse({ ...validAuthor, status: 'archived' }) succeeds
sourceSchema rejects embedded id
sourceSchema rejects invalid type / trustTier / URL / alias
sourceSchema rejects duplicate aliases
authorSchema rejects embedded id / invalid URL / short bio
```

- [ ] **Step 2: Run the schema test and observe failure**

Run:

```bash
pnpm --filter @orbis/content-schema test
```

Expected: failure because `sourceSchema` and `authorSchema` are not exported.

- [ ] **Step 3: Add the strict schemas**

In `packages/content-schema/src/index.ts`, add near the shared primitive schemas:

```ts
export const registryIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const registryIdSchema = z.string().regex(registryIdPattern, 'Expected lowercase kebab-case registry ID')

const registryStatusSchema = z.enum(['active', 'archived'])

export const sourceSchema = z.object({
  name: z.string().min(2),
  homepage: z.url(),
  type: z.enum(['official', 'publisher', 'individual', 'community', 'aggregator']),
  trustTier: z.enum(['primary', 'secondary', 'discovery']),
  status: registryStatusSchema,
  feed: z.url().optional(),
  aliases: z.array(registryIdSchema).default([]).superRefine((aliases, ctx) => {
    if (new Set(aliases).size !== aliases.length) {
      ctx.addIssue({ code: 'custom', message: 'Source aliases must be unique' })
    }
  }),
  description: z.string().min(12).optional(),
}).strict()

export const authorSchema = z.object({
  name: z.string().min(2),
  status: registryStatusSchema,
  url: z.url().optional(),
  bio: z.string().min(12).optional(),
}).strict()
```

Export inferred `Source` and `Author` types at the bottom.

- [ ] **Step 4: Run schema tests GREEN**

Run:

```bash
pnpm --filter @orbis/content-schema test
```

Expected: `content-schema tests passed`.

- [ ] **Step 5: Commit schema capability**

Commit:

```text
feat: define source and author registry schemas
```

---

### Task 3: Add real Registry content, Astro collections and governance

**Files:**
- Create: `content/sources/astro.yaml`
- Create: `content/sources/github.yaml`
- Create: `content/sources/slidev.yaml`
- Create: `content/authors/xiaodaojiang.yaml`
- Modify: `apps/web/src/content.config.ts`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: `sourceSchema`, `authorSchema`.
- Produces: Astro collections named `sources` and `authors`, plus initial canonical IDs.

- [ ] **Step 1: Add the initial Source files**

`content/sources/astro.yaml`:

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

`content/sources/github.yaml`:

```yaml
name: GitHub
homepage: https://github.com/
type: official
trustTier: primary
status: active
description: GitHub official product, repository and documentation source.
```

`content/sources/slidev.yaml`:

```yaml
name: Slidev
homepage: https://sli.dev/
type: official
trustTier: primary
status: active
aliases:
  - slidevjs
description: Slidev official project and documentation source.
```

- [ ] **Step 2: Add the initial Author file**

`content/authors/xiaodaojiang.yaml`:

```yaml
name: XiaoDaoJiang
status: active
url: https://github.com/XiaoDaoJiang
bio: Orbis author and maintainer.
```

- [ ] **Step 3: Register non-recursive Astro collections**

Update `apps/web/src/content.config.ts` imports and add `sources` / `authors` with `*.{yaml,yml}` globs. Export:

```ts
export const collections = {
  essays,
  briefs,
  presentations,
  topics,
  knowledge,
  sources,
  authors,
}
```

- [ ] **Step 4: Make human governance explicit**

Update `AGENTS.md` so `content/sources/**` and `content/authors/**` are listed under explicit human review and forbidden to scheduled content tasks. Include exact language that agents may use existing IDs but new Source/Author Registry identities require explicit human review.

Do not change `config/path-guard.yaml`; absence from its allowlist is part of the contract.

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm test:content-registry
pnpm content:validate
pnpm build:web
```

At this stage `content:validate` must validate Registry schemas but does not yet provide cross-file integrity.

- [ ] **Step 6: Commit GREEN 1**

Commit:

```text
feat: add canonical source and author registries
```

Wait for the Draft PR read-only build and record a GREEN 1 checkpoint while the integrity module is still absent.

---

### Task 4: Establish RED 2 for missing cross-file integrity

**Files:**
- Create: `tools/validate-content/referential-integrity.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: real `pnpm content:validate` CLI.
- Produces: execution-level negative contract for relation failures and Registry ID rules.

- [ ] **Step 1: Create ephemeral invalid and archived fixtures**

The test must create and later remove all of these:

```text
content/presentations/zz-orbis-missing-source-check.yaml
content/essays/zz-orbis-missing-author-check.md
content/knowledge/zz-orbis-missing-topic-check.md
content/topics/zz-orbis-related-integrity-check.yaml
content/sources/github.yml
content/sources/nested/invalid.yaml
content/authors/Bad-Author.yaml
content/sources/zz-orbis-archived-source.yaml
content/authors/zz-orbis-archived-author.yaml
content/essays/zz-orbis-archived-author-check.md
```

Use existing valid content as seeds where practical. The invalid fixtures must include:

- `source: zz-orbis-missing-source`;
- `authors: [zz-orbis-missing-author]`;
- `topics: [zz-orbis-missing-topic]`;
- Topic `related` containing both its own ID and `zz-orbis-missing-related-topic`;
- duplicate Source ID `github.yml`;
- nested Source path;
- invalid Author ID `Bad-Author`.

The archived Source/Author fixtures must be valid and referenced by the archived-author Essay so the final validator proves archived relations remain accepted.

- [ ] **Step 2: Run the CLI and assert deterministic relation errors**

Spawn:

```bash
pnpm content:validate
```

The test expects non-zero and asserts output contains the exact missing Source, Author, Topic, related Topic, self-relation, duplicate ID, nested path and invalid ID messages from the spec.

It must also assert the output does not reject `zz-orbis-archived-source` or `zz-orbis-archived-author`.

Use a `finally` block to remove every fixture and any empty nested directory.

- [ ] **Step 3: Wire the test**

Change:

```json
"test:content-registry": "tsx tools/validate-content/registry-contract.test.ts && tsx tools/validate-content/referential-integrity.test.ts"
```

- [ ] **Step 4: Commit and verify RED 2**

Commit:

```text
 test: require repository referential integrity
```

Expected read-only PR Build failure: the test reports that `content:validate` unexpectedly succeeded, or that required relation errors are absent. Schema, Registry and Astro collection checks must pass first.

---

### Task 5: Implement the referential-integrity module

**Files:**
- Create: `tools/validate-content/referential-integrity.ts`
- Modify: `tools/validate-content/index.ts`

**Interfaces:**
- Produces:

```ts
export type ParsedContentEntry = {
  kind: 'brief' | 'presentation' | 'essay' | 'topic' | 'knowledge' | 'source' | 'author'
  path: string
  value: Brief | PresentationContent | Essay | Topic | Knowledge | Source | Author
}

export function validateReferentialIntegrity(
  root: string,
  entries: ParsedContentEntry[],
): string[]
```

- [ ] **Step 1: Implement canonical ID derivation**

Add helpers that:

- calculate paths relative to `content/sources`, `content/authors` and `content/topics`;
- remove only `.yaml` / `.yml` extensions;
- reject nested Source/Author relative paths;
- validate Source/Author IDs against `registryIdPattern`;
- detect duplicate Source/Author IDs across `.yaml` and `.yml`;
- preserve Topic IDs as normalized relative paths without enforcing the Source/Author flat rule.

- [ ] **Step 2: Build Registry and Topic indexes**

Build Maps keyed by canonical IDs for `source`, `author` and `topic` entries. Add canonical-ID errors before relation errors.

- [ ] **Step 3: Extract every supported Reference path**

For each parsed content shape collect `{ path, source }` from:

```text
references[i]
sections[i].references[j]
archivePicks[i]
```

Only Daily/Ad-hoc Briefs have `archivePicks`; all Briefs have top-level and section References. Preserve exact field paths for error output.

- [ ] **Step 4: Validate Topic relations**

Validate:

```text
topics[i]
trendMovements[i].topic
related[i]
```

For Topic entries, reject self-reference before or alongside missing-target checks.

- [ ] **Step 5: Validate Author and Source relations**

Validate all Essay authors and each collected Reference with a declared Source. Do not reject archived entities.

- [ ] **Step 6: Return stable errors**

Return a de-duplicated, lexicographically sorted string array. Do not print inside the module.

- [ ] **Step 7: Integrate after schema validation**

Refactor `tools/validate-content/index.ts` checks to include `kind`, then add Source/Author checks:

```ts
{ kind: 'source', directory: 'content/sources', extensions: ['.yaml', '.yml'], schema: sourceSchema, markdown: false }
{ kind: 'author', directory: 'content/authors', extensions: ['.yaml', '.yml'], schema: authorSchema, markdown: false }
```

Push each successfully parsed value into `ParsedContentEntry[]`.

If any schema failed, exit before integrity. Otherwise:

```ts
const integrityErrors = validateReferentialIntegrity(root, entries)
for (const error of integrityErrors) console.error(error)
if (integrityErrors.length) process.exit(1)
```

- [ ] **Step 8: Run RED 2 test GREEN**

Run:

```bash
pnpm test:content-registry
```

Expected:

```text
Source/Author Registry contract passed
Referential integrity negative contract passed
```

- [ ] **Step 9: Run real content validation**

Run:

```bash
pnpm content:validate
```

Expected: all current content plus the 4 Registry entries validate, followed by an integrity success message and a final validated-entry count.

- [ ] **Step 10: Commit GREEN 2**

Commit:

```text
feat: enforce content referential integrity
```

---

### Task 6: Harden positive and regression coverage

**Files:**
- Modify: `tools/validate-content/registry-contract.test.ts`
- Modify: `tools/validate-content/referential-integrity.test.ts`

**Interfaces:**
- Consumes: final schemas, collections and integrity CLI.
- Produces: final acceptance coverage without product UI changes.

- [ ] **Step 1: Assert exact real Registry IDs**

Read flat file names and assert exact sorted arrays:

```ts
['astro', 'github', 'slidev']
['xiaodaojiang']
```

This prevents accidental broad fixtures or hidden nested registries from becoming production data.

- [ ] **Step 2: Assert optional Source behavior**

Ensure at least one real unsourced Reference remains valid and the negative test includes a valid unsourced fixture that never appears in errors.

- [ ] **Step 3: Assert existing real relations**

Require the real Daily Source IDs `astro`, `github`, and `slidev`, and the real Essay Author `xiaodaojiang`, to pass through the CLI rather than merely existing as files.

- [ ] **Step 4: Run focused verification**

Run:

```bash
pnpm --filter @orbis/content-schema test
pnpm test:content-registry
pnpm content:validate
pnpm build:web
```

- [ ] **Step 5: Commit test hardening**

Commit:

```text
 test: harden registry integrity coverage
```

---

### Task 7: Complete full build, Preview and scope review

**Files:**
- Modify: PR description only, unless verification reveals a defect.

**Interfaces:**
- Consumes: final feature branch.
- Produces: merge-gate evidence for Plan 40A.

- [ ] **Step 1: Run the full repository pipeline**

Use the read-only PR Build with:

```bash
pnpm build
```

Required evidence includes:

```text
content-schema tests passed
Source/Author Registry contract passed
Referential integrity negative contract passed
real content validation succeeds
Daily + Weekly + Talk mixed Presentation integration succeeds
Astro build succeeds
Slidev builds succeed
assembly and site checks succeed
artifact upload succeeds
```

- [ ] **Step 2: Inspect the final artifact**

Verify:

- existing homepage, Brief, Essay, Knowledge, Archive, RSS, Topic and Slides routes remain present;
- no `/sources/` or `/authors/` route exists;
- Daily / Weekly / Talk outputs remain unchanged in count and routing;
- Registry YAML is not copied as a public directory by an unintended route.

- [ ] **Step 3: Verify Trusted Preview**

Require the trusted publisher to rebuild from the final read-only artifact, publish `preview-pr-<number>`, and pass public availability smoke before posting the URL.

- [ ] **Step 4: Review final diff against scope**

Confirm no changes under:

```text
apps/slides/templates/**
tools/generate-slides/**
tools/build-slides/**
tools/assemble-site/**
apps/web/src/pages/archive/**
apps/web/src/pages/rss.xml.ts
apps/web/src/pages/topics/**
.github/workflows/**
apps/slides/generated/**
dist/**
```

- [ ] **Step 5: Update the PR body**

Record:

- RED 1 run/job and exact missing capability;
- GREEN 1 run while integrity is absent;
- RED 2 run/job and exact missing integrity behavior;
- final GREEN run/job;
- artifact ID, file count, size and SHA-256;
- final head SHA and base SHA;
- Trusted Preview URL and smoke evidence;
- changed-file scope and no-route boundary;
- absence of unresolved review threads.

- [ ] **Step 6: Stop at the merge gate**

Do not merge. Report the PR URL, final verification evidence and the remaining Plan 40B boundary.
