/** Shared dependency-free head bootstrap. Kept as source so build transforms cannot add external helpers. */
export const appearanceBootstrap = String.raw`(function () {
  const key = 'orbis:appearance:v1'
  const root = document.documentElement
  const normalize = (value) => value === 'light' || value === 'dark' ? value : 'system'
  const read = (fallback = 'system') => {
    try { return normalize(localStorage.getItem(key)) } catch { return fallback }
  }
  let mode = read()
  let persisted = true
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const render = () => {
    const theme = mode === 'system' ? (media.matches ? 'dark' : 'light') : mode
    root.dataset.appearance = mode
    root.dataset.theme = theme
    root.style.colorScheme = theme
    document.querySelectorAll('[data-appearance-select]').forEach((control) => { control.value = mode })
    window.dispatchEvent(new CustomEvent('orbis:appearance', { detail: { mode, theme } }))
  }
  const set = (value) => {
    mode = normalize(value)
    try { localStorage.setItem(key, mode); persisted = true } catch { persisted = false }
    document.querySelectorAll('[data-appearance-select]').forEach((control) => {
      control.title = persisted ? '' : '此浏览器无法保存外观，当前页面仍可切换。'
    })
    render()
  }
  Object.assign(window, { orbisAppearance: { get: () => mode, set } })
  render()
  const controls = () => {
    document.querySelectorAll('[data-appearance-control]').forEach((control) => { control.hidden = false })
    document.querySelectorAll('[data-appearance-select]').forEach((control) => {
      control.value = mode
      control.addEventListener('change', () => set(control.value))
    })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', controls, { once: true })
  else controls()
  media.addEventListener('change', render)
  window.addEventListener('storage', (event) => {
    if (event.key === key || event.key === null) { mode = read(mode); persisted = true; render() }
  })
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) { if (persisted) mode = read(mode); render() }
  })
})();`
