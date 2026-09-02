export type KnowledgeEditorialStatus = 'draft' | 'published' | 'active' | 'needs-review' | 'archived'
export type ReviewHealth = 'current' | 'due-soon' | 'overdue'

export type ReviewEvaluationInput = {
  status: KnowledgeEditorialStatus
  reviewAt?: string
  today: string
  dueSoonDays?: number
}

export type ReviewEvaluation = {
  status: KnowledgeEditorialStatus
  reviewHealth: ReviewHealth
  daysUntilReview: number | null
}

export type KnowledgeReplacementEdge = {
  id: string
  supersededBy?: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 24 * 60 * 60 * 1000

function utcDay(date: string): number {
  if (!ISO_DATE.test(date)) {
    throw new Error(`Expected YYYY-MM-DD, received ${date}`)
  }

  const parsed = Date.parse(`${date}T00:00:00Z`)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid calendar date: ${date}`)
  }

  const normalized = new Date(parsed).toISOString().slice(0, 10)
  if (normalized !== date) {
    throw new Error(`Invalid calendar date: ${date}`)
  }

  return parsed
}

export function evaluateReviewHealth(input: ReviewEvaluationInput): ReviewEvaluation {
  const dueSoonDays = input.dueSoonDays ?? 14
  if (!Number.isInteger(dueSoonDays) || dueSoonDays < 0) {
    throw new Error('dueSoonDays must be a non-negative integer')
  }

  const today = utcDay(input.today)

  if (!input.reviewAt) {
    return {
      status: input.status,
      reviewHealth: 'current',
      daysUntilReview: null,
    }
  }

  const reviewAt = utcDay(input.reviewAt)
  const daysUntilReview = Math.round((reviewAt - today) / DAY_MS)

  return {
    status: input.status,
    reviewHealth: daysUntilReview < 0
      ? 'overdue'
      : daysUntilReview <= dueSoonDays
        ? 'due-soon'
        : 'current',
    daysUntilReview,
  }
}

export function deriveSupersedes(entries: KnowledgeReplacementEdge[]): Map<string, string[]> {
  const inverse = new Map<string, string[]>()

  for (const entry of entries) {
    if (!entry.supersededBy) continue
    const ids = inverse.get(entry.supersededBy) ?? []
    ids.push(entry.id)
    inverse.set(entry.supersededBy, ids)
  }

  for (const [target, ids] of inverse) {
    inverse.set(target, [...ids].sort((left, right) => left.localeCompare(right)))
  }

  return inverse
}
