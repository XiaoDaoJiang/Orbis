import assert from 'node:assert/strict'
import { classifyPresentationImpact } from './presentation-impact-policy.ts'

assert.deepEqual(
  classifyPresentationImpact([{ status: 'M', path: 'content/essays/example.md' }]),
  { mode: 'none', ids: [], reasons: ['No presentation-affecting changes detected'] },
)

assert.deepEqual(
  classifyPresentationImpact([
    { status: 'M', path: 'content/briefs/2026-09-11.yaml' },
    { status: 'A', path: 'content/presentations/platform-talk.yml' },
    { status: 'M', path: 'content/presentations/native-talk/slides.md' },
  ]),
  {
    mode: 'ids',
    ids: ['2026-09-11', 'native-talk', 'platform-talk'],
    reasons: [
      'M content/briefs/2026-09-11.yaml -> 2026-09-11',
      'A content/presentations/platform-talk.yml -> platform-talk',
      'M content/presentations/native-talk/slides.md -> native-talk',
    ],
  },
)

assert.deepEqual(
  classifyPresentationImpact([
    {
      status: 'R100',
      oldPath: 'content/presentations/old-talk.yaml',
      path: 'content/presentations/new-talk.yaml',
    },
  ]),
  {
    mode: 'ids',
    ids: ['new-talk', 'old-talk'],
    reasons: [
      'R100 content/presentations/old-talk.yaml -> old-talk',
      'R100 content/presentations/new-talk.yaml -> new-talk',
    ],
  },
)

for (const path of [
  'apps/slides/style.css',
  'tools/generate-slides/index.ts',
  'packages/content-schema/index.ts',
  'config/site.yaml',
  'content/topics/coding-agent.yaml',
  'content/presentations/native-talk/local-asset.png',
  'pnpm-lock.yaml',
]) {
  const impact = classifyPresentationImpact([{ status: 'M', path }])
  assert.equal(impact.mode, 'all', `${path} must invalidate all presentation output`)
}

console.log('Presentation impact policy contracts passed')
