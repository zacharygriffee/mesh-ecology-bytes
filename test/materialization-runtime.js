import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  materializeImmutableObject,
  publishImmutableObject,
  resolveMaterializationPlan
} from '../src/index.js'

export async function runMaterializationRuntimeTests() {
  await testResolveMaterializationPlan()
  await testStreamMaterialization()
  await testCacheMaterialization()
  await testMirrorMaterializationWithFilenameOverride()
  await testDestinationRequiredForFileModes()
}

async function testResolveMaterializationPlan() {
  const descriptor = {
    contentType: 'application/octet-stream',
    size: 3,
    encoding: 'binary',
    materializationHints: {
      preferredMode: 'cache',
      placementClass: 'artifact_cache',
      visibility: 'internal',
      filenameHint: 'hint.bin'
    }
  }

  const plan = resolveMaterializationPlan({
    descriptor,
    request: {
      reference: {
        family: 'hypercore_immutable',
        key: 'a'.repeat(64)
      },
      mode: 'mirror',
      targetClass: 'runtime_input',
      filenameOverride: 'override.bin'
    }
  })

  assert.deepEqual(plan, {
    mode: 'mirror',
    placementClass: 'artifact_cache',
    targetClass: 'runtime_input',
    visibility: 'internal',
    filename: 'override.bin'
  })
}

async function testStreamMaterialization() {
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-stream-'))
  const payload = Buffer.from('stream-materialization')

  try {
    const published = await publishFixture(storage, payload)
    const materialized = await materializeImmutableObject({
      storage,
      reference: published.reference,
      request: {
        mode: 'stream'
      }
    })

    const streamed = await collectStream(materialized.stream)

    assert.deepEqual(streamed, payload)
    assert.equal(materialized.plan.mode, 'stream')
    assert.equal(materialized.plan.filename, 'payload.bin')
    assert.deepEqual(materialized.lifecycle, {
      fetched: true,
      complete: true,
      materialized: false,
      ready: false,
      state: 'complete'
    })
  } finally {
    await rm(storage, { recursive: true, force: true })
  }
}

async function testCacheMaterialization() {
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-cache-'))
  const destinationRoot = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-cache-target-'))
  const payload = Buffer.from('cache-materialization')

  try {
    const published = await publishFixture(storage, payload)
    const destination = path.join(destinationRoot, 'cache.bin')
    const materialized = await materializeImmutableObject({
      storage,
      reference: published.reference,
      request: {
        mode: 'cache',
        targetClass: 'artifact_cache'
      },
      destination
    })

    const written = await readFile(destination)

    assert.deepEqual(written, payload)
    assert.equal(materialized.plan.mode, 'cache')
    assert.equal(materialized.destination, path.resolve(destination))
    assert.equal(materialized.bytesWritten, payload.length)
    assert.deepEqual(materialized.lifecycle, {
      fetched: true,
      complete: true,
      materialized: true,
      ready: true,
      state: 'ready'
    })
  } finally {
    await Promise.allSettled([
      rm(storage, { recursive: true, force: true }),
      rm(destinationRoot, { recursive: true, force: true })
    ])
  }
}

async function testMirrorMaterializationWithFilenameOverride() {
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-mirror-'))
  const destinationRoot = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-mirror-target-'))
  const payload = Buffer.from('mirror-materialization')

  try {
    const published = await publishFixture(storage, payload)
    const destination = path.join(destinationRoot, 'mirror.bin')
    const materialized = await materializeImmutableObject({
      storage,
      reference: published.reference,
      request: {
        mode: 'mirror',
        filenameOverride: 'override.bin'
      },
      destination
    })

    const written = await readFile(destination)

    assert.deepEqual(written, payload)
    assert.equal(materialized.plan.mode, 'mirror')
    assert.equal(materialized.plan.filename, 'override.bin')
    assert.equal(materialized.lifecycle.ready, true)
  } finally {
    await Promise.allSettled([
      rm(storage, { recursive: true, force: true }),
      rm(destinationRoot, { recursive: true, force: true })
    ])
  }
}

async function testDestinationRequiredForFileModes() {
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-no-destination-'))
  const payload = Buffer.from('missing-destination')

  try {
    const published = await publishFixture(storage, payload)

    await assert.rejects(() => materializeImmutableObject({
      storage,
      reference: published.reference,
      request: {
        mode: 'cache'
      }
    }))
  } finally {
    await rm(storage, { recursive: true, force: true })
  }
}

async function publishFixture(storage, payload) {
  return publishImmutableObject({
    storage,
    bytes: payload,
    descriptor: {
      contentType: 'application/octet-stream',
      size: payload.length,
      encoding: 'binary',
      materializationHints: {
        preferredMode: 'cache',
        visibility: 'internal',
        placementClass: 'artifact_cache',
        filenameHint: 'payload.bin'
      },
      integrityHint: {
        algorithm: 'sha256',
        value: createHash('sha256').update(payload).digest('hex')
      }
    }
  })
}

async function collectStream(stream) {
  const chunks = []

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }

  return Buffer.concat(chunks)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMaterializationRuntimeTests().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
