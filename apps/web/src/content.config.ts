import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import {
  briefSchema,
  essaySchema,
  knowledgeSchema,
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

const topics = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: '../../content/topics' }),
  schema: topicSchema,
})

const knowledge = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../../content/knowledge' }),
  schema: knowledgeSchema,
})

export const collections = { essays, briefs, topics, knowledge }
