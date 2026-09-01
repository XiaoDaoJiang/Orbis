import { readFile, readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { parse } from 'yaml'

export async function listFiles(directory: string, extensions: string[]): Promise<string[]> {
  const result: string[] = []
  async function walk(current: string) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      if (entry.isDirectory()) await walk(path)
      else if (extensions.includes(extname(entry.name))) result.push(path)
    }
  }
  await walk(directory)
  return result.sort()
}

export async function readYaml<T = unknown>(path: string): Promise<T> {
  return parse(await readFile(path, 'utf8')) as T
}

export async function readMarkdownFrontmatter(path: string): Promise<{ data: unknown; body: string }> {
  const source = await readFile(path, 'utf8')
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) throw new Error(`Missing YAML frontmatter: ${path}`)
  return { data: parse(match[1]), body: match[2] }
}
