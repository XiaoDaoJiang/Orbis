import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parse } from 'yaml'

const workflow = parse(await readFile('.github/workflows/pr-preview-publish.yml', 'utf8'))
const job = workflow.jobs['publish-preview']
const step = job.steps.find((candidate: { name?: string }) => candidate.name === 'Verify public preview availability')
assert.ok(step, 'Preview publisher must verify public availability')
assert.equal(job['timeout-minutes'], 10)
assert.equal(step['timeout-minutes'], 7)
const script: string = step.run
assert.match(script, /deadline=\$\(\(\s*\$\(date \+%s\)\s*\+\s*360\s*\)\)/)
assert.match(script, /delay=10/)
assert.match(script, /--max-time "\$timeout"/)
assert.match(script, /jq -e --slurpfile expected preview\/orbis-preview-provenance\.json '\. == \$expected\[0\]'/)
assert.match(script, /orbis-preview-provenance\.json\?run=\$GITHUB_RUN_ID&attempt=\$GITHUB_RUN_ATTEMPT/)
assert.match(script, /grep -q '<rss'/)
assert.match(script, /fetch "\$preview_root\/favicon\.svg"/)

if (process.platform === 'win32') {
  console.log('Preview smoke static contract passed; Bash behavior explicitly skipped on Windows')
} else {
  const root = await mkdtemp(join(tmpdir(), 'orbis-preview-smoke-'))
  const bin = join(root, 'bin')
  const start = 1_000
  const budget = 360
  const preview = 'https://raw.githack.com/example/orbis/preview-pr-65'
  const expected = { repository: 'example/orbis', pr: '65', sha: 'a'.repeat(40), sourceRun: '10', sourceAttempt: '1', publisherRun: '20', publisherAttempt: '2' }
  const stale = { ...expected, publisherAttempt: '1' }
  try {
    await mkdir(bin)
    await mkdir(join(root, 'preview'))
    await writeFile(join(root, 'preview/orbis-preview-provenance.json'), JSON.stringify(expected))
    const mock = async (name: string, body: string) => writeFile(join(bin, name), `#!/bin/bash\nset -euo pipefail\n${body}\n`, { mode: 0o755 })
    await mock('date', `
[[ "$#" == 1 && "$1" == '+%s' ]]
IFS= read -r now < "$MOCK_CLOCK"
printf '%s\\n' "$now"
`)
    await mock('sleep', `
IFS= read -r now < "$MOCK_CLOCK"
printf 'sleep\\t%s\\t%s\\n' "$now" "$1" >> "$MOCK_TRACE"
printf '%s\\n' "$((now + $1))" > "$MOCK_CLOCK"
`)
    await mock('curl', `
timeout=''
url=''
while (( $# )); do
  case "$1" in
    --max-time) timeout="$2"; shift 2 ;;
    --fail|--silent|--show-error|--location) shift ;;
    *) url="$1"; shift ;;
  esac
done
[[ "$timeout" =~ ^[1-9][0-9]*$ ]]
IFS= read -r now < "$MOCK_CLOCK"
elapsed=$((now - MOCK_START))
kind=unknown
case "$url" in
  "$MOCK_PREVIEW/orbis-preview-provenance.json?run=20&attempt=2") kind=proof ;;
  "$MOCK_PREVIEW/rss.xml") kind=rss ;;
  "$MOCK_PREVIEW/favicon.svg") kind=favicon ;;
esac
printf 'curl\\t%s\\t%s\\t%s\\n' "$now" "$timeout" "$kind" >> "$MOCK_TRACE"
latency="$MOCK_LATENCY"
if (( latency > timeout )); then latency="$timeout"; fi
printf '%s\\n' "$((now + latency))" > "$MOCK_CLOCK"
if [[ "$MOCK_CASE" == slow_http || "$MOCK_CASE" == http_only ]]; then exit 28; fi
if [[ "$kind" == proof ]]; then
  if [[ "$MOCK_CASE" == malformed ]]; then printf '{invalid'; exit 0; fi
  if [[ "$MOCK_CASE" == transient ]]; then
    if (( elapsed < 40 )); then exit 22; fi
    if (( elapsed < 90 )); then printf '{invalid'; exit 0; fi
  fi
  if [[ "$MOCK_CASE" == stale || "$MOCK_CASE" == slow_stale ]] \\
    || { [[ "$MOCK_CASE" == delayed || "$MOCK_CASE" == transient ]] && (( elapsed < 130 )); }; then
    printf '%s\\n' "$MOCK_STALE"
  else
    printf '%s\\n' "$MOCK_EXPECTED"
  fi
elif [[ "$kind" == rss ]]; then
  if [[ "$MOCK_CASE" == rss_http ]]; then exit 22; fi
  if [[ "$MOCK_CASE" == rss_invalid ]]; then printf '<html>unavailable</html>'; else printf '<rss></rss>'; fi
elif [[ "$kind" == favicon ]]; then
  if [[ "$MOCK_CASE" == favicon_http ]]; then exit 22; fi
  printf '<svg></svg>'
else
  echo "Unexpected request: $url" >&2
  exit 97
fi
`)
    // Prefer real jq; the fallback implements exactly the JSON-equality invocation
    // above so this regression also runs on macOS machines without jq installed.
    if (spawnSync('jq', ['--version'], { encoding: 'utf8' }).status !== 0) {
      const helper = join(root, 'jq.cjs')
      await writeFile(helper, `
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { isDeepStrictEqual } = require('node:util');
const args = process.argv.slice(2);
assert.deepEqual(args.slice(0, 3), ['-e', '--slurpfile', 'expected']);
assert.equal(args[4], '. == $expected[0]');
try {
  process.exitCode = isDeepStrictEqual(JSON.parse(fs.readFileSync(0, 'utf8')), JSON.parse(fs.readFileSync(args[3], 'utf8'))) ? 0 : 1;
} catch { process.exitCode = 4; }
`)
      await mock('jq', 'exec "$MOCK_NODE" "$MOCK_JQ_HELPER" "$@"')
    }

    for (const scenario of [
      { name: 'delayed', success: true, latency: 0 },
      { name: 'transient', success: true, latency: 0 },
      { name: 'stale', success: false, latency: 0 },
      { name: 'malformed', success: false, latency: 0 },
      { name: 'http_only', success: false, latency: 0 },
      { name: 'rss_http', success: false, latency: 0 },
      { name: 'rss_invalid', success: false, latency: 0 },
      { name: 'favicon_http', success: false, latency: 0 },
      { name: 'slow_http', success: false, latency: 15 },
      { name: 'slow_stale', success: false, latency: 13 },
    ]) {
      const clock = join(root, 'clock')
      const tracePath = join(root, 'trace')
      await writeFile(clock, `${start}\n`)
      await writeFile(tracePath, '')
      const result = spawnSync('bash', ['-c', script], {
        cwd: root, encoding: 'utf8', timeout: 30_000,
        env: {
          ...process.env, PATH: `${bin}:${process.env.PATH ?? ''}`,
          PREVIEW_URL: `${preview}/index.html`, GITHUB_RUN_ID: '20', GITHUB_RUN_ATTEMPT: '2',
          MOCK_CLOCK: clock, MOCK_TRACE: tracePath, MOCK_START: String(start),
          MOCK_CASE: scenario.name, MOCK_LATENCY: String(scenario.latency), MOCK_PREVIEW: preview,
          MOCK_EXPECTED: JSON.stringify(expected), MOCK_STALE: JSON.stringify(stale),
          MOCK_NODE: process.execPath, MOCK_JQ_HELPER: join(root, 'jq.cjs'),
        },
      })
      assert.ifError(result.error)
      assert.equal(result.status, scenario.success ? 0 : 1, `${scenario.name}: ${result.stderr}`)
      const elapsed = Number(await readFile(clock, 'utf8')) - start
      const trace = (await readFile(tracePath, 'utf8')).trim().split('\n').map(line => line.split('\t'))
      const requests = trace.filter(row => row[0] === 'curl')
      assert.ok(requests.length > 0, `${scenario.name}: must request public proof`)
      for (const [command, timestamp, amount, kind] of trace) {
        const remaining = start + budget - Number(timestamp)
        assert.ok(Number(amount) > 0 && Number(amount) <= remaining, `${scenario.name}: ${command} must fit remaining deadline`)
        assert.ok(Number(amount) <= (command === 'curl' ? 15 : 10), `${scenario.name}: bounded request/poll interval`)
        if (command === 'curl') assert.notEqual(kind, 'unknown', `${scenario.name}: only original preview branch URLs are allowed`)
      }
      assert.ok(elapsed <= budget, `${scenario.name}: elapsed ${elapsed} exceeds deadline`)
      if (scenario.success) {
        assert.ok(elapsed >= 130, `${scenario.name}: must tolerate propagation beyond 120 seconds`)
        assert.match(result.stdout, /Exact public preview is reachable/)
        assert.deepEqual(requests.slice(-3).map(row => row[3]), ['proof', 'rss', 'favicon'])
        assert.ok(requests.filter(row => row[3] !== 'proof').every(row => Number(row[1]) - start >= 130))
      } else {
        assert.equal(elapsed, budget, `${scenario.name}: must exhaust the bounded propagation window`)
        assert.match(result.stderr, /did not become reachable within 360 seconds/)
        assert.doesNotMatch(result.stdout, /Exact public preview is reachable/)
      }
      if (scenario.name === 'slow_http') assert.ok(requests.some(row => Number(row[2]) < 15), 'Final curl must clamp its timeout to remaining budget')
      if (scenario.name === 'slow_stale') assert.ok(trace.some(row => row[0] === 'sleep' && Number(row[2]) < 10), 'Final sleep must clamp its delay to remaining budget')
      console.log(`Preview smoke behavior passed: ${scenario.name}`)
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
  console.log('Bounded exact-provenance preview smoke regression passed')
}
