import { z } from 'zod'

export const publicationStatusSchema = z.enum([
  'draft',
  'published',
  'needs-review',
  'archived',
  'active',
])

export const dateStringSchema = z
  .union([z.string(), z.date()])
  .transform((value) => value instanceof Date ? value.toISOString().slice(0, 10) : value)
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'))

export const registryIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const registryIdSchema = z.string().regex(
  registryIdPattern,
  'Expected lowercase kebab-case registry ID',
)

const registryStatusSchema = z.enum(['active', 'archived'])

const sourceAliasesSchema = z.array(registryIdSchema).default([]).superRefine((aliases, ctx) => {
  if (new Set(aliases).size !== aliases.length) {
    ctx.addIssue({ code: 'custom', message: 'Source aliases must be unique' })
  }
})

export const sourceSchema = z.object({
  name: z.string().min(2),
  homepage: z.url(),
  type: z.enum(['official', 'publisher', 'individual', 'community', 'aggregator']),
  trustTier: z.enum(['primary', 'secondary', 'discovery']),
  status: registryStatusSchema,
  feed: z.url().optional(),
  aliases: sourceAliasesSchema,
  description: z.string().min(12).optional(),
}).strict()

export const authorSchema = z.object({
  name: z.string().min(2),
  status: registryStatusSchema,
  url: z.url().optional(),
  bio: z.string().min(12).optional(),
}).strict()

export const referenceSchema = z.object({
  title: z.string().min(3),
  url: z.url(),
  source: z.string().min(2).optional(),
  supports: z.string().min(3),
  accessedAt: dateStringSchema.optional(),
})

export const archivePickSchema = referenceSchema.extend({
  publishedAt: dateStringSchema.optional(),
})

export const signalSchema = z.object({
  title: z.string().min(3),
  summary: z.string().min(12),
  impact: z.enum(['high', 'medium', 'watch']),
})

export const briefSectionSchema = z.object({
  id: z.string().min(2),
  layout: z.enum(['architecture', 'comparison', 'timeline', 'metrics', 'system-map']),
  title: z.string().min(3),
  conclusion: z.string().min(12),
  facts: z.array(z.string().min(5)).min(1).max(4),
  limitations: z.array(z.string().min(5)).max(3).default([]),
  references: z.array(referenceSchema).min(1),
})

export const presentationSectionSchema = z.object({
  id: z.string().min(2),
  layout: z.enum(['content', 'architecture', 'comparison', 'timeline', 'metrics', 'system-map']),
  title: z.string().min(3),
  conclusion: z.string().min(12),
  facts: z.array(z.string().min(5)).min(1).max(6),
  limitations: z.array(z.string().min(5)).max(3).default([]),
  references: z.array(referenceSchema).default([]),
})

export const projectSchema = z.object({
  action: z.enum(['CLONE', 'READ', 'TEST', 'WATCH']),
  name: z.string().min(3),
  summary: z.string().min(8),
  maturity: z.enum(['experimental', 'early', 'growing', 'stable']),
  url: z.url(),
})

export const radarItemSchema = z.object({
  label: z.string().min(2),
  impact: z.number().min(0).max(100),
  horizon: z.number().min(0).max(100),
  note: z.string().min(5),
})

export const actionSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(8),
})

export const trendMovementSchema = z.object({
  topic: z.string().min(2),
  direction: z.enum(['rising', 'stable', 'cooling', 'new-variable']),
  summary: z.string().min(12),
}).strict()

export const nextPeriodWatchSchema = z.object({
  title: z.string().min(3),
  reason: z.string().min(12),
}).strict()

export const weeklyPeriodSchema = z.object({
  from: dateStringSchema,
  to: dateStringSchema,
}).strict().superRefine((period, ctx) => {
  const from = Date.parse(`${period.from}T00:00:00Z`)
  const to = Date.parse(`${period.to}T00:00:00Z`)
  if (to - from !== 6 * 24 * 60 * 60 * 1000) {
    ctx.addIssue({
      code: 'custom',
      message: 'Weekly period must contain exactly seven calendar dates',
    })
  }
})

export const presentationSchema = z.object({
  enabled: z.boolean(),
  template: z.enum(['daily-v1', 'weekly-v1', 'talk-v1']),
})

