import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  assessRetentionPosture,
  publishImmutableObject,
  readImmutableObject
} from '../src/index.js'

export async function runRetentionTests() {
  await testPublishedObjectDefaultsToEphemeralPrunable()
  await testPinnedReadyObjectIsNotPrunable()
}

async function testPublishedObjectDefaultsToEphemeralPrunable() {
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-retention-publish-'))
  const payload = Buffer.from('phase-6-retention-publish')

  try {
    const published = await publishImmutableObject({
      storage,
      bytes: payload,
      descriptor: {
        contentType: 'application/octet-stream',
        size: payload.length,
        encoding: 'binary',
        materializationHints: {}
      }
    })

    assert.deepEqual(assessRetentionPosture({
      lifecycle: published.object.lifecycle
    }), {
      pinned: false,
      ephemeral: true,
      stale: false,
      prunable: true
    })
  } finally {
    await rm(storage, { recursive: true, force: true })
  }
}

async function testPinnedReadyObjectIsNotPrunable() {
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-retention-read-'))
  const payload = Buffer.from('phase-6-retention-read')

  try {
    const published = await publishImmutableObject({
      storage,
      bytes: payload,
      descriptor: {
        contentType: 'application/octet-stream',
        size: payload.length,
        encoding: 'binary',
        materializationHints: {}
      }
    })

    const readBack = await readImmutableObject({
      storage,
      reference: published.reference,
      as: 'buffer'
    })

    assert.deepEqual(assessRetentionPosture({
      lifecycle: readBack.lifecycle,
      pinned: true,
      stale: true
    }), {
      pinned: true,
      ephemeral: false,
      stale: true,
      prunable: false
    })
  } finally {
    await rm(storage, { recursive: true, force: true })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runRetentionTests().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
