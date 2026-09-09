/** Interpret the repository's explicit >=x.y.z policy, not a partial general-purpose semver implementation. */
export function validateToolchain(manifest: { packageManager?: unknown; engines?: { node?: unknown } }, node: string, pnpm: string): void {
  const policy = manifest.engines?.node
  const minimum = typeof policy === 'string' ? /^>=(\d+)\.(\d+)\.(\d+)$/.exec(policy) : null
  if (!minimum) throw new Error('Unsupported engines.node policy; update the preflight contract when changing its syntax')
  const actual = /^(\d+)\.(\d+)\.(\d+)$/.exec(node)
  if (!actual) throw new Error(`Expected a stable Node.js version, received ${node}`)
  const wanted = minimum.slice(1).map(Number)
  const installed = actual.slice(1).map(Number)
  for (let index = 0; index < 3; index += 1) {
    if (installed[index] > wanted[index]) break
    if (installed[index] < wanted[index]) throw new Error(`Node.js ${node} does not satisfy ${policy}`)
  }
  const manager = manifest.packageManager
  const pin = typeof manager === 'string' ? /^pnpm@(\d+\.\d+\.\d+)(?:\+sha(?:224|256|384|512)\.[a-f0-9]+)?$/.exec(manager) : null
  if (!pin) throw new Error('packageManager must pin an exact pnpm version')
  if (pnpm !== pin[1]) throw new Error(`Expected pnpm ${pin[1]} from packageManager, received ${pnpm}; activate the pinned version before building`)
}
