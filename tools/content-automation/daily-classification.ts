import { readdir, readFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { parse } from 'yaml'
import { topicSchema } from '@orbis/content-schema'
import { validateTopicRegistry, type TopicRegistryEntry } from './daily-classification.mjs'
export { classifyDailyCandidate, validateTopicRegistry } from './daily-classification.mjs'

/** Read all entries; missing, empty or invalid registries fail closed. */
export async function loadTopicRegistry(directory = 'content/topics'): Promise<TopicRegistryEntry[]> {
  const children = await readdir(directory, { withFileTypes: true })
  // Classification identities are flat filenames. Never silently omit a subtree
  // or symlink that another content loader could include in its Registry view.
  for (const entry of children) {
    if (entry.isDirectory() || entry.isSymbolicLink()) {
      throw new Error(`Topic Registry snapshot requires flat regular files: ${entry.name}`)
    }
  }
  const files = children
    .filter((entry) => ['.yaml', '.yml'].includes(extname(entry.name)))
    .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
  const entries = []
  for (const file of files) {
    if (!file.isFile()) throw new Error(`Topic Registry entry is not a regular file: ${file.name}`)
    const data: unknown = parse(await readFile(join(directory, file.name), 'utf8'))
    topicSchema.strict().parse(data)
    entries.push({ id: basename(file.name, extname(file.name)), data })
  }
  return validateTopicRegistry(entries)
}
