import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { dailyBriefSchema, weeklyBriefSchema } from '@orbis/content-schema'
import { renderDailyV1 } from '../../apps/slides/templates/daily-v1.ts'
import { renderWeeklyV1 } from '../../apps/slides/templates/weekly-v1.ts'
import { listFiles, readYaml } from '../shared/content.ts'

const root = resolve(import.meta.dirname, '../..')
const layout = await readFile(resolve(root, 'apps/web/src/layouts/BaseLayout.astro'), 'utf8')
assert.ok(layout.includes('class="skip-link" href="#main-content"'))
assert.ok(layout.includes('id="main-content" tabindex="-1"'))
assert.ok(layout.includes('aria-current='))
const archive = await readFile(resolve(root, 'apps/web/src/pages/archive/index.astro'), 'utf8')
assert.ok(archive.includes('aria-live="polite"'))
assert.ok(archive.includes("window.addEventListener('popstate', restoreFromUrl)"))
assert.ok(archive.includes('<noscript>'))
const toc = await readFile(resolve(root, 'apps/web/src/components/briefs/DailyBriefBody.astro'), 'utf8')
for (const anchor of ['daily-signals', 'daily-actions', 'daily-references']) {
  assert.ok(toc.includes(`href="#${anchor}"`))
  assert.ok(toc.includes(`id="${anchor}"`))
}
let checked = 0
for (const file of await listFiles(resolve(root, 'content/briefs'), ['.yaml', '.yml'])) {
  const value = await readYaml(file)
  const daily = dailyBriefSchema.safeParse(value)
  const weekly = weeklyBriefSchema.safeParse(value)
  if ((!daily.success && !weekly.success) || value.status !== 'published' || !value.presentation.enabled) continue
  for (const siteBase of ['/Orbis', '/XiaoDaoJiang/Orbis/preview-pr-999']) {
    const readingHref = `${siteBase}/briefs/example/`
    const markdown = daily.success ? renderDailyV1(daily.data, { siteBase, readingHref })
      : renderWeeklyV1(weekly.data!, { siteBase, readingHref })
    assert.equal((markdown.match(/class="reading-link"/g) ?? []).length, 2)
    assert.ok(markdown.includes(`href="${readingHref}"`))
    assert.ok(!markdown.includes(`](${readingHref})`), 'Reading links must remain native anchors, not Slidev router links')
  }
  checked += 1
}
assert.ok(checked > 0)
console.log(`Reading navigation contracts and native return links passed for ${checked} Daily/Weekly decks, production and preview bases`)
