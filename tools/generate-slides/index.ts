import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { briefSchema, type Brief } from '@orbis/content-schema'
import { listFiles, readYaml } from '../shared/content.ts'

const root = resolve(import.meta.dirname, '../..')
const sourceDir = resolve(root, 'content/briefs')
const outputRoot = resolve(root, 'apps/slides/generated')

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function generateDaily(brief: Brief) {
  const pages: string[] = []
  pages.push(`---\ntheme: default\ntitle: ${brief.title}\nlayout: orbis-cover\ntransition: fade-out\n---\n\n<div class="eyebrow">ORBIS · ${brief.publishedAt}</div>\n\n# ${brief.title}\n\n${brief.summary}\n`)
  pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">FOUR SIGNALS</div>\n\n## 四个关键信号\n\n<div class="signal-grid">\n${brief.signals.map((signal) => `<div class="signal-card"><h3>${escapeHtml(signal.title)}</h3><p>${escapeHtml(signal.summary)}</p></div>`).join('\n')}\n</div>\n`)

  const sections = [...brief.sections]
  while (sections.length < 5) {
    sections.push({
      id: `context-${sections.length + 1}`,
      layout: 'system-map',
      title: 'Context',
      conclusion: '本期没有额外专题，保留此页作为上下文与讨论空间。',
      facts: ['该占位仅用于保证原型页数稳定。'],
      limitations: [],
      references: brief.references.slice(0, 1),
    })
  }
  for (const section of sections.slice(0, 5)) {
    pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">${section.layout.toUpperCase()}</div>\n\n## ${section.title}\n\n**${section.conclusion}**\n\n<ul class="topic-facts">\n${section.facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join('\n')}\n</ul>\n\n${section.limitations.length ? `<small>限制：${escapeHtml(section.limitations.join('；'))}</small>` : ''}\n\n[原始来源 ↗](${section.references[0]?.url ?? brief.references[0].url})\n`)
  }
  pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">OPEN SOURCE RADAR</div>\n\n## 值得 Clone / Read / Test 的项目\n\n<div class="project-grid">\n${brief.projects.map((project) => `<div class="project-card"><h3>${project.action} · ${escapeHtml(project.name)}</h3><p>${escapeHtml(project.summary)}</p><p><a href="${project.url}">GitHub ↗</a></p></div>`).join('\n')}\n</div>\n`)
  pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">IMPACT × ADOPTION HORIZON</div>\n\n## 技术投入判断\n\n<div class="radar-list">\n${brief.radar.map((item) => `<div class="radar-item"><strong>${escapeHtml(item.label)}</strong><div class="radar-track"><span style="width:${item.impact}%"></span></div><small>${item.horizon}</small></div>`).join('\n')}\n</div>\n`)
  pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">FROM SIGNALS TO ACTION</div>\n\n## 从信号到行动\n\n把值得关注的变化，转化为可验证的工程选择。\n\n<div class="action-grid">\n${brief.actions.map((action) => `<div class="action-card"><h3>${escapeHtml(action.title)}</h3><p>${escapeHtml(action.description)}</p></div>`).join('\n')}\n</div>\n`)
  pages.push(`---\nlayout: orbis-default\n---\n\n<div class="eyebrow">EXTENDED READING</div>\n\n## 扩展阅读\n\n<ol class="reference-list">\n${brief.references.map((reference) => `<li><a href="${reference.url}">${escapeHtml(reference.title)}</a> — ${escapeHtml(reference.supports)}</li>`).join('\n')}\n</ol>\n`)

  // Each page already starts with Slidev frontmatter delimiters. Joining with a
  // plain newline avoids inserting an additional empty slide between pages.
  return pages.join('\n\n')
}

await rm(outputRoot, { recursive: true, force: true })
const files = await listFiles(sourceDir, ['.yaml', '.yml'])
let generated = 0
for (const file of files) {
  const brief = briefSchema.parse(await readYaml(file))
  if (!brief.presentation.enabled || brief.status !== 'published') continue
  const slug = basename(file).replace(/\.(yaml|yml)$/, '')
  const directory = resolve(outputRoot, slug)
  await mkdir(directory, { recursive: true })
  await cp(resolve(root, 'apps/slides/style.css'), resolve(directory, 'style.css'))
  await cp(resolve(root, 'apps/slides/layouts'), resolve(directory, 'layouts'), { recursive: true })
  await writeFile(resolve(directory, 'slides.md'), generateDaily(brief), 'utf8')
  generated += 1
  console.log(`Generated Slidev deck: ${slug}`)
}
if (generated === 0) throw new Error('No Slidev deck generated')
