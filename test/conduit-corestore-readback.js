import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import createTestnet from 'hyperdht/testnet.js'

import {
  CONDUIT_CORESTORE_READBACK_PROOF_SCHEMA,
  createHyperswarmTransport,
  createConduitCorestoreReadbackProof,
  fetchImmutableObject,
  publishImmutableObject,
  readImmutableObject,
  serveImmutableObject,
  validateConduitCorestoreReadbackProof
} from '../src/index.js'

export async function runConduitCorestoreReadbackTests() {
  await testCreateConduitCorestoreReadbackProof()
  await testCreateReplicatedConduitCorestoreReadbackProof()
  await testConduitCorestoreReadbackProofRejectsMissingExpectedHash()
  await testConduitCorestoreReadbackProofRejectsEmbeddedBytes()
  await testConduitCorestoreReadbackProofRejectsOverclaims()
}

async function testCreateConduitCorestoreReadbackProof() {
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-conduit-proof-test-'))
  const payload = Buffer.from('conduit corestore readback proof test')
  const expectedHash = createHash('sha256').update(payload).digest('hex')

  try {
    const published = await publishImmutableObject({
      storage,
      bytes: payload,
      descriptor: {
        contentType: 'application/octet-stream',
        size: payload.length,
        encoding: 'binary',
        materializationHints: {
          preferredMode: 'stream',
          visibility: 'internal',
          placementClass: 'runtime_input',
          filenameHint: 'proof-test.bin'
        },
        integrityHint: {
          algorithm: 'sha256',
          value: expectedHash
        },
        role: 'runtime_blob',
        logicalId: 'conduit-proof-test'
      }
    })
    const readback = await readImmutableObject({
      storage,
      reference: published.reference,
      as: 'buffer'
    })
    const proof = createConduitCorestoreReadbackProof({
      proofId: 'bytes-corestore-proof:test:v0',
      readbackId: 'bytes-corestore-readback:test:v0',
      published,
      readback
    })

    assert.equal(proof.schema, CONDUIT_CORESTORE_READBACK_PROOF_SCHEMA)
    assert.equal(proof.producer.product, 'mesh-ecology-bytes')
    assert.equal(proof.readback.bytes.reference.schema, 'mesh-ecology-bytes/byte-reference@1')
    assert.equal(proof.readback.bytes.reference.transport, 'hypercore')
    assert.equal(proof.readback.bytes.reference.key, published.reference.key)
    assert.equal(proof.readback.bytes.reference.version, published.object.totalBlockCount)
    assert.equal(proof.readback.expectedHash, expectedHash)
    assert.equal(proof.readback.readbackTopology, 'single_store_local_reopen')
    assert.equal(proof.readback.replicationEvidence, null)
    assert.equal(proof.operationProof.bytesReadbackPerformedByBytes, true)
    assert.equal(proof.operationProof.conduitFetchedBytes, false)
    assert.equal(proof.nonClaims.payloadAvailabilityIsAcceptance, false)
    assert.equal(proof.rawBytes, undefined)
    assert.equal(proof.materializedBytes, undefined)
    assert.equal(JSON.stringify(proof).includes(payload.toString()), false)
    assert.equal(validateConduitCorestoreReadbackProof(proof), proof)
  } finally {
    await rm(storage, { recursive: true, force: true })
  }
}

async function testCreateReplicatedConduitCorestoreReadbackProof() {
  const publisherStorage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-conduit-proof-publisher-'))
  const consumerStorage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-conduit-proof-consumer-'))
  const testnet = await createTestnet(3)
  const publisherTransport = createHyperswarmTransport({
    swarmOptions: { dht: testnet.createNode() }
  })
  const consumerTransport = createHyperswarmTransport({
    swarmOptions: { dht: testnet.createNode() }
  })
  const payload = Buffer.from('conduit corestore replicated readback proof test')
  const expectedHash = createHash('sha256').update(payload).digest('hex')
  let served = null

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
          filenameHint: 'proof-replicated-test.bin'
        },
        integrityHint: {
          algorithm: 'sha256',
          value: expectedHash
        },
        role: 'runtime_blob',
        logicalId: 'conduit-proof-replicated-test'
      }
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
    const readback = await readImmutableObject({
      storage: consumerStorage,
      reference: published.reference,
      as: 'buffer'
    })
    const proof = createConduitCorestoreReadbackProof({
      proofId: 'bytes-corestore-proof:replicated-test:v0',
      readbackId: 'bytes-corestore-readback:replicated-test:v0',
      published,
      readback,
      readbackTopology: 'local_two_store_hyperswarm_testnet_readback',
      replicationEvidence: {
        substrate: 'hyperswarm-local-testnet',
        publisherStore: 'separate_local_store',
        consumerStore: 'separate_local_store',
        bytesFetchedByBytes: true,
        consumerReadbackAfterFetch: true,
        publicSwarmClaimed: false,
        deviceBoundaryClaimed: false
      }
    })

    assert.equal(proof.readback.readbackTopology, 'local_two_store_hyperswarm_testnet_readback')
    assert.equal(proof.readback.replicationEvidence.substrate, 'hyperswarm-local-testnet')
    assert.equal(proof.readback.replicationEvidence.bytesFetchedByBytes, true)
    assert.equal(proof.readback.expectedHash, expectedHash)
    assert.equal(JSON.stringify(proof).includes(payload.toString()), false)
    assert.equal(validateConduitCorestoreReadbackProof(proof), proof)
  } finally {
    await Promise.allSettled([
      served?.close(),
      publisherTransport.close(),
      consumerTransport.close(),
      testnet.destroy(),
      rm(publisherStorage, { recursive: true, force: true }),
      rm(consumerStorage, { recursive: true, force: true })
    ])
  }
}

