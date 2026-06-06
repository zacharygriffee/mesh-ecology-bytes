#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import createTestnet from 'hyperdht/testnet.js'

import {
  createHyperswarmTransport,
  createConduitCorestoreReadbackProof,
  fetchImmutableObject,
  publishImmutableObject,
  readImmutableObject,
  serveImmutableObject
} from '../src/index.js'

function argValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] ?? null : null
}

function hasArg(name) {
  return process.argv.includes(name)
}

const payload = Buffer.from('mesh-ecology-bytes conduit corestore readback proof')
const publisherStorage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-conduit-corestore-publisher-'))
const consumerStorage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-conduit-corestore-consumer-'))
const descriptor = {
  contentType: 'application/octet-stream',
  size: payload.length,
  encoding: 'binary',
  materializationHints: {
    preferredMode: 'stream',
    visibility: 'internal',
    placementClass: 'runtime_input',
    filenameHint: 'mesh-ecology-baseline-pack.json'
  },
  integrityHint: {
    algorithm: 'sha256',
    value: createHash('sha256').update(payload).digest('hex')
  },
  role: 'runtime_blob',
  logicalId: 'conduit-corestore-readback-example'
}
let testnet = null
let publisherTransport = null
let consumerTransport = null
let served = null

try {
  const published = await publishImmutableObject({
    storage: publisherStorage,
    bytes: payload,
    descriptor
  })
  let readback
  let readbackTopology = 'single_store_local_reopen'
  let replicationEvidence = null

  if (hasArg('--replicated')) {
    testnet = await createTestnet(3)
    publisherTransport = createHyperswarmTransport({
      swarmOptions: { dht: testnet.createNode() }
    })
    consumerTransport = createHyperswarmTransport({
      swarmOptions: { dht: testnet.createNode() }
    })
    served = await serveImmutableObject({
      storage: publisherStorage,
      reference: published.reference,
      transport: publisherTransport
    })
    await fetchImmutableObject({
      storage: consumerStorage,
      reference: published.reference,
      transport: consumerTransport,
      as: 'buffer'
    })
    readback = await readImmutableObject({
      storage: consumerStorage,
      reference: published.reference,
      as: 'buffer'
    })
    readbackTopology = 'local_two_store_hyperswarm_testnet_readback'
    replicationEvidence = {
      substrate: 'hyperswarm-local-testnet',
      publisherStore: 'separate_local_store',
      consumerStore: 'separate_local_store',
      bytesFetchedByBytes: true,
      consumerReadbackAfterFetch: true,
      publicSwarmClaimed: false,
      deviceBoundaryClaimed: false
    }
  } else {
    readback = await readImmutableObject({
      storage: publisherStorage,
      reference: published.reference,
      as: 'buffer'
    })
  }

  const proof = createConduitCorestoreReadbackProof({
    proofId: hasArg('--replicated')
      ? 'bytes-corestore-proof:example-local-replicated-readback:v0'
      : 'bytes-corestore-proof:example-local-readback:v0',
    readbackId: hasArg('--replicated')
      ? 'bytes-corestore-readback:example-local-replicated-readback:v0'
      : 'bytes-corestore-readback:example-local-readback:v0',
    published,
    readback,
    readbackTopology,
    replicationEvidence,
    retainedProof: {
      lane: 'bytes-corestore-readback',
      retainedAt: new Date().toISOString(),
      artifactPath: argValue('--out') ? path.resolve(argValue('--out')) : null
    }
  })
  const json = `${JSON.stringify(proof, null, 2)}\n`

  if (argValue('--out')) {
    await writeFile(path.resolve(argValue('--out')), json, 'utf8')
  } else {
    process.stdout.write(json)
  }
} finally {
  await Promise.allSettled([
    served?.close(),
    publisherTransport?.close(),
    consumerTransport?.close(),
    testnet?.destroy(),
    rm(publisherStorage, { recursive: true, force: true }),
    rm(consumerStorage, { recursive: true, force: true })
  ])
}
