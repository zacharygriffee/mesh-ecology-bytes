import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import createTestnet from 'hyperdht/testnet.js'

import {
  createHyperswarmTransport,
  fetchImmutableObject,
  publishImmutableObject,
  readImmutableObject,
  serveImmutableObject
} from '../src/index.js'

export async function runHyperswarmTransportTests() {
  const publisherStorage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-publisher-'))
  const consumerStorage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-consumer-'))
  const testnet = await createTestnet(3)
  const publisherTransport = createHyperswarmTransport({
    swarmOptions: { dht: testnet.createNode() }
  })
  const consumerTransport = createHyperswarmTransport({
    swarmOptions: { dht: testnet.createNode() }
  })
  const payload = Buffer.from('hyperswarm-replicated-object')

  try {
    const published = await publishImmutableObject({
      storage: publisherStorage,
      bytes: payload,
      descriptor: {
        contentType: 'application/octet-stream',
        size: payload.length,
        encoding: 'binary',
        materializationHints: {
          preferredMode: 'stream',
          visibility: 'internal',
          placementClass: 'runtime_input',
          filenameHint: 'replicated.bin'
        },
        integrityHint: {
          algorithm: 'sha256',
          value: createHash('sha256').update(payload).digest('hex')
        }
      }
    })

    const served = await serveImmutableObject({
      storage: publisherStorage,
      reference: published.reference,
      transport: publisherTransport
    })

    const fetched = await fetchImmutableObject({
      storage: consumerStorage,
      reference: published.reference,
      transport: consumerTransport,
      as: 'buffer'
    })

    assert.deepEqual(fetched.reference, published.reference)
    assert.deepEqual(fetched.descriptor, published.descriptor)
    assert.deepEqual(fetched.bytes, payload)
    assert.deepEqual(fetched.lifecycle, {
      fetched: true,
      complete: true,
      materialized: true,
      ready: true,
      state: 'ready'
    })

    const localRead = await readImmutableObject({
      storage: consumerStorage,
      reference: published.reference,
      as: 'buffer'
    })

    assert.deepEqual(localRead.bytes, payload)
    assert.equal(localRead.lifecycle.ready, true)

    await served.close()
  } finally {
    await Promise.allSettled([
      publisherTransport.close(),
      consumerTransport.close(),
      testnet.destroy(),
      rm(publisherStorage, { recursive: true, force: true }),
      rm(consumerStorage, { recursive: true, force: true })
    ])
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runHyperswarmTransportTests().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
