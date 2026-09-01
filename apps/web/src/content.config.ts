import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import {
  authorSchema,
  briefSchema,
  essaySchema,
  knowledgeSchema,
  presentationContentSchema,
  sourceSchema,
  topicSchema,
} from '@orbis/content-schema'

const essays = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../../content/essays' }),
  schema: essaySchema,
})

const briefs = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: '../../content/briefs' }),
  schema: briefSchema,
})

const presentations = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: '../../content/presentations' }),
  schema: presentationContentSchema,
})

const topics = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: '../../content/topics' }),
  schema: topicSchema,
})

const knowledge = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../../content/knowledge' }),
  schema: knowledgeSchema,
})

const sources = defineCollection({
  loader: glob({ pattern: '*.{yaml,yml}', base: '../../content/sources' }),
  schema: sourceSchema,
})

const authors = defineCollection({
  loader: glob({ pattern: '*.{yaml,yml}', base: '../../content/authors' }),
  schema: authorSchema,
})

export const collections = {
  essays,
  briefs,
  presentations,
  topics,
  knowledge,
  sources,
  authors,
}
