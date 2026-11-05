// Slidev's supported setup hook receives and returns the complete shortcut list.
// Keep navigation intact; appearance has one three-state source of truth.
export default function setupShortcuts<T extends { name?: string }>(_nav: unknown, shortcuts: T[]): T[] {
  return shortcuts.filter((shortcut) => shortcut.name !== 'toggle_dark')
}
