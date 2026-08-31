export type PresentationSourceKind = 'brief' | 'presentation'

export type PresentationDescriptor = {
  id: string
  slug: string
  title: string
  publishedAt: string
  topics: string[]
  template: string
  sourceKind: PresentationSourceKind
  readingUrl?: string
  payload: unknown
}

export type PresentationRenderContext = {
  siteBase: string
}
