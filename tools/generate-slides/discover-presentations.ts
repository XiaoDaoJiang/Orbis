import { basename, dirname, relative, resolve } from 'node:path'
import { briefSchema, presentationContentSchema, registryIdPattern } from '@orbis/content-schema'
import { nativePresentationSchema } from '@orbis/content-schema/native-presentation'
import type { PresentationDescriptor } from '../../apps/slides/presentation.ts'
import { listFiles, readMarkdownFrontmatter, readYaml } from '../shared/content.ts'
import { joinBasePath, type SiteConfig } from '../shared/site-config.ts'
import { toBriefPresentationDescriptor } from './brief-source.ts'
import { toNativePresentationDescriptor } from './native-source.ts'
import { toStandalonePresentationDescriptor } from './standalone-source.ts'

export type DiscoverPresentationInput = {
  root: string
  siteBase: string
  config: SiteConfig
}

export function assertUniquePresentationSlugs(descriptors: PresentationDescriptor[]): void {
  const seen = new Map<string, PresentationDescriptor>()
  for (const descriptor of descriptors) {
    const existing = seen.get(descriptor.slug)
    if (existing) {
      throw new Error(
        `Duplicate presentation slug: ${descriptor.slug} (${existing.sourceKind}:${existing.id} vs ${descriptor.sourceKind}:${descriptor.id})`,
      )
    }
    seen.set(descriptor.slug, descriptor)
  }
}

function nativePresentationSlug(presentationsRoot: string, file: string): string {
  const relativeDirectory = relative(presentationsRoot, dirname(file)).replaceAll('\\', '/')
  if (!relativeDirectory || relativeDirectory.includes('/') || !registryIdPattern.test(relativeDirectory)) {
    throw new Error(`Native Slidev presentation must use content/presentations/<kebab-slug>/slides.md: ${file}`)
  }
  return relativeDirectory
}

export async function discoverPresentationDescriptors({
  root,
  siteBase,
  config,
}: DiscoverPresentationInput): Promise<PresentationDescriptor[]> {
  const descriptors: PresentationDescriptor[] = []

  const briefFiles = await listFiles(resolve(root, config.content.briefsDir), ['.yaml', '.yml'])
  for (const file of briefFiles) {
    const brief = briefSchema.parse(await readYaml(file))
    if (brief.status !== 'published' || !brief.presentation.enabled) continue

    const slug = basename(file).replace(/\.(yaml|yml)$/, '')
    descriptors.push(toBriefPresentationDescriptor(brief, {
      slug,
      readingUrl: `${joinBasePath(siteBase, 'briefs', slug)}/`,
    }))
  }

  const presentationsRoot = resolve(root, config.content.presentationsDir)
  const presentationFiles = await listFiles(presentationsRoot, ['.yaml', '.yml'])
  for (const file of presentationFiles) {
    const presentation = presentationContentSchema.parse(await readYaml(file))
    if (presentation.status !== 'published') continue

    const slug = basename(file).replace(/\.(yaml|yml)$/, '')
    descriptors.push(toStandalonePresentationDescriptor(presentation, { slug }))
  }

  const nativeFiles = (await listFiles(presentationsRoot, ['.md']))
    .filter((file) => basename(file) === 'slides.md')
  for (const file of nativeFiles) {
    const presentation = nativePresentationSchema.parse((await readMarkdownFrontmatter(file)).data)
    if (presentation.orbis.status !== 'published') continue

    const slug = nativePresentationSlug(presentationsRoot, file)
    descriptors.push(toNativePresentationDescriptor(presentation, {
      slug,
      sourceDir: relative(root, dirname(file)).replaceAll('\\', '/'),
    }))
  }

  assertUniquePresentationSlugs(descriptors)
  return descriptors.sort((left, right) => left.slug.localeCompare(right.slug))
}
