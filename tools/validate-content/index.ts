import { relative, resolve } from 'node:path'
import {
  briefSchema,
  essaySchema,
  knowledgeSchema,
  presentationContentSchema,
  topicSchema,
} from '@orbis/content-schema'
import { listFiles, readMarkdownFrontmatter, readYaml } from '../shared/content.ts'

const root = resolve(import.meta.dirname, '../..')
const checks = [
  { directory: 'content/briefs', extensions: ['.yaml', '.yml'], schema: briefSchema, markdown: false },
  { directory: 'content/presentations', extensions: ['.yaml', '.yml'], schema: presentationContentSchema, markdown: false },
  { directory: 'content/essays', extensions: ['.md'], schema: essaySchema, markdown: true },
  { directory: 'content/topics', extensions: ['.yaml', '.yml'], schema: topicSchema, markdown: false },
  { directory: 'content/knowledge', extensions: ['.md'], schema: knowledgeSchema, markdown: true },
]

let count = 0
for (const check of checks) {
  const files = await listFiles(resolve(root, check.directory), check.extensions)
  for (const file of files) {
    const value = check.markdown ? (await readMarkdownFrontmatter(file)).data : await readYaml(file)
    const result = check.schema.safeParse(value)
    if (!result.success) {
      console.error(`Invalid content: ${relative(root, file)}`)
      console.error(result.error.issues)
      process.exitCode = 1
    } else {
      count += 1
      console.log(`✓ ${relative(root, file)}`)
    }
  }
}
if (process.exitCode) process.exit(process.exitCode)
console.log(`Validated ${count} content entries`)
