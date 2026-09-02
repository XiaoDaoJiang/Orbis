import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import { runtimeSiteUrl } from '../../../../tools/shared/site-config.ts'
import { webSiteConfig } from '../lib/site-config.ts'

export async function GET() {
  const [essays, briefs, knowledge] = await Promise.all([
    getCollection('essays', ({ data }) => data.status === 'published'),
    getCollection('briefs', ({ data }) => data.status === 'published'),
    getCollection('knowledge', ({ data }) => data.status === 'published' || data.status === 'active'),
  ])

  const items = [
    ...essays.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: new Date(entry.data.publishedAt),
      link: runtimeSiteUrl(webSiteConfig, `/essays/${entry.id}/`),
      categories: entry.data.topics,
    })),
    ...briefs.map((entry) => ({
      title: entry.data.title,
      description: entry.data.summary,
      pubDate: new Date(entry.data.publishedAt),
      link: runtimeSiteUrl(webSiteConfig, `/briefs/${entry.id}/`),
      categories: entry.data.topics,
    })),
    ...knowledge.map((entry) => ({
      title: entry.data.title,
      description: entry.data.summary,
      pubDate: new Date(entry.data.publishedAt),
      link: runtimeSiteUrl(webSiteConfig, `/knowledge/${entry.id}/`),
      categories: entry.data.topics,
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf())

  return rss({
    title: webSiteConfig.site.defaultTitle,
    description: webSiteConfig.site.defaultDescription,
    site: runtimeSiteUrl(webSiteConfig, '/'),
    items,
    customData: `<language>${webSiteConfig.site.locale}</language>`,
  })
}
