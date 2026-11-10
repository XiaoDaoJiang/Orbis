/** Shared dependency-free label policy for schema and connector-only classification. */
export const MAX_OPEN_TAGS = 32
export const MAX_LABEL_LENGTH = 64
export function normalizeContentLabel(value) {
  if (typeof value !== 'string') throw new TypeError('Classification labels must be strings')
  // Reject invisible controls and markup rather than silently changing their meaning.
  if (/[\p{Cc}\p{Cf}<>]/u.test(value)) throw new Error('Classification label contains unsafe characters')
  const normalized = value.normalize('NFKC').replace(/\s+/gu, ' ').trim()
  if (!normalized || normalized.length > MAX_LABEL_LENGTH || /[\p{Cc}\p{Cf}<>]/u.test(normalized)) {
    throw new Error(`Classification labels must contain 1–${MAX_LABEL_LENGTH} safe characters`)
  }
  return normalized
}
export function contentLabelKey(value) {
  return normalizeContentLabel(value).toLowerCase()
}
