import { appendFileSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

export const policy = JSON.parse(readFileSync(new URL('../../config/daily-auto-merge.json', import.meta.url), 'utf8'))
const marker = '<!-- orbis-content-automation:v1 -->'
const shaPattern = /^[a-f0-9]{40}$/
const isDaily = pr => pr.head?.ref?.startsWith('automation/daily/') === true

/** Pure policy: metadata is data, never shell input or executable PR code. */
export function eligibility(pr, files, repositoryPolicy = policy) {
  const no = reason => ({ eligible: false, reason })
  if (!isDaily(pr)) return no('manual-only')
  const date = /^automation\/daily\/(\d{4}-\d{2}-\d{2})$/.exec(pr.head.ref)?.[1]
  const parsed = new Date(`${date}T00:00:00.000Z`)
  if (!date || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return no('invalid-date')
  if (pr.base?.ref !== repositoryPolicy.baseBranch) return no('unexpected-base')
  if (pr.base?.repo?.id !== repositoryPolicy.repositoryId || pr.head?.repo?.id !== repositoryPolicy.repositoryId) return no('foreign-repository')
  if (pr.state !== 'open' || pr.merged) return no('pr-not-open')
  if (pr.draft !== false) return no('pr-is-draft')
  if (!repositoryPolicy.producerIds.includes(pr.user?.id)) return no('untrusted-producer')
  if (!shaPattern.test(pr.head.sha ?? '')) return no('invalid-head')
  if (typeof pr.body !== 'string' || !pr.body.includes(marker)) return no('missing-automation-marker')
  if (pr.changed_files !== 1 || !Array.isArray(files) || files.length !== 1) return no('unexpected-file-count')
  const path = `content/briefs/${date}.yaml`
  if (files[0].filename !== path) return no('unexpected-file')
  if (files[0].status !== 'added' || files[0].previous_filename) return no('not-new-daily')
  return { eligible: true, reason: 'eligible', path, targetDate: date }
}

export function previewMatches(run, pr, attempt, repositoryPolicy = policy) {
  return run?.event === 'pull_request' && run.status === 'completed' && run.conclusion === 'success'
    && run.path === repositoryPolicy.previewWorkflowPath
    && run.repository?.id === repositoryPolicy.repositoryId && run.head_repository?.id === repositoryPolicy.repositoryId
    && run.head_sha === pr.head.sha && run.head_branch === pr.head.ref
    && run.run_attempt === attempt && run.pull_requests?.length === 1 && run.pull_requests[0].number === pr.number
}

export function requiredGateConfigured(rules, repositoryPolicy = policy) {
  if (!Array.isArray(rules) || !rules.some(rule => rule.type === 'pull_request')) return false
  const checks = rules.filter(rule => rule.type === 'required_status_checks')
    .flatMap(rule => rule.parameters?.required_status_checks ?? [])
  return repositoryPolicy.requiredChecks.every(context => checks.some(check =>
    check.context === context && check.integration_id === repositoryPolicy.checksIntegrationId))
}

export function githubClient(token) {
  if (!token) throw new Error('missing-github-token')
  const prefix = `/repos/${policy.repository}`
  return async (path, { method = 'GET', body, missing = false } = {}) => {
    const response = await fetch(`https://api.github.com${prefix}${path}`, {
      method, redirect: 'error', signal: AbortSignal.timeout(30_000),
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    if (response.status === 404 && missing) return null
    if (!response.ok) throw new Error(`github-api-${response.status}: ${method} ${path}`)
    return response.status === 204 ? null : response.json()
  }
}

async function pages(api, path) {
  const all = []
  for (let page = 1; page <= 30; page++) {
    const rows = await api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`)
    if (!Array.isArray(rows)) throw new Error('invalid-api-page')
    all.push(...rows)
    if (rows.length < 100) return all
  }
  throw new Error('pagination-limit')
}

function result(eligible, reason, extra = {}) { return { eligible, reason, ...extra } }

/** All three entrypoints load policy from trusted main, not from the PR. */
export async function runGate({ mode, event, api, env = {}, merge = () => { throw new Error('merge-unavailable') } }) {
  if (!['initialize', 'verify', 'merge'].includes(mode)) throw new Error('invalid-mode')
  if (env.GITHUB_REPOSITORY !== policy.repository || event.repository?.id !== policy.repositoryId) throw new Error('unexpected-repository')
  const source = event.workflow_run
  if (mode === 'initialize' && env.GITHUB_EVENT_NAME !== 'pull_request_target') throw new Error('unexpected-event')
  if (mode !== 'initialize' && (env.GITHUB_EVENT_NAME !== 'workflow_run' || source?.event !== 'pull_request' || source.pull_requests?.length !== 1)) throw new Error('unexpected-preview-event')
  const number = mode === 'initialize' ? event.pull_request?.number : source.pull_requests[0].number
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('invalid-pr-number')
  const url = `https://github.com/${policy.repository}/actions/runs/${env.GITHUB_RUN_ID}`
  const pr = await api(`/pulls/${number}`)
  if (!shaPattern.test(pr.head?.sha ?? '')) throw new Error('invalid-head')
  const sha = pr.head.sha
  const post = (state, description) => api(`/statuses/${sha}`, { method: 'POST', body: {
    state, context: policy.statusContext, description: description.slice(0, 140), target_url: url,
  } })
  if (pr.state !== 'open' || pr.merged) return result(false, 'pr-not-open')
  // Never let an old preview completion change the gate on a newer head.
  if (mode !== 'initialize' && source.head_sha !== sha) return result(false, 'stale-preview')
  try {
    // Status contexts are SHA-scoped: a manual PR sharing a Daily SHA must not clear its gate.
    const siblings = await pages(api, `/commits/${sha}/pulls`)
    const daily = siblings.filter(other => other.state === 'open' && other.head?.sha === sha && isDaily(other))
    if (!isDaily(pr)) {
      if (daily.length) return result(false, 'shared-daily-sha')
      await post('success', 'manual-only: no automatic merge authority')
      return result(false, 'manual-only')
    }
    if (daily.length !== 1 || daily[0].number !== number) {
      await post('failure', 'ambiguous-daily-candidate')
      return result(false, 'ambiguous-daily-candidate')
    }
    const files = await pages(api, `/pulls/${number}/files`)
    const decision = eligibility(pr, files)
    if (!decision.eligible) {
      await post('failure', decision.reason)
      return decision
    }
    // The PR diff uses its merge base; explicitly exclude a Daily already present in current main.
    const base = await api(`/git/ref/heads/${policy.baseBranch}`)
    const mainSha = base.object?.sha
    if (!shaPattern.test(mainSha ?? '')) throw new Error('invalid-main-sha')
    const existing = await api(`/contents/${decision.path}?ref=${mainSha}`, { missing: true })
    if (existing !== null) {
      await post('failure', 'daily-already-on-main')
      return result(false, 'daily-already-on-main')
    }
    if (mode === 'initialize') {
      const statuses = await pages(api, `/commits/${sha}/statuses`)
      const latest = statuses.find(status => status.context === policy.statusContext)
      // An edited/reopened event can arrive after Preview Publish; preserve only this PR's trusted proof.
      if (latest?.state === 'success' && latest.creator?.login === 'github-actions[bot]'
        && latest.description?.startsWith(`daily-preview-ok:pr-${number}:`)) return result(false, 'preview-already-verified')
      await post('pending', 'waiting-for-current-trusted-preview')
      return result(false, 'waiting-for-current-trusted-preview')
    }
    const liveRun = await api(`/actions/runs/${source.id}`)
    if (liveRun.run_attempt !== source.run_attempt) return result(false, 'stale-run-attempt')
    if (!previewMatches(liveRun, pr, source.run_attempt) || env.PREVIEW_VERIFIED !== 'true') {
      await post('failure', 'preview-not-verified')
      return result(false, 'preview-not-verified')
    }
    // Re-read after API work to reject concurrent commits, metadata edits and main movement.
    const current = await api(`/pulls/${number}`)
    const currentBase = await api(`/git/ref/heads/${policy.baseBranch}`)
    if (current.head?.sha !== sha) return result(false, 'head-moved')
    const freshDecision = eligibility(current, files)
    if (!freshDecision.eligible || currentBase.object?.sha !== mainSha) {
      await post('failure', freshDecision.eligible ? 'main-moved' : freshDecision.reason)
      return result(false, freshDecision.eligible ? 'main-moved' : freshDecision.reason)
    }
    if (mode === 'verify') {
      await post('success', `daily-preview-ok:pr-${number}:run-${source.id}:attempt-${source.run_attempt}`)
      return result(true, 'preview-verified', { pr: number, sha })
    }
    if (env.ORBIS_DAILY_AUTO_MERGE !== 'true') return result(false, 'auto-merge-disabled')
    if (!env.ORBIS_AUTO_MERGE_TOKEN) return result(false, 'missing-merge-token')
    const repository = await api('')
    if (repository.allow_auto_merge !== true || repository.allow_squash_merge !== true) return result(false, 'repository-auto-merge-unavailable')
    const rules = await api(`/rules/branches/${policy.baseBranch}`)
    if (!requiredGateConfigured(rules)) return result(false, 'required-gates-not-configured')
    const statuses = await pages(api, `/commits/${sha}/statuses`)
    const status = statuses.find(item => item.context === policy.statusContext)
    if (status?.state !== 'success' || status.creator?.login !== 'github-actions[bot]'
      || status.description !== `daily-preview-ok:pr-${number}:run-${source.id}:attempt-${source.run_attempt}`) return result(false, 'missing-current-preview-gate')
    const finalPr = await api(`/pulls/${number}`)
    if (finalPr.head?.sha !== sha) return result(false, 'head-moved')
    const finalDecision = eligibility(finalPr, files)
    if (!finalDecision.eligible) {
      await post('failure', finalDecision.reason)
      return finalDecision
    }
    if ((await api(`/git/ref/heads/${policy.baseBranch}`)).object?.sha !== mainSha) {
      await post('failure', 'main-moved')
      return result(false, 'main-moved')
    }
    await merge(number, sha)
    const after = await api(`/pulls/${number}`)
    if (after.merged === true) return result(true, 'merged', { pr: number, sha, mergeSha: after.merge_commit_sha })
    if (after.auto_merge) return result(true, 'auto-merge-enabled', { pr: number, sha })
    throw new Error('merge-result-unconfirmed')
  } catch (error) {
    // Do not turn an API failure or missing permission into a successful policy decision.
    await post('error', 'gate-error: inspect trusted workflow logs').catch(() => {})
    throw error
  }
}

async function main() {
  const mode = process.argv[2]
  const env = process.env
  const event = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8'))
  const output = await runGate({ mode, event, env, api: githubClient(env.GH_TOKEN), merge: (number, sha) => {
    // Never use GITHUB_TOKEN here: it can suppress the main push -> Site Build event.
    execFileSync('gh', ['pr', 'merge', String(number), '--repo', policy.repository, '--auto', '--squash', '--match-head-commit', sha], {
      stdio: 'inherit', env: { ...env, GH_TOKEN: env.ORBIS_AUTO_MERGE_TOKEN },
    })
  } })
  console.log(JSON.stringify(output))
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `eligible=${output.eligible}\nreason=${output.reason}\n`)
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `### Scheduled Daily Auto Merge\n\nOutcome: \`${output.reason}\`\n\nPR: ${output.pr ?? 'not eligible'}; head: ${output.sha ?? 'not eligible'}.\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
