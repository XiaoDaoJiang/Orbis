import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createSlidevAppearanceBridge, themeFromSlidevStorage } from '../../apps/slides/setup/appearance.ts'
import { renderPresentationAppearance } from '../generate-slides/appearance.ts'
import { discoverPresentationDescriptors } from '../generate-slides/discover-presentations.ts'
import { renderPresentation } from '../../apps/slides/templates/registry.ts'
import { loadSiteConfig } from '../shared/site-config.ts'

const root = resolve(import.meta.dirname, '../..')
const slidesManifest = JSON.parse(await readFile(resolve(root, 'apps/slides/package.json'), 'utf8'))
assert.equal(slidesManifest.dependencies['@slidev/cli'], '52.19.1', 'Revalidate the framework storage-event adapter before upgrading Slidev')
const require = createRequire(resolve(root, 'apps/slides/package.json'))
const { computed, ref, watch, nextTick } = require('vue')

// Exercise the pinned public-ref contract with two independent Vue stores and
// browser-style storage delivery. Unlike one shared ref, this exposes a generated
// deck writing back against a native auto-theme deck in another window.
for (const scheduler of ['microtask', 'browser-turn'] as const) {
  const afterUpdate = async () => {
    if (scheduler === 'browser-turn') await new Promise<void>((done) => setTimeout(done, 0))
    await nextTick()
  }
  for (const initialMode of ['light', 'dark', 'system'] as const) {
    for (const initialDevice of [false, true]) {
      for (const initialSlidev of ['auto', 'light', 'dark']) {
        const device = ref(initialDevice)
        const generatedStore = ref(initialSlidev)
        const nativeStore = ref(initialSlidev)
        let writes = 0
        let bridge: ReturnType<typeof createSlidevAppearanceBridge>
        const makeDark = (own: typeof generatedStore, other: typeof nativeStore) => computed({
          get: () => own.value === 'auto' ? device.value : own.value === 'dark',
          set: (value: boolean) => {
            const next = value === device.value ? 'auto' : value ? 'dark' : 'light'
            if (next === own.value) return
            own.value = next
            writes += 1
            // Native storage delivery updates the other window's VueUse ref.
            const deliver = () => {
              other.value = next
              if (other === generatedStore) {
                const externalTheme = themeFromSlidevStorage('slidev-color-schema', next, device.value)
                if (externalTheme) bridge.fromExternal(externalTheme)
              }
            }
            if (scheduler === 'browser-turn') setTimeout(deliver, 0)
            else queueMicrotask(deliver)
          },
        })
        const generatedDark = makeDark(generatedStore, nativeStore)
        const nativeDark = makeDark(nativeStore, generatedStore)
        let mode: 'light' | 'dark' | 'system' = initialMode
        let resolved = mode === 'system' ? initialDevice ? 'dark' : 'light' : mode
        bridge = createSlidevAppearanceBridge({
          dark: generatedDark,
          theme: () => mode === 'system' ? device.value ? 'dark' : 'light' : mode,
          setAppearance: (next) => {
            mode = next
            resolved = next
            void bridge.fromOrbis()
          },
          afterUpdate,
        })
        const stop = watch(generatedDark, bridge.fromSlidev, { flush: 'post' })
        const settle = async () => { for (let tick = 0; tick < 8; tick += 1) await afterUpdate() }
        await bridge.fromOrbis()
        await settle()
        assert.equal(generatedDark.value, resolved === 'dark')
        for (const nextDevice of [!initialDevice, initialDevice, !initialDevice]) {
          resolved = mode === 'system' ? nextDevice ? 'dark' : 'light' : mode
          // Shared matchMedia fires before Slidev's own preferred-dark update.
          void bridge.fromOrbis()
          device.value = nextDevice
          await settle()
          assert.equal(mode, initialMode, 'Device changes must not rewrite the explicit three-state choice')
          assert.equal(generatedDark.value, resolved === 'dark')
        }
        if (mode === 'system') {
          // Background DOM/media listeners can lag behind another generated tab.
          // An `auto` event matching the live system must not become explicit.
          device.value = !device.value
          const autoTheme = themeFromSlidevStorage('slidev-color-schema', 'auto', device.value)!
          bridge.fromExternal(autoTheme)
          assert.equal(mode, 'system')
          resolved = autoTheme
          await bridge.fromOrbis()
          await settle()
        }
        for (const nativeChoice of [!nativeDark.value, nativeDark.value]) {
          const beforeWrites = writes
          nativeDark.value = nativeChoice
          await settle()
          assert.equal(nativeDark.value, nativeChoice, 'Generated tab must not undo a native user toggle')
          assert.equal(generatedDark.value, nativeChoice)
          assert.equal(resolved, nativeChoice ? 'dark' : 'light')
          assert.equal(mode, nativeChoice ? 'dark' : 'light', 'Native binary toggle is an explicit site-wide choice, not system mode')
          assert.equal(writes - beforeWrites, 1, 'One native toggle must not trigger a framework write-back loop')
        }
        // A native user action arriving during a queued Orbis reconciliation
        // must supersede the older update, not be swallowed by the guard.
        const interruptedChoice = !nativeDark.value
        const beforeInterruptedWrites = writes
        void bridge.fromOrbis()
        nativeDark.value = interruptedChoice
        await settle()
        assert.equal(nativeDark.value, interruptedChoice)
        assert.equal(generatedDark.value, interruptedChoice)
        assert.equal(mode, interruptedChoice ? 'dark' : 'light')
        assert.equal(writes - beforeInterruptedWrites, 1)
        const explicitAfterNative = mode
        resolved = mode
        void bridge.fromOrbis()
        device.value = !device.value
        await settle()
        assert.equal(mode, explicitAfterNative)
        assert.equal(generatedDark.value, resolved === 'dark')
        stop()
        bridge.dispose()
      }
    }
  }

}

