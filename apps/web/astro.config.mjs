import { defineConfig } from 'astro/config'

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'Orbis'
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true'
const base = isGitHubActions ? `/${repository}` : '/'

export default defineConfig({
  site: 'https://xiaodaojiang.github.io',
  base,
  output: 'static',
  trailingSlash: 'always',
  outDir: new URL('../../dist/web/', import.meta.url),
})
