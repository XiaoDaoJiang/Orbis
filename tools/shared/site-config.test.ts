import assert from 'node:assert/strict'
import { absoluteSiteUrl, normalizeBasePath, normalizeSiteOrigin, validateSiteConfig } from './site-config-contract.ts'

const valid = {
  version: 1,
  site: { name: 'Orbis', origin: 'https://example.com', basePath: '/Orbis', locale: 'zh-CN', defaultTitle: 'Orbis', defaultDescription: 'Orbis description', defaultSocialImage: '/social/default.png', brandName: 'Orbis' },
  content: { briefsDir: 'content/briefs', presentationsDir: 'content/presentations' },
  presentation: { generatedDir: 'apps/slides/generated', outputDir: 'dist/slides', publicPath: 'slides' },
  preview: { provider: 'raw.githack', origin: 'https://raw.githack.com', repositoryPath: '/owner/Orbis', branchPrefix: 'preview-pr-' },
}
assert.deepEqual(validateSiteConfig(valid), valid)
for (const basePath of ['', '/', '/Orbis/']) {
  assert.equal(validateSiteConfig({ ...valid, site: { ...valid.site, basePath } }).site.basePath, basePath)
}
assert.equal(normalizeBasePath('/Orbis/'), '/Orbis')
assert.equal(absoluteSiteUrl('https://example.com/', '/', '/slides/'), 'https://example.com/slides/')
assert.equal(absoluteSiteUrl('https://example.com', '/Orbis', '/slides/'), 'https://example.com/Orbis/slides/')
for (const value of [null, [], 1, 'config', {}, { ...valid, version: 2 }, { ...valid, typo: true }, { ...valid, site: { ...valid.site, defaultTitle: 42 } }]) {
  assert.throws(() => validateSiteConfig(value))
}
for (const origin of ['file:///tmp', 'ftp://example.com', '/relative', 'https://user:password@example.com', 'https://example.com/path', 'https://example.com?query', 'https://example.com#hash', ' https://example.com']) {
  assert.throws(() => normalizeSiteOrigin(origin))
}
for (const path of ['https://example.com', '//example.com', '/Orbis/../secret', '/Orbis/%2e%2e', '/Orbis/%252e%252e', '/Orbis/%2fsecret', '/Orbis\\secret', '/Orbis?query', '/Orbis#hash', '/Orbis//slides', '/bad%ZZ']) {
  assert.throws(() => normalizeBasePath(path), path)
}
for (const outputDir of ['.', '..', '../dist', '/tmp/slides', 'C:/slides', 'C:\\slides', '\\\\server\\share', 'dist/../content', 'dist', 'content/briefs', 'dist/web', 'dist/web/sub', 'dist/SITE', 'dist/slides/CON', 'dist/slides/ending.', 'dist/slides/ending ']) {
  assert.throws(() => validateSiteConfig({ ...valid, presentation: { ...valid.presentation, outputDir } }), outputDir)
}
assert.throws(() => validateSiteConfig({ ...valid, presentation: { ...valid.presentation, generatedDir: 'apps/slides' } }), /generatedDir/)
assert.throws(() => validateSiteConfig({ ...valid, content: { ...valid.content, presentationsDir: 'content/briefs/nested' } }), /non-overlapping/)
assert.throws(() => validateSiteConfig({ ...valid, preview: { ...valid.preview, provider: null } }), /provider/)
assert.throws(() => validateSiteConfig({ ...valid, preview: { ...valid.preview, branchPrefix: 'preview/../' } }), /branchPrefix/)
console.log('Site configuration contracts passed: schema, root hosting, URL overrides and safe portable output paths')
