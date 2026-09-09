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
  // Existing worktrees/editors may retain CRLF despite .gitattributes. Accept a
  // leading UTF-8 BOM and LF/CRLF delimiters, without trimming or rewriting the body.
  // Closing fences must occupy a whole line (or end at EOF), never a ---prefix.
  const opening = /^\uFEFF?---[ \t]*\r?\n/.exec(source)
  if (!opening) throw new Error(`Missing YAML frontmatter: ${path}`)
  const remaining = source.slice(opening[0].length)
  // Find the first complete closing line, including an immediately empty header.
  const closing = /(?:^|\r?\n)---[ \t]*(?:\r?\n|$)/.exec(remaining)
  if (!closing) throw new Error(`Missing YAML frontmatter: ${path}`)
  return {
    data: parse(remaining.slice(0, closing.index)),
    body: remaining.slice(closing.index + closing[0].length),
  }
}
