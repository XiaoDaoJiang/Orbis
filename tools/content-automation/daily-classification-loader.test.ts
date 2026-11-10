import assert from 'node:assert/strict'
import { mkdtemp, mkdir, symlink, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadTopicRegistry } from './daily-classification.ts'
const directory = await mkdtemp(join(tmpdir(), 'orbis-topic-registry-'))
const yaml = 'name: Agent\ndescription: A valid topic description\nstatus: active\naliases: [harness]\n'
try {
  await assert.rejects(loadTopicRegistry(join(directory, 'absent')))
  await assert.rejects(loadTopicRegistry(directory))
  await writeFile(join(directory, 'agent.yaml'), yaml)
  assert.equal((await loadTopicRegistry(directory))[0].id, 'agent')
  await mkdir(join(directory, 'nested'))
  await writeFile(join(directory, 'nested', 'other-topic.yaml'), yaml)
  await assert.rejects(loadTopicRegistry(directory), /flat regular files/)
  await rm(join(directory, 'nested'), { recursive: true })
  await symlink(join(directory, 'agent.yaml'), join(directory, 'linked-topic.yaml'))
  await assert.rejects(loadTopicRegistry(directory), /flat regular files/)
  await rm(join(directory, 'linked-topic.yaml'))
  await writeFile(join(directory, 'agent.yml'), yaml)
  await assert.rejects(loadTopicRegistry(directory), /duplicate identity/)
  await rm(join(directory, 'agent.yml'))
  await writeFile(join(directory, 'bad.yaml'), 'name: [broken\n')
  await assert.rejects(loadTopicRegistry(directory))
  await writeFile(join(directory, 'bad.yaml'), `${yaml}unexpected: true\n`)
  await assert.rejects(loadTopicRegistry(directory))
  await writeFile(join(directory, 'bad.yaml'), 'name: Agent\nstatus: active\n')
  await assert.rejects(loadTopicRegistry(directory))
} finally {
  await rm(directory, { recursive: true, force: true })
}
console.log('Topic classification loader checks passed')
