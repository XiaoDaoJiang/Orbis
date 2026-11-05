import type { DailyAutomationReport, DailyTarget } from './contracts.ts'

export function assertTargetDate(targetDate: string): string
export function resolveDailyTarget(targetDate: string): DailyTarget
export function assertDailyAutomationReport(source: unknown): DailyAutomationReport
export function renderDailyAutomationPrMetadata(source: unknown): { title: string; body: string }
export function parseDailyAutomationReport(body: unknown): DailyAutomationReport | null
