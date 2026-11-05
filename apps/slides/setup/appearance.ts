/** Generated decks only. Never write Slidev's private storage directly. */
export function syncSlidevAppearance(dark: { value: boolean }, theme: string | undefined) {
  const expected = theme === 'dark'
  if (dark.value !== expected) dark.value = expected
}

export function createSlidevAppearanceBridge(options: {
  dark: { value: boolean }
  theme: () => string | undefined
  setAppearance: (mode: 'light' | 'dark') => void
  afterUpdate: () => Promise<unknown>
}) {
  let generation = 0
  let applyingOrbis = false
  let disposed = false

  const fromOrbis = async () => {
    const current = ++generation
    applyingOrbis = true
    // The bootstrap's media listener can run before Slidev's. Wait for Vue to
    // finish resolving its own `auto` before applying an explicit Orbis mode.
    await options.afterUpdate()
    if (disposed || current !== generation) return
    syncSlidevAppearance(options.dark, options.theme())
    await options.afterUpdate()
    if (current === generation) applyingOrbis = false
  }

  const fromExternal = (theme: 'light' | 'dark') => {
    if (!disposed && theme !== options.theme()) options.setAppearance(theme)
  }

  const fromSlidev = () => {
    if (disposed || applyingOrbis) return
    const theme = options.dark.value ? 'dark' : 'light'
    if (theme !== options.theme()) {
      // A native auto-theme deck (or Slidev's own controls) may change the shared
      // framework preference. Adopt its resolved choice instead of fighting it
      // across tabs. Only Orbis's three-state control selects "follow device".
      fromExternal(theme)
    }
  }

  return {
    fromOrbis,
    fromSlidev,
    fromExternal,
    dispose: () => { disposed = true; generation += 1 },
  }
}

/** Slidev 52.19.1 storage-event compatibility. Revalidate on framework upgrades;
 * this observes events only and never directly mutates the global storage key. */
export function themeFromSlidevStorage(key: string | null, value: string | null, preferredDark: boolean) {
  if (key !== 'slidev-color-schema') return undefined
  if (value === 'light' || value === 'dark') return value
  return value === 'auto' ? preferredDark ? 'dark' : 'light' : undefined
}
