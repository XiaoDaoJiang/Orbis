import { basename, resolve } from 'node:path'
import { briefSchema, presentationContentSchema } from '@orbis/content-schema'
import type { PresentationDescriptor } from '../../apps/slides/presentation.ts'
import { listFiles, readYaml } from '../shared/content.ts'
import { joinBasePath, type SiteConfig } from '../shared/site-config.ts'
import { toBriefPresentationDescriptor } from './brief-source.ts'
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

  const presentationFiles = await listFiles(resolve(root, config.content.presentationsDir), ['.yaml', '.yml'])
  for (const file of presentationFiles) {
    const presentation = presentationContentSchema.parse(await readYaml(file))
    if (presentation.status !== 'published') continue

    const slug = basename(file).replace(/\.(yaml|yml)$/, '')
    descriptors.push(toStandalonePresentationDescriptor(presentation, { slug }))
  }

  assertUniquePresentationSlugs(descriptors)
  return descriptors.sort((left, right) => left.slug.localeCompare(right.slug))
}