async function testConduitCorestoreReadbackProofRejectsMissingExpectedHash() {
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-conduit-proof-hash-test-'))
  const payload = Buffer.from('conduit proof missing hash test')

  try {
    const published = await publishImmutableObject({
      storage,
      bytes: payload,
      descriptor: {
        contentType: 'application/octet-stream',
        size: payload.length,
        encoding: 'binary',
        materializationHints: {
          preferredMode: 'stream',
          visibility: 'internal',
          placementClass: 'runtime_input'
        },
        integrityHint: {
          algorithm: 'sha256',
          value: createHash('sha256').update(payload).digest('hex')
        },
        role: 'runtime_blob'
      }
    })

    assert.throws(
      () => createConduitCorestoreReadbackProof({
        published: {
          ...published,
          object: {
            ...published.object,
            payloadIntegrity: undefined
          }
        },
        descriptor: {
          ...published.descriptor,
          integrityHint: undefined
        },
        expectedHash: null
      }),
      /requires a sha256 expected hash/
    )
  } finally {
    await rm(storage, { recursive: true, force: true })
  }
}

function testConduitCorestoreReadbackProofRejectsEmbeddedBytes() {
  const validProof = createMinimalValidProof()

  assert.throws(
    () => validateConduitCorestoreReadbackProof({
      ...validProof,
      readback: {
        ...validProof.readback,
        rawBytes: 'payload'
      }
    }),
    /raw_bytes_forbidden:rawBytes/
  )

  assert.throws(
    () => validateConduitCorestoreReadbackProof({
      ...validProof,
      readback: {
        ...validProof.readback,
        bytes: {
          ...validProof.readback.bytes,
          payloadBytes: 'payload'
        }
      }
    }),
    /raw_bytes_forbidden:readback.bytes.payloadBytes/
  )
}

async function testConduitCorestoreReadbackProofRejectsOverclaims() {
  assert.throws(
    () => validateConduitCorestoreReadbackProof({
      artifactKind: 'bytes_corestore_readback_proof',
      schema: CONDUIT_CORESTORE_READBACK_PROOF_SCHEMA,
      producer: {
        product: 'mesh-ecology-bytes',
        repo: 'mesh-ecology-bytes'
      },
      retainedProof: {
        lane: 'bytes-corestore-readback',
        artifactHash: `sha256:${'a'.repeat(64)}`
      },
      readback: {
        schema: 'mesh-ecology-bytes/corestore-readback-boundary-fixture@1',
        owner: { product: 'mesh-ecology-bytes' },
        storageSubstrate: 'corestore-hypercore',
        readbackTopology: 'single_store_local_reopen',
        replicationEvidence: null,
        expectedHash: 'a'.repeat(64),
        bytes: {
          reference: {
            schema: 'mesh-ecology-bytes/byte-reference@1',
            transport: 'hypercore',
            key: 'a'.repeat(64),
            version: 1
          }
        },
        readback: {
          descriptorRead: true,
          bytesReadable: true
        }
      },
      operationProof: {
        conduitFetchedBytes: true
      },
      nonClaims: {
        payloadAvailabilityIsAcceptance: false,
        platformActionAuthorized: false,
        conduitPublishedBytes: false,
        conduitFetchedBytes: false,
        conduitPinnedBytes: false,
        conduitStoredBytes: false,
        conduitMaterializedBytes: false
      }
    }),
    /conduit_non_claim_required:conduitFetchedBytes/
  )
}

function createMinimalValidProof() {
  return {
    artifactKind: 'bytes_corestore_readback_proof',
    schema: CONDUIT_CORESTORE_READBACK_PROOF_SCHEMA,
    proofId: 'bytes-corestore-proof:minimal:v0',
    producer: {
      product: 'mesh-ecology-bytes',
      repo: 'mesh-ecology-bytes'
    },
    retainedProof: {
      lane: 'bytes-corestore-readback',
      artifactHash: `sha256:${'a'.repeat(64)}`
    },
    readback: {
      schema: 'mesh-ecology-bytes/corestore-readback-boundary-fixture@1',
      owner: { product: 'mesh-ecology-bytes' },
      storageSubstrate: 'corestore-hypercore',
      readbackTopology: 'single_store_local_reopen',
      replicationEvidence: null,
      expectedHash: 'a'.repeat(64),
      bytes: {
        reference: {
          schema: 'mesh-ecology-bytes/byte-reference@1',
          transport: 'hypercore',
          key: 'a'.repeat(64),
          version: 1
        }
      },
      readback: {
        descriptorRead: true,
        bytesReadable: true
      }
    },
    operationProof: {
      conduitPublishedBytes: false,
      conduitFetchedBytes: false,
      conduitPinnedBytes: false,
      conduitStoredBytes: false,
      conduitMaterializedBytes: false
    },
    nonClaims: {
      payloadAvailabilityIsAcceptance: false,
      platformActionAuthorized: false,
      conduitPublishedBytes: false,
      conduitFetchedBytes: false,
      conduitPinnedBytes: false,
      conduitStoredBytes: false,
      conduitMaterializedBytes: false
    }
  }
}
