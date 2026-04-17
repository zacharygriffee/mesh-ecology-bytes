import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import createTestnet from 'hyperdht/testnet.js'

import {
  createHyperswarmTransport,
  fetchImmutableObject,
  publishImmutableObject,
  serveImmutableObject
} from '../src/index.js'

async function main() {
  const publisherStorage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-publisher-'))
  const consumerStorage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-consumer-'))
  const testnet = await createTestnet(3)
  const publisherTransport = createHyperswarmTransport({
    swarmOptions: { dht: testnet.createNode() }
  })
  const consumerTransport = createHyperswarmTransport({
    swarmOptions: { dht: testnet.createNode() }
  })
  const bytes = Buffer.from('mesh byte payload')

  try {
    const published = await publishImmutableObject({
      storage: publisherStorage,
      bytes,
      descriptor: {
        contentType: 'application/octet-stream',
        size: bytes.length,
        encoding: 'binary',
        materializationHints: {
          preferredMode: 'stream',
          visibility: 'internal',
          placementClass: 'runtime_input',
          filenameHint: 'payload.bin'
        },
        integrityHint: {
          algorithm: 'sha256',
          value: createHash('sha256').update(bytes).digest('hex')
        },
        role: 'runtime_blob'
      }
    })

    const served = await serveImmutableObject({
      storage: publisherStorage,
      reference: published.reference,
      transport: publisherTransport
    })

    console.log('Reference:', published.reference)
    console.log('Publish lifecycle:', published.object.lifecycle)

    const fetched = await fetchImmutableObject({
      storage: consumerStorage,
      reference: published.reference,
      transport: consumerTransport,
      as: 'buffer'
    })

    console.log('Fetch lifecycle:', fetched.lifecycle)
    console.log('Fetched bytes:', fetched.bytes.toString())

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

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