const briefSharedSchema = z.object({
  kind: z.literal('brief'),
  publishedAt: dateStringSchema,
  status: publicationStatusSchema,
  title: z.string().min(5),
  summary: z.string().min(12),
  topics: z.array(z.string().min(2)).min(1),
  references: z.array(referenceSchema).min(1),
})

const legacyBriefBody = {
  signals: z.array(signalSchema).min(1).max(8),
  sections: z.array(briefSectionSchema).min(1).max(8),
  projects: z.array(projectSchema).max(6).default([]),
  radar: z.array(radarItemSchema).max(8).default([]),
  actions: z.array(actionSchema).min(1).max(8),
  archivePicks: z.array(archivePickSchema).max(6).default([]),
  presentation: presentationSchema,
}

export const dailyBriefSchema = briefSharedSchema.extend({
  cadence: z.literal('daily'),
  ...legacyBriefBody,
  signals: z.array(signalSchema).length(4),
  sections: z.array(briefSectionSchema).length(5),
  actions: z.array(actionSchema).min(3).max(5),
  presentation: z.object({
    enabled: z.boolean(),
    template: z.literal('daily-v1'),
  }),
})

export const weeklyBriefSchema = briefSharedSchema.extend({
  cadence: z.literal('weekly'),
  period: weeklyPeriodSchema,
  weeklyThesis: z.string().min(24),
  trendMovements: z.array(trendMovementSchema).min(2).max(8),
  sections: z.array(briefSectionSchema).min(2).max(6),
  nextPeriodWatch: z.array(nextPeriodWatchSchema).min(1).max(5),
  presentation: z.object({
    enabled: z.boolean(),
    template: z.literal('weekly-v1'),
  }).strict(),
}).strict().superRefine((brief, ctx) => {
  if (brief.publishedAt !== brief.period.to) {
    ctx.addIssue({
      code: 'custom',
      path: ['publishedAt'],
      message: 'Weekly publishedAt must equal period.to',
    })
  }
})

export const adHocBriefSchema = briefSharedSchema.extend({
  cadence: z.literal('ad-hoc'),
  ...legacyBriefBody,
})

export const briefSchema = z.union([dailyBriefSchema, weeklyBriefSchema, adHocBriefSchema])

export const presentationContentSchema = z.object({
  kind: z.literal('presentation'),
  title: z.string().min(5),
  summary: z.string().min(12),
  publishedAt: dateStringSchema,
  status: publicationStatusSchema,
  topics: z.array(z.string().min(2)).min(1),
  template: z.literal('talk-v1'),
  sections: z.array(presentationSectionSchema).min(1).max(12),
  references: z.array(referenceSchema).min(1),
})

export const essaySchema = z.object({
  kind: z.literal('essay'),
  title: z.string().min(5),
  description: z.string().min(12),
  publishedAt: dateStringSchema,
  updatedAt: dateStringSchema.optional(),
  status: publicationStatusSchema,
  authors: z.array(z.string().min(2)).min(1),
  topics: z.array(z.string().min(2)).min(1),
  featured: z.boolean().default(false),
  references: z.array(referenceSchema).default([]),
})

export const topicSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  aliases: z.array(z.string().min(2)).default([]),
  status: z.enum(['active', 'watch', 'archived']),
  related: z.array(z.string().min(2)).default([]),
})

export const knowledgeSchema = z.object({
  kind: z.literal('knowledge'),
  title: z.string().min(3),
  summary: z.string().min(12),
  status: publicationStatusSchema,
  publishedAt: dateStringSchema,
  updatedAt: dateStringSchema.optional(),
  reviewAt: dateStringSchema.optional(),
  topics: z.array(z.string().min(2)).min(1),
  references: z.array(referenceSchema).default([]),
})

export type Source = z.infer<typeof sourceSchema>
export type Author = z.infer<typeof authorSchema>
export type Brief = z.infer<typeof briefSchema>
export type DailyBrief = z.infer<typeof dailyBriefSchema>
export type WeeklyBrief = z.infer<typeof weeklyBriefSchema>
export type AdHocBrief = z.infer<typeof adHocBriefSchema>
export type PresentationContent = z.infer<typeof presentationContentSchema>
export type Essay = z.infer<typeof essaySchema>
export type Topic = z.infer<typeof topicSchema>
export type Knowledge = z.infer<typeof knowledgeSchema>
