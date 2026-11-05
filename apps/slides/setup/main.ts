import { useDarkMode } from '@slidev/client'
import type { App } from 'vue'
import { nextTick, watch } from 'vue'
import { createSlidevAppearanceBridge, themeFromSlidevStorage } from './appearance'

export default async function setupMain({ app }: { app: App }) {
  const { isDark } = useDarkMode()
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const appearance = (window as Window & {
    orbisAppearance?: {
      get: () => 'light' | 'dark' | 'system'
      set: (value: 'light' | 'dark') => void
    }
  }).orbisAppearance
  const bridge = createSlidevAppearanceBridge({
    dark: isDark,
    theme: () => {
      const mode = appearance?.get()
      // A background tab's DOM may lag behind its media state. Resolve the
      // current preference rather than accidentally converting system to dark.
      return mode === 'system' ? media.matches ? 'dark' : 'light' : mode ?? document.documentElement.dataset.theme
    },
    setAppearance: (mode) => appearance?.set(mode),
    // Distinct MediaQueryList callbacks can have microtask checkpoints between
    // them. Reconcile after that browser turn, not only after one Vue microtask.
    afterUpdate: async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
      await nextTick()
    },
  })
  const fromStorage = (event: StorageEvent) => {
    const theme = themeFromSlidevStorage(event.key, event.newValue, media.matches)
    // Do not lose a native user choice while an Orbis/media update is pending.
    if (theme) bridge.fromExternal(theme)
  }
  window.addEventListener('storage', fromStorage)
  window.addEventListener('orbis:appearance', bridge.fromOrbis)
  const stop = watch(isDark, bridge.fromSlidev, { flush: 'post' })
  app.onUnmount(() => {
    bridge.dispose()
    stop()
    window.removeEventListener('orbis:appearance', bridge.fromOrbis)
    window.removeEventListener('storage', fromStorage)
  })
  await bridge.fromOrbis()
}
