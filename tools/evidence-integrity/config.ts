import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse } from 'yaml'

type EvidenceIntegrityConfigSource = {
  version?: unknown
  legacyDailyPaths?: unknown
}

export type EvidenceIntegrityConfig = {
  version: 1
  legacyDailyPaths: ReadonlySet<string>
}

export async function loadEvidenceIntegrityConfig(root: string): Promise<EvidenceIntegrityConfig> {
  const path = resolve(root, 'config/evidence-integrity.yaml')
  const source = parse(await readFile(path, 'utf8')) as EvidenceIntegrityConfigSource

  if (source.version !== 1) {
    throw new Error('Evidence Integrity config requires version: 1')
  }
  if (!Array.isArray(source.legacyDailyPaths)) {
    throw new Error('Evidence Integrity config requires legacyDailyPaths[]')
  }

  const legacyDailyPaths = source.legacyDailyPaths.map((value, index) => {
    if (typeof value !== 'string' || !/^content\/briefs\/\d{4}-\d{2}-\d{2}\.ya?ml$/.test(value)) {
      throw new Error(`Invalid legacyDailyPaths[${index}]: ${String(value)}`)
    }
    return value
  })

  if (new Set(legacyDailyPaths).size !== legacyDailyPaths.length) {
    throw new Error('Evidence Integrity legacyDailyPaths must be unique')
  }

  return {
    version: 1,
    legacyDailyPaths: new Set(legacyDailyPaths),
  }
}
