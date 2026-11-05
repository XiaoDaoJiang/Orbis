<script setup lang="ts">
import { lockShortcuts, onSlideLeave, useNav, useSlideContext } from '@slidev/client'
import { computed, onBeforeUnmount, onDeactivated, ref, useId, watch } from 'vue'

defineProps<{ title: string; label: string; readingHref?: string }>()

const { router, currentRoute, currentSlideNo, isPrintMode } = useNav()
const { $page, $renderContext } = useSlideContext()
const interactive = computed(() => !isPrintMode.value
  && currentRoute.value.name === 'play'
  && currentSlideNo.value === $page.value
  && $renderContext.value === 'slide')
let activeTrigger: HTMLButtonElement | undefined
const dialog = ref<HTMLDialogElement>()
const closeButton = ref<HTMLButtonElement>()
const scrollContent = ref<HTMLElement>()
const titleHeading = ref<HTMLElement>()
const expanded = ref(false)
const headingId = `orbis-detail-heading-${useId()}`
const dialogId = `orbis-detail-${useId()}`
let unlockShortcuts: (() => void) | undefined
let restoreFocus = true

function finishClose() {
  // A native close event can arrive after another open. Do not release its lock.
  if (dialog.value?.open) return
  expanded.value = false
  unlockShortcuts?.()
  unlockShortcuts = undefined
  if (restoreFocus && interactive.value && activeTrigger?.isConnected) activeTrigger.focus({ preventScroll: true })
}

function close(restore = true) {
  restoreFocus = restore
  if (dialog.value?.open) dialog.value.close()
  finishClose()
}

function open(event: MouseEvent) {
  if (!interactive.value || !dialog.value || dialog.value.open) return
  activeTrigger = event.currentTarget as HTMLButtonElement
  restoreFocus = true
  dialog.value.showModal()
  expanded.value = true
  unlockShortcuts = lockShortcuts()
  if (scrollContent.value) scrollContent.value.scrollTop = 0
  if (titleHeading.value) titleHeading.value.scrollTop = 0
  closeButton.value?.focus({ preventScroll: true })
}

