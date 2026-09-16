import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'astro/config'
import { parse } from 'yaml'

const here = dirname(fileURLToPath(import.meta.url))
const configPath = resolve(here, '../../config/site.yaml')
const siteConfig = parse(readFileSync(configPath, 'utf8'))

function normalizeBasePath(value) {
  if (!value || value === '/') return '/'
  return `/${value.replace(/^\/+|\/+$/g, '')}`
}

const site = process.env.SITE_ORIGIN ?? siteConfig.site.origin
const base = normalizeBasePath(process.env.SITE_BASE ?? siteConfig.site.basePath)
const cacheDir = process.env.ASTRO_CACHE_DIR ?? './node_modules/.astro'

export default defineConfig({
  site,
  base,
  cacheDir,
  output: 'static',
  experimental: {
    incrementalBuild: true,
  },
  trailingSlash: 'always',
  outDir: '../../dist/web',
})
