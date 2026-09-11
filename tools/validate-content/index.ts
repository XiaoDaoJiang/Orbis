import { basename, relative, resolve } from 'node:path'
import {
  authorSchema,
  briefSchema,
  essaySchema,
  knowledgeSchema,
  presentationContentSchema,
  sourceSchema,
  topicSchema,
} from '@orbis/content-schema'
import { nativePresentationSchema, type NativePresentation } from '@orbis/content-schema/native-presentation'
import { evaluateDailyEvidence } from '../evidence-integrity/daily-evidence.ts'
import { loadEvidenceIntegrityConfig } from '../evidence-integrity/config.ts'
import { listFiles, readMarkdownFrontmatter, readYaml } from '../shared/content.ts'
import {
  validateReferentialIntegrity,
  type ParsedContentEntry,
  type ParsedContentKind,
} from './referential-integrity.ts'

const root = resolve(import.meta.dirname, '../..')
const checks = [
  { kind: 'brief', directory: 'content/briefs', extensions: ['.yaml', '.yml'], schema: briefSchema, markdown: false },
  { kind: 'presentation', directory: 'content/presentations', extensions: ['.yaml', '.yml'], schema: presentationContentSchema, markdown: false },
  { kind: 'essay', directory: 'content/essays', extensions: ['.md'], schema: essaySchema, markdown: true },
  { kind: 'topic', directory: 'content/topics', extensions: ['.yaml', '.yml'], schema: topicSchema, markdown: false },
  { kind: 'knowledge', directory: 'content/knowledge', extensions: ['.md'], schema: knowledgeSchema, markdown: true },
  { kind: 'source', directory: 'content/sources', extensions: ['.yaml', '.yml'], schema: sourceSchema, markdown: false },
  { kind: 'author', directory: 'content/authors', extensions: ['.yaml', '.yml'], schema: authorSchema, markdown: false },
] as const satisfies ReadonlyArray<{
  kind: ParsedContentKind
  directory: string
  extensions: readonly string[]
  schema: { safeParse(value: unknown): { success: boolean; data?: unknown; error?: { issues: unknown } } }
  markdown: boolean
}>

function displayPath(path: string) {
  return relative(root, path).replaceAll('\\', '/')
}

const entries: ParsedContentEntry[] = []
const nativePresentations: { path: string; value: NativePresentation }[] = []
let count = 0
let hasSchemaErrors = false

for (const check of checks) {
  const files = await listFiles(resolve(root, check.directory), [...check.extensions])
  for (const file of files) {
    const value = check.markdown ? (await readMarkdownFrontmatter(file)).data : await readYaml(file)
    const result = check.schema.safeParse(value)
    if (!result.success) {
      console.error(`Invalid content: ${displayPath(file)}`)
      console.error(JSON.stringify(result.error?.issues, null, 2))
      hasSchemaErrors = true
      continue
    }

    count += 1
    console.log(`✓ ${displayPath(file)}`)
    entries.push({ kind: check.kind, path: file, value: result.data } as ParsedContentEntry)
  }
}

const nativeFiles = (await listFiles(resolve(root, 'content/presentations'), ['.md']))
  .filter((file) => basename(file) === 'slides.md')
for (const file of nativeFiles) {
  const result = nativePresentationSchema.safeParse((await readMarkdownFrontmatter(file)).data)
  if (!result.success) {
    console.error(`Invalid content: ${displayPath(file)}`)
    console.error(JSON.stringify(result.error.issues, null, 2))
    hasSchemaErrors = true
    continue
  }
  count += 1
  console.log(`✓ ${displayPath(file)}`)
  nativePresentations.push({ path: file, value: result.data })
}

if (hasSchemaErrors) process.exit(1)

const integrityErrors = validateReferentialIntegrity(root, entries)
const topicIds = new Set(
  entries
    .filter((entry) => entry.kind === 'topic')
    .map((entry) => basename(entry.path).replace(/\.(yaml|yml)$/, '')),
)
for (const entry of nativePresentations) {
  entry.value.orbis.topics.forEach((topic, index) => {
    if (!topicIds.has(topic)) {
      integrityErrors.push(`Invalid relation: ${displayPath(entry.path)}: orbis.topics[${index}] -> missing topic "${topic}"`)
    }
  })
}
if (integrityErrors.length) {
  for (const error of integrityErrors) console.error(error)
  process.exit(1)
}

const evidenceConfig = await loadEvidenceIntegrityConfig(root)
const evidenceErrors: string[] = []
for (const entry of entries) {
  if (entry.kind !== 'brief' || entry.value.cadence !== 'daily') continue
  const path = displayPath(entry.path)
  const report = evaluateDailyEvidence(entry.value, path, evidenceConfig.legacyDailyPaths)
  console.log(`Evidence integrity ${path}: ${report.mode} claims=${report.claimCount} refs=${report.referenceCount}`)
  for (const error of report.errors) {
    evidenceErrors.push(`Evidence integrity: ${path}: ${error.code} ${error.address} -> ${error.message}`)
  }
}

if (evidenceErrors.length) {
  for (const error of evidenceErrors) console.error(error)
  process.exit(1)
}

const topicCount = entries.filter((entry) => entry.kind === 'topic').length
const sourceCount = entries.filter((entry) => entry.kind === 'source').length
const authorCount = entries.filter((entry) => entry.kind === 'author').length
console.log(`Referential integrity passed for ${topicCount} topic(s), ${sourceCount} source(s), and ${authorCount} author(s)`)
console.log(`Validated ${count} content entries`)
