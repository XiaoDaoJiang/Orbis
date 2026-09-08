import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { EvidenceDailyBrief } from '@orbis/content-schema'
import { stringify } from 'yaml'
import { runCorrectionGuard } from './correction-guard.ts'

const execFileAsync = promisify(execFile)
const root = await mkdtemp(join(tmpdir(), 'orbis-correction-guard-'))
const contentPath = 'content/briefs/2026-09-07.yaml'
const branch = 'correction/daily/2026-09-07/integration-proof'

function makeBrief(): EvidenceDailyBrief {
  return {
    kind: 'brief',
    cadence: 'daily',
    evidenceVersion: 1,
    publishedAt: '2026-09-07',
    status: 'published',
    title: 'Published Evidence Daily integration fixture',
    summary: 'A sufficiently descriptive integration fixture for the published Daily correction guard.',
    topics: ['agent-harness'],
    signals: Array.from({ length: 4 }, (_, index) => ({
      title: `Signal ${index + 1}`,
      summary: 'A sufficiently descriptive signal summary.',
      impact: 'high' as const,
    })),
    sections: Array.from({ length: 5 }, (_, index) => ({
      id: `section-${index + 1}`,
      layout: 'architecture' as const,
      title: `Section ${index + 1}`,
      conclusion: 'A sufficiently descriptive conclusion for the integration fixture.',
      facts: [{ id: `claim-${index + 1}`, text: `Published fact ${index + 1}.`, evidence: ['source-one'] }],
      limitations: [],
    })),
    projects: [],
    radar: [],
    actions: Array.from({ length: 3 }, (_, index) => ({
      title: `Action ${index + 1}`,
      description: 'A concrete action description for the integration fixture.',
    })),
    references: [{
      id: 'source-one',
      title: 'Primary source one',
      url: 'https://example.com/source-one',
      supports: 'Supports all fixture facts and corrections.',
      accessedAt: '2026-09-07',
    }],
    archivePicks: [],
    corrections: [{
      id: 'existing-correction',
      correctedAt: '2026-09-07',
      summary: 'Existing correction event is immutable history.',
      targets: [{ section: 'section-1', fact: 'claim-1' }],
      evidence: ['source-one'],
    }],
    presentation: { enabled: true, template: 'daily-v1' },
  }
}

async function commitBrief(brief: EvidenceDailyBrief, message: string, extraPath?: string) {
  await writeFile(join(root, contentPath), stringify(brief))
  if (extraPath) await writeFile(join(root, extraPath), 'unexpected\n')
  await execFileAsync('git', ['add', '-A'], { cwd: root })
  await execFileAsync('git', ['commit', '-m', message], { cwd: root })
}

async function resetTo(base: string) {
  await execFileAsync('git', ['reset', '--hard', base], { cwd: root })
  await execFileAsync('git', ['clean', '-fd'], { cwd: root })
}

try {
  await execFileAsync('git', ['init'], { cwd: root })
  await execFileAsync('git', ['config', 'user.name', 'Orbis Contract'], { cwd: root })
  await execFileAsync('git', ['config', 'user.email', 'contract@example.invalid'], { cwd: root })
  await mkdir(join(root, 'content/briefs'), { recursive: true })
  await mkdir(join(root, 'config'), { recursive: true })
  await writeFile(join(root, 'config/evidence-integrity.yaml'), 'version: 1\nlegacyDailyPaths: []\n')
  await writeFile(join(root, contentPath), stringify(makeBrief()))
  await execFileAsync('git', ['add', '.'], { cwd: root })
  await execFileAsync('git', ['commit', '-m', 'base published Daily'], { cwd: root })
  const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root })
  const base = stdout.trim()

  const valid = structuredClone(makeBrief())
  valid.sections[0].facts[0].text = 'Corrected published fact.'
  valid.corrections.push({
    id: 'integration-correction',
    correctedAt: '2026-09-07',
    summary: 'Records the corrected published fact in the integration proof.',
    targets: [{ section: 'section-1', fact: 'claim-1' }],
    evidence: ['source-one'],
  })
  await commitBrief(valid, 'valid correction')
  assert.deepEqual((await runCorrectionGuard(root, base, branch)).issues, [], 'Valid real-git correction must pass')

  await resetTo(base)
  const untracked = structuredClone(makeBrief())
  untracked.sections[0].facts[0].text = 'Changed without provenance.'
  untracked.corrections.push({
    id: 'wrong-target',
    correctedAt: '2026-09-07',
    summary: 'Targets a different fact and must not cover the mutation.',
    targets: [{ section: 'section-2', fact: 'claim-2' }],
    evidence: ['source-one'],
  })
  await commitBrief(untracked, 'untracked correction')
  assert.ok((await runCorrectionGuard(root, base, branch)).issues.some((issue) => issue.code === 'UNTRACKED_FACT_MUTATION'))

  await resetTo(base)
  const historyRewrite = structuredClone(makeBrief())
  historyRewrite.corrections[0].summary = 'Rewritten historical correction.'
  historyRewrite.corrections.push({
    id: 'new-event',
    correctedAt: '2026-09-07',
    summary: 'New correction cannot authorize rewriting old correction history.',
    targets: [{ section: 'section-1', fact: 'claim-1' }],
    evidence: ['source-one'],
  })
  await commitBrief(historyRewrite, 'rewrite correction history')
  assert.ok((await runCorrectionGuard(root, base, branch)).issues.some((issue) => issue.code === 'CORRECTION_HISTORY_MUTATED'))

  await resetTo(base)
  const extraPath = structuredClone(makeBrief())
  extraPath.corrections.push({
    id: 'extra-path-event',
    correctedAt: '2026-09-07',
    summary: 'A valid event cannot authorize changing another repository path.',
    targets: [{ section: 'section-1', fact: 'claim-1' }],
    evidence: ['source-one'],
  })
  await commitBrief(extraPath, 'touch extra path', 'README.md')
  assert.ok((await runCorrectionGuard(root, base, branch)).issues.some((issue) => issue.code === 'INVALID_CORRECTION_CHANGESET'))

  await resetTo(base)
  const dangling = structuredClone(makeBrief())
  dangling.corrections.push({
    id: 'dangling-target',
    correctedAt: '2026-09-07',
    summary: 'A dangling correction target must fail the shared Evidence evaluator.',
    targets: [{ section: 'section-1', fact: 'missing-claim' }],
    evidence: ['source-one'],
  })
  await commitBrief(dangling, 'dangling correction target')
  assert.ok((await runCorrectionGuard(root, base, branch)).issues.some((issue) => issue.code === 'INVALID_CORRECTION_TARGET'))

  console.log('Published Daily correction guard real Git integration contract passed')
} finally {
  await rm(root, { recursive: true, force: true })
}
