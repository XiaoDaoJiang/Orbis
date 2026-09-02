import { parse } from 'yaml'
import siteConfigSource from '../../../../config/site.yaml?raw'
import { validateSiteConfig } from '../../../../tools/shared/site-config.ts'
import type { SiteConfig } from '../../../../tools/shared/site-config.ts'

export const webSiteConfig = validateSiteConfig(
  parse(siteConfigSource) as SiteConfig,
  'config/site.yaml',
)
