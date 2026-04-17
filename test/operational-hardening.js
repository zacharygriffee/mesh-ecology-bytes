import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import Hypercore from 'hypercore'
import createTestnet from 'hyperdht/testnet.js'

import {
  createByteReference,
  createHyperswarmTransport,
  fetchImmutableObject,
  isMeshBytesError,
  materializeImmutableObject,
  publishImmutableObject,
  readImmutableObject,
  serializeByteDescriptor
} from '../src/index.js'

export async function runOperationalHardeningTests() {
  await testReadRejectsIntegrityMismatch()
  await testFetchTimeoutWithoutPeers()
  await testReadRespectsAbortSignal()
  await testMaterializationWriteFailureIsWrapped()
}

async function testReadRejectsIntegrityMismatch() {
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-integrity-mismatch-'))

  try {
    const core = new Hypercore(storage, { valueEncoding: 'binary' })
    await core.ready()

    await core.append([
      serializeByteDescriptor({
        contentType: 'application/octet-stream',
        size: 8,
        encoding: 'binary',
        materializationHints: {}
      }),
      Buffer.from('short')
    ])

    const reference = createByteReference({
      family: 'hypercore_immutable',
      key: core.key.toString('hex')
    })

    await core.close()

    await assert.rejects(
      () => readImmutableObject({
        storage,
        reference,
        as: 'buffer'
      }),
      (error) => isMeshBytesError(error, 'ERR_INTEGRITY_MISMATCH')
    )
  } finally {
    await rm(storage, { recursive: true, force: true })
  }
}

async function testFetchTimeoutWithoutPeers() {
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-fetch-timeout-'))
  const testnet = await createTestnet(3)
  const transport = createHyperswarmTransport({
    swarmOptions: { dht: testnet.createNode() }
  })

  try {
    await assert.rejects(
      () => fetchImmutableObject({
        storage,
        reference: {
          family: 'hypercore_immutable',
          key: 'd'.repeat(64)
        },
        transport,
        timeoutMs: 100
      }),
      (error) => isMeshBytesError(error, 'ERR_OPERATION_TIMEOUT')
    )
  } finally {
    await Promise.allSettled([
      transport.close(),
      testnet.destroy(),
      rm(storage, { recursive: true, force: true })
    ])
  }
}

async function testReadRespectsAbortSignal() {
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-read-abort-'))
  const payload = Buffer.from('abort-read')

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

    const controller = new AbortController()
    controller.abort()

    await assert.rejects(
      () => readImmutableObject({
        storage,
        reference: published.reference,
        as: 'buffer',
        signal: controller.signal
      }),
      (error) => isMeshBytesError(error, 'ERR_OPERATION_ABORTED')
    )
  } finally {
    await rm(storage, { recursive: true, force: true })
  }
}

async function testMaterializationWriteFailureIsWrapped() {
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-write-failure-'))
  const destinationRoot = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-write-failure-target-'))
  const payload = Buffer.from('write-failure')

  try {
    const published = await publishImmutableObject({
      storage,
      bytes: payload,
      descriptor: {
        contentType: 'application/octet-stream',
        size: payload.length,
        encoding: 'binary',
        materializationHints: {
          preferredMode: 'cache'
        }
      }
    })

    await assert.rejects(
      () => materializeImmutableObject({
        storage,
        reference: published.reference,
        request: { mode: 'cache' },
        destination: destinationRoot
      }),
      (error) => isMeshBytesError(error, 'ERR_MATERIALIZATION_WRITE_FAILED')
    )
  } finally {
    await Promise.allSettled([
      rm(storage, { recursive: true, force: true }),
      rm(destinationRoot, { recursive: true, force: true })
    ])
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runOperationalHardeningTests().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
