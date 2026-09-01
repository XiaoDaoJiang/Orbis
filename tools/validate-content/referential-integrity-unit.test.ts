import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import type {
  Author,
  DailyBrief,
  Essay,
  Source,
  Topic,
  WeeklyBrief,
} from '@orbis/content-schema'
import {
  validateReferentialIntegrity,
  type ParsedContentEntry,
} from './referential-integrity.ts'

const root = resolve(import.meta.dirname, '../..')
const path = (relativePath: string) => resolve(root, relativePath)

const topic: ParsedContentEntry = {
  kind: 'topic',
  path: path('content/topics/agent-harness.yaml'),
  value: {
    name: 'Agent Harness',
    description: 'A stable Topic identity used by the integrity unit contract.',
    aliases: [],
    status: 'active',
    related: [],
  } satisfies Topic,
}

const archivedSource: ParsedContentEntry = {
  kind: 'source',
  path: path('content/sources/known-source.yaml'),
  value: {
    name: 'Known Source',
    homepage: 'https://example.com/known-source',
    type: 'publisher',
    trustTier: 'secondary',
    status: 'archived',
    aliases: [],
    description: 'An archived Source that remains historically resolvable.',
  } satisfies Source,
}

const archivedAuthor: ParsedContentEntry = {
  kind: 'author',
  path: path('content/authors/known-author.yaml'),
  value: {
    name: 'Known Author',
    status: 'archived',
    bio: 'An archived Author that remains historically resolvable.',
  } satisfies Author,
}

const essay: ParsedContentEntry = {
  kind: 'essay',
  path: path('content/essays/known-identities.md'),
  value: {
    kind: 'essay',
    title: 'Known identities remain resolvable',
    description: 'A focused fixture proving archived Registry identities remain valid.',
    publishedAt: '2099-01-01',
    status: 'draft',
    authors: ['known-author'],
    topics: ['agent-harness'],
    featured: false,
    references: [{
      title: 'Known Source material',
      url: 'https://example.com/known-source/material',
      source: 'known-source',
      supports: 'Proves archived Source identities remain valid relations.',
    }],
  } satisfies Essay,
}

const daily: ParsedContentEntry = {
  kind: 'brief',
  path: path('content/briefs/relation-paths.yaml'),
  value: {
    kind: 'brief',
    cadence: 'daily',
    publishedAt: '2099-01-01',
    status: 'draft',
    title: 'Reference relation path fixture',
    summary: 'A focused fixture covering top-level, section and archive Source paths.',
    topics: ['agent-harness'],
    signals: [],
    sections: [{
      id: 'source-paths',
      layout: 'architecture',
      title: 'Section reference path',
      conclusion: 'Section-level Reference Source identities are validated.',
      facts: [],
      limitations: [],
      references: [{
        title: 'Missing section Source',
        url: 'https://example.com/missing-section-source',
        source: 'missing-section-source',
        supports: 'Proves section Reference paths are reported exactly.',
      }],
    }],
    projects: [],
    radar: [],
    actions: [],
    references: [
      {
        title: 'Missing top-level Source',
        url: 'https://example.com/missing-top-source',
        source: 'missing-top-source',
        supports: 'Proves top-level Reference paths are reported exactly.',
      },
      {
        title: 'Intentionally unsourced material',
        url: 'https://example.com/unsourced',
        supports: 'Proves omitted Reference.source remains a valid path.',
      },
    ],
    archivePicks: [{
      title: 'Missing archive Source',
      url: 'https://example.com/missing-archive-source',
      source: 'missing-archive-source',
      supports: 'Proves Daily archive Reference paths are reported exactly.',
    }],
    presentation: { enabled: false, template: 'daily-v1' },
  } as DailyBrief,
}

const weekly: ParsedContentEntry = {
  kind: 'brief',
  path: path('content/briefs/weekly-trend-topic.yaml'),
  value: {
    kind: 'brief',
    cadence: 'weekly',
    publishedAt: '2099-01-07',
    status: 'draft',
    title: 'Weekly trend Topic fixture',
    summary: 'A focused fixture proving Weekly trend Topics participate in integrity validation.',
    topics: ['agent-harness'],
    period: { from: '2099-01-01', to: '2099-01-07' },
    weeklyThesis: 'Weekly trend Topics are independent relations and require canonical Topic resolution.',
    trendMovements: [
      {
        topic: 'missing-trend-topic',
        direction: 'rising',
        summary: 'The first movement intentionally references a missing Topic identity.',
      },
      {
        topic: 'agent-harness',
        direction: 'stable',
        summary: 'The second movement proves a registered Topic remains valid.',
      },
    ],
    sections: [],
    nextPeriodWatch: [],
    references: [],
    presentation: { enabled: false, template: 'weekly-v1' },
  } as WeeklyBrief,
}

const entries = [weekly, archivedAuthor, daily, topic, essay, archivedSource]
const expected = [
  'Invalid relation: content/briefs/relation-paths.yaml: archivePicks[0].source -> missing source "missing-archive-source"',
  'Invalid relation: content/briefs/relation-paths.yaml: references[0].source -> missing source "missing-top-source"',
  'Invalid relation: content/briefs/relation-paths.yaml: sections[0].references[0].source -> missing source "missing-section-source"',
  'Invalid relation: content/briefs/weekly-trend-topic.yaml: trendMovements[0].topic -> missing topic "missing-trend-topic"',
].sort((left, right) => left.localeCompare(right))

assert.deepEqual(validateReferentialIntegrity(root, entries), expected)
assert.deepEqual(
  validateReferentialIntegrity(root, [...entries].reverse()),
  expected,
  'Integrity diagnostics must remain stable regardless of input order',
)

console.log('Referential integrity unit contract passed')