// Native modal dialogs provide focus containment and background inertness.
// Stop keys reaching Slidev as well as locking its public shortcut API, so
// reading with arrows/Space/PageDown cannot advance the presentation.
function onKeydown(event: KeyboardEvent) {
  event.stopPropagation()
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

// Slidev 52's public useNav exposes Vue Router. Covers browser Back/Forward,
// remote navigation, presenter and overview routes, including reused slides.
const removeRouteHook = router.afterEach(() => close(false))
onSlideLeave(() => close(false))
watch(interactive, (active) => { if (!active) close(false) }, { flush: 'sync' })
onDeactivated(() => close(false))
onBeforeUnmount(() => {
  removeRouteHook()
  close(false)
})
</script>

<template>
  <button
    :disabled="!interactive"
    type="button"
    class="orbis-detail-trigger"
    aria-haspopup="dialog"
    :aria-controls="dialogId"
    :aria-expanded="expanded"
    @click.stop="open"
    @keydown.stop
    @keyup.stop
  >{{ label }}</button>
  <!-- Closed details take no canvas space. The top-layer dialog is unscaled. -->
  <Teleport v-if="interactive" to="body">
    <button
      v-if="interactive"
      type="button"
      class="orbis-detail-mobile-trigger"
      aria-haspopup="dialog"
      :aria-controls="dialogId"
      :aria-expanded="expanded"
      @click.stop="open"
      @keydown.stop
      @keyup.stop
    >{{ label }}</button>
    <dialog
      :id="dialogId"
      ref="dialog"
      class="orbis-detail-dialog"
      :aria-labelledby="headingId"
      @close="finishClose"
      @cancel.prevent="close()"
      @keydown="onKeydown"
      @keyup.stop
      @click.stop
    >
      <header class="orbis-detail-header">
        <div>
          <p class="orbis-detail-eyebrow">完整内容与来源</p>
          <h2 :id="headingId" ref="titleHeading" tabindex="0">{{ title }}</h2>
        </div>
        <button ref="closeButton" type="button" class="orbis-detail-close" autofocus @click="close()" aria-label="关闭详情">关闭 ×</button>
      </header>
      <div ref="scrollContent" class="orbis-detail-content" tabindex="0" role="region" aria-label="完整内容与来源">
        <slot />
        <footer v-if="readingHref" class="orbis-detail-footer">
          <a :href="readingHref">打开完整阅读版 ↗</a>
        </footer>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.orbis-detail-trigger, .orbis-detail-mobile-trigger {
  box-sizing: border-box;
  white-space: normal;
  overflow-wrap: anywhere;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 8px 14px;
  border: 1px solid var(--ui-control-line);
  border-radius: var(--ui-radius);
  background: var(--ui-surface);
  color: var(--ui-accent);
  font: 650 16px/1.5 var(--orbis-body);
  text-align: left;
  cursor: pointer;
}
.orbis-detail-mobile-trigger { display: none; }
.orbis-detail-trigger:disabled { pointer-events: none; }
/* Slidev 52 quick overview uses z-modal; leave its controls unobstructed. */
:global(body:has(.z-modal.left-0) .orbis-detail-mobile-trigger) { display: none; }
.orbis-detail-dialog {
  box-sizing: border-box;
  width: min(760px, calc(100vw - 32px));
  max-width: none;
  max-height: 85vh;
  max-height: 85svh;
  margin: auto;
  padding: 28px;
  overflow: hidden;
  border: 1px solid var(--ui-control-line);
  border-radius: var(--ui-radius);
  background: var(--ui-bg);
  color: var(--ui-text);
  font: 17px/1.75 var(--orbis-body);
  overflow-wrap: anywhere;
  text-align: left;
}
.orbis-detail-dialog[open] { display: flex; flex-direction: column; }
.orbis-detail-dialog::backdrop { background: rgb(0 0 0 / 60%); }
.orbis-detail-header { display: flex; flex: 0 0 auto; align-items: flex-start; justify-content: space-between; gap: 20px; padding-bottom: 16px; background: var(--ui-bg); }
.orbis-detail-header > div { min-width: 0; }
.orbis-detail-eyebrow { margin: 0 0 8px; color: var(--ui-muted); font-size: 14px; }
.orbis-detail-header h2 { margin: 0; max-height: min(120px, 20vh); max-height: min(120px, 20svh); overflow: auto; overscroll-behavior: contain; color: var(--ui-text); padding-bottom: 2px; font: 730 23px/34px var(--orbis-display); }
.orbis-detail-close {
  flex-shrink: 0;
  min-width: 72px;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--ui-control-line);
  border-radius: var(--ui-radius);
  background: var(--ui-surface);
  color: var(--ui-text);
  font: 600 16px/1.5 var(--orbis-body);
  cursor: pointer;
}
.orbis-detail-content { min-height: 0; flex: 1 1 auto; overflow: auto; overscroll-behavior: contain; scrollbar-gutter: stable; padding: 4px; }
.orbis-detail-content :deep(h3) { margin: 28px 0 10px; color: var(--ui-text); font: 700 19px/1.5 var(--orbis-display); }
.orbis-detail-content :deep(p) { margin: 0 0 14px; color: var(--ui-text); line-height: 1.75; }
.orbis-detail-content :deep(ol), .orbis-detail-content :deep(ul) { margin: 0; padding-left: 1.5em; }
.orbis-detail-content :deep(ol) { list-style: decimal; }
.orbis-detail-content :deep(ul) { list-style: disc; }
.orbis-detail-content :deep(li) { margin: 0 0 14px; padding-left: 4px; line-height: 1.75; }
.orbis-detail-content :deep(.detail-conclusion) { padding: 16px; border-left: 3px solid var(--ui-accent); background: var(--ui-surface); }
.orbis-detail-content :deep(.detail-limitations) { padding: 16px; border: 1px solid var(--ui-line); border-radius: var(--ui-radius); }
.orbis-detail-content :deep(.detail-limitations h3) { margin-top: 0; }
.orbis-detail-content :deep(a), .orbis-detail-footer a { color: var(--ui-accent); text-decoration: underline; text-underline-offset: .2em; }
.orbis-detail-footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid var(--ui-line); }
.orbis-detail-footer a { display: inline-flex; align-items: center; min-height: 44px; }
.orbis-detail-trigger:focus-visible, .orbis-detail-mobile-trigger:focus-visible, .orbis-detail-close:focus-visible, .orbis-detail-header h2:focus-visible, .orbis-detail-content:focus-visible, .orbis-detail-dialog :deep(a:focus-visible) { outline: 3px solid var(--ui-accent); outline-offset: 3px; }
@media (max-width: 980px), (max-height: 600px) {
  .orbis-detail-trigger { visibility: hidden; }
  .orbis-detail-mobile-trigger {
    display: inline-flex;
    position: fixed;
    z-index: 40;
    top: max(68px, calc(env(safe-area-inset-top) + 56px));
    left: max(16px, env(safe-area-inset-left));
    right: max(16px, env(safe-area-inset-right));
    width: fit-content;
    max-width: calc(100vw - 32px);
    min-height: 44px;
    padding-block: 4px;
    font-size: 14px;
    line-height: 1.5;
  }
}
/* Wide compact viewports have enough room between the reader and appearance
   controls for a single toolbar row, keeping the landscape canvas readable. */
@media (min-width: 641px) and (max-width: 980px), (min-width: 641px) and (max-height: 600px) {
  .orbis-detail-mobile-trigger {
    top: max(12px, env(safe-area-inset-top));
    left: max(112px, calc(env(safe-area-inset-left) + 112px));
    right: max(190px, calc(env(safe-area-inset-right) + 190px));
    width: auto;
    max-width: calc(100vw - 302px);
    justify-content: center;
  }
}
@media (max-width: 540px) {
  .orbis-detail-dialog { width: calc(100vw - 16px); padding: 18px; font-size: 16px; }
  .orbis-detail-header { gap: 12px; }
  .orbis-detail-header h2 { font-size: 23px; }
}
@media (max-height: 600px) {
  .orbis-detail-dialog { padding: 16px; }
  .orbis-detail-header { padding-bottom: 12px; }
  .orbis-detail-header h2 { font-size: 21px; line-height: 30px; }
}
@media print { .orbis-detail-trigger, .orbis-detail-mobile-trigger, .orbis-detail-dialog { display: none !important; } }
</style>
