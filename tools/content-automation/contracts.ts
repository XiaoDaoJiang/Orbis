export type DailyAutomationOutcome =
  | 'candidate-created'
  | 'candidate-updated'
  | 'already-published'
  | 'blocked'
  | 'failed'

export type AutomationCheckResult = 'passed' | 'failed' | 'not-run'

export type AutomationFailureStage =
  | 'discovery'
  | 'verification'
  | 'generation'
  | 'schema'
  | 'guard'
  | 'git'
  | 'pr'
  | 'preview'

export type DailyAutomationReport = {
  version: 1
  kind: 'daily'
  targetDate: string
  branch: string
  contentPath: string
  outcome: DailyAutomationOutcome
  sourceCount: number
  primarySourceCount: number
  validation: AutomationCheckResult
  fullBuild: AutomationCheckResult
  unverified: string[]
  failureStage?: AutomationFailureStage
}

export type DailyTarget = {
  targetDate: string
  contentPath: string
  branch: string
}
