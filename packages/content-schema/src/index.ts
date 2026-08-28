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

export const referenceSchema = z.object({
  title: z.string().min(3),
  url: z.url(),
  source: z.string().min(2).optional(),
  supports: z.string().min(3),
  accessedAt: dateStringSchema.optional(),
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

export const presentationSchema = z.object({
  enabled: z.boolean(),
  template: z.enum(['daily-v1', 'weekly-v1', 'talk-v1']),
})

export const briefSchema = z
  .object({
    kind: z.literal('brief'),
    cadence: z.enum(['daily', 'weekly', 'ad-hoc']),
    publishedAt: dateStringSchema,
    status: publicationStatusSchema,
    title: z.string().min(5),
    summary: z.string().min(12),
    topics: z.array(z.string().min(2)).min(1),
    signals: z.array(signalSchema).length(4),
    sections: z.array(briefSectionSchema).min(3).max(5),
    projects: z.array(projectSchema).max(6).default([]),
    radar: z.array(radarItemSchema).max(8).default([]),
    actions: z.array(actionSchema).min(3).max(5),
    references: z.array(referenceSchema).min(1),
    archivePicks: z.array(referenceSchema).max(6).default([]),
    presentation: presentationSchema,
  })
  .superRefine((value, context) => {
    if (value.cadence === 'daily' && value.presentation.template !== 'daily-v1') {
      context.addIssue({
        code: 'custom',
        path: ['presentation', 'template'],
        message: 'Daily briefs must use daily-v1 in the prototype',
      })
    }
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

export type Brief = z.infer<typeof briefSchema>
export type Essay = z.infer<typeof essaySchema>
export type Topic = z.infer<typeof topicSchema>
export type Knowledge = z.infer<typeof knowledgeSchema>
