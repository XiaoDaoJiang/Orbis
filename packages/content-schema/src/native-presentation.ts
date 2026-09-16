import { z } from 'zod'

const dateStringSchema = z
  .union([z.string(), z.date()])
  .transform((value) => value instanceof Date ? value.toISOString().slice(0, 10) : value)
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'))

export const nativePresentationSchema = z.object({
  title: z.string().min(5),
  orbis: z.object({
    kind: z.literal('native-presentation'),
    summary: z.string().min(12),
    publishedAt: dateStringSchema,
    status: z.enum(['draft', 'published', 'needs-review', 'archived']),
    topics: z.array(z.string().min(2)).min(1),
  }).strict(),
}).passthrough()

export type NativePresentation = z.infer<typeof nativePresentationSchema>
