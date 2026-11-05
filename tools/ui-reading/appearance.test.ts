import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'
import { readFile } from 'node:fs/promises'
import { appearanceBootstrap } from '../../packages/design-tokens/src/appearance.ts'

function harness(saved: unknown, dark: boolean, blocked = false, writeBlocked = false) {
  const handlers: Record<string, Array<(event: any) => void>> = {}
  let stored = saved
  const root = { dataset: {} as Record<string, string>, style: {} as Record<string, string> }
  const control = { value: '', addEventListener: (_: string, callback: () => void) => { change = callback } }
  let change = () => {}
  const group = { hidden: true }
  const media = { matches: dark, addEventListener: (_: string, callback: () => void) => { flip = callback } }
  let flip = () => {}
  const window: any = { matchMedia: () => media, addEventListener: (name: string, callback: (e: any) => void) => { (handlers[name] ??= []).push(callback) }, dispatchEvent: (event: any) => { for (const fn of handlers[event.type] ?? []) fn(event) } }
  const document = { documentElement: root, readyState: 'loading', querySelectorAll: (selector: string) => selector === '[data-appearance-select]' ? [control] : [group], addEventListener: (name: string, callback: () => void) => { (handlers[name] ??= []).push(callback) } }
  const localStorage = { getItem: () => { if (blocked) throw Error('blocked'); return stored }, setItem: (_: string, value: string) => { if (blocked || writeBlocked) throw Error('blocked'); stored = value } }
  class CustomEvent { constructor(public type: string, public options: any) {} }
  runInNewContext(appearanceBootstrap, { window, document, localStorage, CustomEvent })
  const emit = (name: string, event: any = {}) => { for (const fn of handlers[name] ?? []) fn(event) }
  return { root, control, group, window, emit, stored: () => stored, write: (value: unknown) => { stored = value }, choose: (value: string) => { control.value = value; change() }, device: (value: boolean) => { media.matches = value; flip() } }
}
for (const saved of [undefined, null, '', 'invalid', 'system', 'light', 'dark']) {
  for (const dark of [false, true]) {
    const h = harness(saved, dark)
    const mode = saved === 'light' || saved === 'dark' ? saved : 'system'
    assert.equal(h.root.dataset.appearance, mode)
    assert.equal(h.root.dataset.theme, mode === 'system' ? (dark ? 'dark' : 'light') : mode)
    assert.equal(h.group.hidden, true)
    h.emit('DOMContentLoaded')
    assert.equal(h.group.hidden, false)
    for (const choice of ['light', 'dark', 'system']) {
      h.choose(choice)
      assert.equal(h.stored(), choice)
      for (const preference of [false, true, false]) {
        h.device(preference)
        assert.equal(h.root.dataset.appearance, choice)
        assert.equal(h.root.dataset.theme, choice === 'system' ? (preference ? 'dark' : 'light') : choice)
      }
    }
    h.write('dark'); h.emit('storage', { key: 'unrelated' }); assert.equal(h.root.dataset.appearance, 'system')
    h.emit('storage', { key: 'orbis:appearance:v1' }); assert.equal(h.root.dataset.theme, 'dark'); assert.equal(h.control.value, 'dark')
    h.write('light'); h.emit('pageshow', { persisted: true }); assert.equal(h.root.dataset.theme, 'light')
    h.write(null); h.emit('storage', { key: null }); assert.equal(h.root.dataset.appearance, 'system')
  }
}
const blocked = harness('dark', false, true)
assert.equal(blocked.root.dataset.appearance, 'system')
blocked.emit('DOMContentLoaded'); blocked.choose('dark'); blocked.device(false)
assert.equal(blocked.root.dataset.theme, 'dark')
blocked.emit('pageshow', { persisted: true }); assert.equal(blocked.root.dataset.theme, 'dark')
const quota = harness('light', false, false, true)
quota.emit('DOMContentLoaded'); quota.choose('dark'); quota.emit('pageshow', { persisted: true })
assert.equal(quota.root.dataset.theme, 'dark', 'A rejected write must not revert the page when restored from bfcache')
const css = await readFile(new URL('../../packages/design-tokens/src/appearance.css', import.meta.url), 'utf8')
assert.match(css, /@media \(prefers-color-scheme: dark\)/)
assert.match(css, /:root:not\(\[data-theme\]\)/)
assert.match(css, /@media print/)
const layout = await readFile(new URL('../../apps/web/src/layouts/BaseLayout.astro', import.meta.url), 'utf8')
assert.ok(layout.indexOf('set:html={appearanceBootstrap}') < layout.indexOf('<title>'), 'Appearance bootstrap must be in the head, not deferred to hydration')
console.log('Appearance bootstrap: valid/invalid storage, first paint, 3 modes, device changes, cross-tab, bfcache, blocked storage and CSS fallback contracts passed')
function contrast(a: string, b: string) {
  const luminance = (hex: string) => {
    const c = hex.replace('#', '').match(/../g)!.map((part) => parseInt(part, 16) / 255).map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    return c[0] * .2126 + c[1] * .7152 + c[2] * .0722
  }
  const x = luminance(a), y = luminance(b)
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05)
}
for (const selector of [':root', ':root[data-theme="dark"]']) {
  const start = css.indexOf(`${selector} {`)
  const block = css.slice(start, css.indexOf('}', start))
  const tokens = Object.fromEntries([...block.matchAll(/(--ui-[\w-]+): (#[\da-f]{6});/g)].map((m) => [m[1], m[2]]))
  for (const foreground of ['text', 'muted', 'accent', 'copper']) {
    for (const background of ['bg', 'surface']) assert.ok(contrast(tokens[`--ui-${foreground}`], tokens[`--ui-${background}`]) >= 4.5, `${selector} ${foreground}/${background} must meet 4.5:1`)
  }
  assert.ok(contrast(tokens['--ui-accent-ink'], tokens['--ui-accent']) >= 4.5, `${selector} primary CTA`)
  assert.ok(contrast(tokens['--ui-tag-text'], tokens['--ui-tag-bg']) >= 4.5, `${selector} tag`)
  for (const surface of ['bg', 'surface']) assert.ok(contrast(tokens['--ui-control-line'], tokens[`--ui-${surface}`]) >= 3, `${selector} control border`)
}
console.log('Light and dark text, links, metadata, tags, primary buttons and control borders passed contrast thresholds')
