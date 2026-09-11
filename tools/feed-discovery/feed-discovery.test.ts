import assert from 'node:assert/strict'
import { discoverFeeds, parseFeedXml, selectRecentItems, type FeedsConfig } from './core.ts'

const now = new Date('2026-09-11T02:00:00Z')

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Example RSS</title>
    <item>
      <title><![CDATA[Recent RSS item]]></title>
      <link>https://feed.example/items/1?utm_source=test</link>
      <pubDate>Fri, 11 Sep 2026 01:00:00 GMT</pubDate>
      <content:encoded><![CDATA[<p>Read <a href="https://primary.example/release">the release</a>.</p>]]></content:encoded>
    </item>
    <item>
      <title>Stale RSS item</title>
      <link>https://feed.example/items/old</link>
      <pubDate>Tue, 01 Sep 2026 01:00:00 GMT</pubDate>
      <description>Old content</description>
    </item>
  </channel>
</rss>`

const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Example Atom</title>
  <entry>
    <title>Recent Atom entry</title>
    <link rel="alternate" href="https://atom.example/posts/1" />
    <updated>2026-09-11T00:30:00Z</updated>
    <summary type="html"><![CDATA[See https://docs.example/spec for details.]]></summary>
  </entry>
</feed>`

const rssItems = parseFeedXml(rss, 'rss-feed', 'https://feed.example/rss.xml')
assert.equal(rssItems.length, 2)
assert.equal(rssItems[0].title, 'Recent RSS item')
assert.equal(rssItems[0].url, 'https://feed.example/items/1?utm_source=test')
assert.deepEqual(rssItems[0].externalLinks, ['https://primary.example/release'])
assert.equal(selectRecentItems(rssItems, now, 48, 24).length, 1)

const atomItems = parseFeedXml(atom, 'atom-feed', 'https://atom.example/feed.xml')
assert.equal(atomItems.length, 1)
assert.equal(atomItems[0].url, 'https://atom.example/posts/1')
assert.deepEqual(atomItems[0].externalLinks, ['https://docs.example/spec'])

function response(body: string, status = 200, contentType = 'application/rss+xml'): Response {
  return new Response(body, { status, headers: { 'content-type': contentType } })
}

{
  const calls: string[] = []
  const config: FeedsConfig = {
    policy: { lookback_hours: 48, minimum_successful_feeds: 1, deduplicate_across_feeds: true },
    feeds: [
      {
        id: 'first',
        name: 'First',
        url: 'https://first.example/rss.xml',
        fallback_urls: ['https://first.example/fallback.xml'],
        enabled: true,
      },
      {
        id: 'second',
        name: 'Second',
        url: 'https://second.example/rss.xml',
        fallback_urls: ['https://second.example/fallback.xml'],
        enabled: true,
      },
    ],
  }

  const fetchImpl = async (url: string): Promise<Response> => {
    calls.push(url)
    if (url.endsWith('/rss.xml')) return response('unavailable', 503, 'text/plain')
    return response(rss)
  }

  const report = await discoverFeeds(config, { now, fetchImpl })
  assert.deepEqual(calls.slice(0, 2), ['https://first.example/rss.xml', 'https://second.example/rss.xml'])
  assert.equal(report.successfulFeeds, 2)
  assert.equal(report.rssSuccessfulFeeds, 2)
  assert.equal(report.meetsMinimumFeeds, true)
  assert.equal(report.feeds[0].transport, 'rss-fallback')
}

{
  const config: FeedsConfig = {
    policy: { lookback_hours: 48, minimum_successful_feeds: 1, deduplicate_across_feeds: true },
    feeds: [
      {
        id: 'html-fallback',
        name: 'HTML fallback',
        url: 'https://daily.example/rss.xml',
        enabled: true,
        fetch: { lookback_hours: 48, max_feed_items: 2, extract_external_links: true },
        discovery_fallback: {
          mode: 'same-source-html',
          index_url: 'https://daily.example/',
          follow_recent_item_links: true,
          counts_as_rss_success: false,
        },
      },
    ],
  }

  const fetchImpl = async (url: string): Promise<Response> => {
    if (url === 'https://daily.example/rss.xml') return response('unavailable', 503, 'text/plain')
    if (url === 'https://daily.example/') {
      return response(
        '<html><body><a href="/issues/2026-09-11/">AI Daily 2026-09-11</a><a href="/issues/2026-09-01/">Old 2026-09-01</a></body></html>',
        200,
        'text/html',
      )
    }
    if (url === 'https://daily.example/issues/2026-09-11/') {
      return response(
        '<html><body><h1>AI Daily 2026-09-11</h1><a href="https://primary.example/announcement">Official announcement</a></body></html>',
        200,
        'text/html',
      )
    }
    return response('not found', 404, 'text/plain')
  }

  const report = await discoverFeeds(config, { now, fetchImpl })
  assert.equal(report.successfulFeeds, 1)
  assert.equal(report.rssSuccessfulFeeds, 0)
  assert.equal(report.meetsMinimumFeeds, true)
  assert.equal(report.feeds[0].transport, 'same-source-html')
  assert.equal(report.feeds[0].rawRssRetrieved, false)
  assert.deepEqual(report.items[0].externalLinks, ['https://primary.example/announcement'])
}

{
  const config: FeedsConfig = {
    policy: { lookback_hours: 48, minimum_successful_feeds: 1 },
    feeds: [{ id: 'stale', name: 'Stale', url: 'https://stale.example/rss.xml', enabled: true }],
  }

  const fetchImpl = async (): Promise<Response> => response(rss.replace(/11 Sep 2026/g, '01 Sep 2026'))
  const report = await discoverFeeds(config, { now, fetchImpl })
  assert.equal(report.successfulFeeds, 0)
  assert.equal(report.meetsMinimumFeeds, false)
  assert.equal(report.feeds[0].status, 'stale')
  assert.equal(report.feeds[0].rawRssRetrieved, true)
}

console.log('Native Feed Discovery contract passed')
