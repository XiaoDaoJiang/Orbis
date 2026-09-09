import assert from 'node:assert/strict'
import { validateToolchain } from './toolchain.ts'

const manifest = { packageManager: 'pnpm@11.24.0', engines: { node: '>=22.13.0' } }
for (const node of ['22.13.0', '22.16.0', '24.16.0']) validateToolchain(manifest, node, '11.24.0')
for (const node of ['20.19.0', '22.12.9']) assert.throws(() => validateToolchain(manifest, node, '11.24.0'), /does not satisfy/)
assert.throws(() => validateToolchain(manifest, '24.16.0-rc.1', '11.24.0'), /stable Node/)
assert.throws(() => validateToolchain(manifest, '24.16.0', '12.0.0'), /Expected pnpm 11.24.0/)
assert.throws(() => validateToolchain({ ...manifest, packageManager: 'pnpm@latest' }, '24.16.0', '11.24.0'), /exact pnpm/)
assert.throws(() => validateToolchain({ ...manifest, engines: { node: '^24' } }, '24.16.0', '11.24.0'), /Unsupported engines/)
console.log('Toolchain version contracts passed')
