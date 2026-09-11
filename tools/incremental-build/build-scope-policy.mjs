const contentOnlyPatterns = [
  /^content\/briefs\/.+\.ya?ml$/,
  /^content\/presentations\/[^/]+\.ya?ml$/,
  /^content\/presentations\/[^/]+\/slides\.md$/,
  /^content\/essays\/.+\.md$/,
  /^content\/knowledge\/.+\.md$/,
]

export function isContentOnlyPath(path) {
  return contentOnlyPatterns.some((pattern) => pattern.test(path))
}

export function classifyBuildScope(entries) {
  if (entries.length === 0) return 'full'

  for (const entry of entries) {
    const paths = entry.oldPath && entry.oldPath !== entry.path
      ? [entry.oldPath, entry.path]
      : [entry.path]
    if (paths.some((path) => !isContentOnlyPath(path))) return 'full'
  }

  return 'content'
}
