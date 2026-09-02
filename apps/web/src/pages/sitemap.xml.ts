import { getCollection } from 'astro:content'
import { productionSiteUrl } from '../../../../tools/shared/site-config.ts'
import { webSiteConfig } from '../lib/site-config.ts'

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export async function GET() {
  const [essays, briefs, knowledge, topics, presentations] = await Promise.all([
    getCollection('essays', ({ data }) => data.status === 'published'),
    getCollection('briefs', ({ data }) => data.status === 'published'),
    getCollection('knowledge', ({ data }) => data.status === 'published' || data.status === 'active'),
    getCollection('topics', ({ data }) => data.status !== 'archived'),
    getCollection('presentations', ({ data }) => data.status === 'published'),
  ])

  const paths = new Set<string>([
    '/',
    '/essays/',
    '/briefs/',
    '/briefs/daily/',
    '/briefs/weekly/',
    '/knowledge/',
    '/topics/',
    '/archive/',
    '/slides/',
  ])

  for (const entry of essays) paths.add(`/essays/${entry.id}/`)
  for (const entry of briefs) paths.add(`/briefs/${entry.id}/`)
  for (const entry of knowledge) paths.add(`/knowledge/${entry.id}/`)
  for (const entry of topics) paths.add(`/topics/${entry.id}/`)
  for (const entry of presentations) paths.add(`/slides/${entry.id}/`)

  const locations = [...paths]
    .map((path) => productionSiteUrl(webSiteConfig, path))
    .sort((left, right) => left.localeCompare(right))

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...locations.map((location) => `  <url><loc>${escapeXml(location)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n')

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
