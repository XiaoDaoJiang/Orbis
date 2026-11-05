<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useNav } from '@slidev/client'

const { isPrintMode } = useNav()
// Slidev 52 leaves html.print behind after SPA navigation away from /print.
// Reconcile it with the public route state for generated decks only.
watch(isPrintMode, (printing) => {
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('print', printing)
}, { immediate: true, flush: 'post' })

type Appearance = 'light' | 'dark' | 'system'
const appearance = () => (window as Window & {
  orbisAppearance?: { get: () => Appearance; set: (mode: Appearance) => void }
}).orbisAppearance
const mode = ref<Appearance>('system')
const ready = ref(false)
const readingUrl = ref('')
const sync = () => { mode.value = appearance()?.get() ?? 'system' }
function change(event: Event) {
  appearance()?.set((event.target as HTMLSelectElement).value as Appearance)
  sync()
}
onMounted(() => {
  readingUrl.value = document.querySelector<HTMLMetaElement>('meta[name="orbis:reading-url"]')?.content ?? ''
  sync()
  ready.value = Boolean(appearance())
  window.addEventListener('orbis:appearance', sync)
})
onUnmounted(() => window.removeEventListener('orbis:appearance', sync))
</script>

<template>
  <!-- Escape Slidev's scaled canvas so links and controls remain 44 CSS pixels. -->
  <Teleport to="body">
    <div v-if="ready || readingUrl" class="orbis-slide-tools">
      <a v-if="readingUrl" :href="readingUrl" class="orbis-slide-reading" @keydown.stop>阅读版 ↗</a>
      <label v-if="ready" class="orbis-slide-appearance">
        <span>外观</span>
        <select :value="mode" aria-label="演示外观" @change="change" @keydown.stop>
          <option value="light">浅色</option>
          <option value="dark">深色</option>
          <option value="system">跟随设备</option>
        </select>
      </label>
    </div>
  </Teleport>
</template>
