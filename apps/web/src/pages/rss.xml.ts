import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'

export async function GET(context: { site?: URL }) {
  const [essays, briefs, knowledge] = await Promise.all([
    getCollection('essays', ({ data }) => data.status === 'published'),
    getCollection('briefs', ({ data }) => data.status === 'published'),
    getCollection('knowledge', ({ data }) => data.status === 'published' || data.status === 'active'),
  ])
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const items = [
    ...essays.map((entry) => ({ title: entry.data.title, description: entry.data.description, pubDate: new Date(entry.data.publishedAt), link: `${base}/essays/${entry.id}/`, categories: entry.data.topics })),
    ...briefs.map((entry) => ({ title: entry.data.title, description: entry.data.summary, pubDate: new Date(entry.data.publishedAt), link: `${base}/briefs/${entry.id}/`, categories: entry.data.topics })),
    ...knowledge.map((entry) => ({ title: entry.data.title, description: entry.data.summary, pubDate: new Date(entry.data.publishedAt), link: `${base}/knowledge/${entry.id}/`, categories: entry.data.topics })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf())

  return rss({
    title: 'Orbis',
    description: 'Essays, briefs, slides, topics and durable knowledge.',
    site: context.site ?? 'https://xiaodaojiang.github.io',
    items,
    customData: '<language>zh-CN</language>',
  })
}