assert.equal(themeFromSlidevStorage('slidev-color-schema', 'auto', true), 'dark')
assert.equal(themeFromSlidevStorage('slidev-color-schema', 'auto', false), 'light')
assert.equal(themeFromSlidevStorage('unrelated', 'dark', false), undefined)
assert.equal(themeFromSlidevStorage(null, null, false), undefined)
assert.equal(themeFromSlidevStorage('slidev-color-schema', 'invalid', false), undefined)

const config = await loadSiteConfig()
const descriptors = await discoverPresentationDescriptors({ root, config, siteBase: '/Orbis' })
const kinds = new Set<string>()
for (const descriptor of descriptors) {
  if (descriptor.sourceKind === 'native') {
    assert.throws(() => renderPresentationAppearance(descriptor), /Native author themes/)
    continue
  }
  kinds.add(descriptor.template)
  const markdown = renderPresentation(descriptor, { siteBase: '/Orbis' })
  assert.match(markdown, /colorSchema: auto/)
  assert.match(markdown, /lang: zh-CN/)
  assert.doesNotMatch(markdown, /colorSchema: light/)
  const html = renderPresentationAppearance(descriptor)
  assert.match(html, /^<head>[\s\S]*<script data-orbis-appearance>/)
  assert.ok(html.indexOf('data-orbis-appearance') < html.indexOf('</head>'))
  assert.match(html, /<noscript>/)
  assert.match(html, /orbis:appearance:v1/)
  assert.doesNotMatch(html, /slidev-color-schema/, 'Do not replace an unrelated Slidev storage preference in the bootstrap')
  if (descriptor.readingUrl) {
    assert.ok(html.includes(`href="${descriptor.readingUrl}"`), 'No-JS fallback keeps a real reading link')
    assert.ok(html.includes(`<meta name="orbis:reading-url" content="${descriptor.readingUrl}">`), 'Outside-canvas reading control receives the real descriptor URL')
  } else {
    assert.ok(!html.includes('orbis:reading-url'), 'Do not invent reading routes for standalone talks')
  }
}
for (const template of ['daily-v1', 'weekly-v1', 'talk-v1']) assert.ok(kinds.has(template), `Missing ${template} coverage`)

const generator = await readFile(resolve(root, 'tools/generate-slides/index.ts'), 'utf8')
const nativeBranch = generator.split("if (descriptor.sourceKind === 'native') {")[1]?.split('} else {')[0]
assert.ok(nativeBranch)
assert.doesNotMatch(nativeBranch, /appearance|global-top|apps\/slides\/setup/, 'Native sources must remain free of generated appearance injection')
const main = await readFile(resolve(root, 'apps/slides/setup/main.ts'), 'utf8')
assert.match(main, /import \{ useDarkMode \} from '@slidev\/client'/)
assert.match(main, /export default async function setupMain/)
assert.match(main, /flush: 'post'/)
assert.doesNotMatch(main, /localStorage|configs\.colorSchema|@slidev\/client\//)
const shortcuts = await readFile(resolve(root, 'apps/slides/setup/shortcuts.ts'), 'utf8')
assert.match(shortcuts, /shortcut.name !== 'toggle_dark'/)
const css = await readFile(resolve(root, 'apps/slides/style.css'), 'utf8')
assert.match(css, /@orbis\/design-tokens\/appearance.css/)
assert.match(css, /--slidev-code-background: var\(--ui-subtle\)/)
assert.match(css, /prefers-reduced-motion/)
assert.match(css, /\.slidev-layout\.orbis-cover > p \{[^}]*color: var\(--ui-muted\);[^}]*opacity: 1 !important;/, 'Cover summaries must defeat the framework opacity rule, using an opaque accessible secondary color')
assert.match(css, /\.slidev-layout a \{ color: var\(--ui-accent\)/, 'Cover reading links keep their accent color')
assert.doesNotMatch(css, /background: var\(--orbis-cream\)|color: var\(--orbis-brown\)/)
const control = await readFile(resolve(root, 'apps/slides/global-top.vue'), 'utf8')
assert.match(control, /aria-label="演示外观"/)
assert.match(control, /@keydown.stop/)
assert.match(control, /<a v-if="readingUrl" :href="readingUrl" class="orbis-slide-reading"/, 'Mobile reading navigation remains a real anchor outside the scaled canvas')
assert.match(css, /\.orbis-slide-reading \{[^}]*min-height: 44px;/)
assert.match(css, /\.orbis-slide-tools \{[^}]*position: fixed;[^}]*left: max\(16px,[^}]*right: max\(16px,/)
assert.match(css, /\.orbis-slide-appearance \{ margin-left: auto;/)
assert.match(control, /<Teleport to="body">/, 'Touch controls must escape the scaled slide canvas')
for (const mode of ['light', 'dark', 'system']) assert.ok(control.includes(`value="${mode}"`))
const build = await readFile(resolve(root, 'tools/build-slides/index.ts'), 'utf8')
assert.match(build, /'--router-mode',\s*'hash'/)
console.log('Generated Slidev appearance passed: three states, device/storage changes, public API, native boundary, no-JS links and hash routing')
