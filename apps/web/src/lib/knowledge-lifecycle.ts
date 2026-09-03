import {
  deriveSupersedes,
  evaluateReviewHealth,
  type KnowledgeEditorialStatus,
} from '../../../../tools/knowledge-lifecycle/lifecycle.ts'

export type KnowledgeLifecycleInput = {
  id: string
  status: KnowledgeEditorialStatus
  reviewAt?: string
  supersededBy?: string
}

export type KnowledgeLifecycleView<T extends KnowledgeLifecycleInput = KnowledgeLifecycleInput> = T & {
  reviewHealth: 'current' | 'due-soon' | 'overdue'
  daysUntilReview: number | null
  addressable: boolean
  currentDiscovery: boolean
  replacementId?: string
  supersedes: string[]
}

export function resolveKnowledgeEvaluationDate(override?: string): string {
  const date = override ?? process.env.KNOWLEDGE_EVALUATION_DATE ?? new Date().toISOString().slice(0, 10)
  evaluateReviewHealth({ status: 'active', today: date })
  return date
}

export function isKnowledgeAddressable(status: KnowledgeEditorialStatus): boolean {
  return status !== 'draft'
}

export function isKnowledgeCurrentDiscovery(status: KnowledgeEditorialStatus): boolean {
  return status === 'published' || status === 'active'
}

export function buildKnowledgeLifecycleViews<T extends KnowledgeLifecycleInput>(
  entries: readonly T[],
  evaluationDate = resolveKnowledgeEvaluationDate(),
): Array<KnowledgeLifecycleView<T>> {
  const today = resolveKnowledgeEvaluationDate(evaluationDate)
  const inverse = deriveSupersedes(entries.map((entry) => ({
    id: entry.id,
    supersededBy: entry.supersededBy,
  })))

  return entries.map((entry) => {
    const evaluation = evaluateReviewHealth({
      status: entry.status,
      reviewAt: entry.reviewAt,
      today,
    })

    return {
      ...entry,
      reviewHealth: evaluation.reviewHealth,
      daysUntilReview: evaluation.daysUntilReview,
      addressable: isKnowledgeAddressable(entry.status),
      currentDiscovery: isKnowledgeCurrentDiscovery(entry.status),
      replacementId: entry.supersededBy,
      supersedes: inverse.get(entry.id) ?? [],
    }
  })
}
