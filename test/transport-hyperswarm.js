const assert = require('assert/strict')
const { createHash } = require('crypto')
const { mkdtemp, rm } = require('fs/promises')
const { tmpdir } = require('os')
const path = require('path')

const createTestnet = require('hyperdht/testnet')

const {
  createHyperswarmTransport,
  fetchImmutableObject,
  publishImmutableObject,
  readImmutableObject,
  serveImmutableObject
} = require('../src')

async function runHyperswarmTransportTests() {
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

module.exports = {
  runHyperswarmTransportTests
}

if (require.main === module) {
  runHyperswarmTransportTests().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
