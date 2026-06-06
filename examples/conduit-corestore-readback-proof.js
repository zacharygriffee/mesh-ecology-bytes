#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

async function readRetainedExisting() {
  const storage = argValue('--storage')
  const publishedPath = argValue('--published')
  if (!storage || !publishedPath) {
    throw new TypeError('--read-retained-existing requires --storage and --published')
  }
  const published = JSON.parse(await readFile(path.resolve(publishedPath), 'utf8'))
  const readback = await readImmutableObject({
    storage: path.resolve(storage),
    reference: published.reference,
    as: 'buffer'
  })
  const proof = createConduitCorestoreReadbackProof({
    proofId: 'bytes-corestore-proof:example-retained-process-readback:v0',
    readbackId: 'bytes-corestore-readback:example-retained-process-readback:v0',
    published,
    readback,
    readbackTopology: 'retained_store_process_readback',
    retentionEvidence: {
      retainedStoreClass: 'bytes_owned_local_runtime_store',
      readbackProcessBoundary: 'separate_node_process',
      publisherClosedBeforeReadback: true,
      readbackAfterReopen: true,
      seedCommitment: {
        scope: 'proof_window',
        maySeed: true,
        retentionTerm: 'pinned_for_proof',
        authorityGranted: false
      },
      retentionBeyondProofWindowClaimed: false
    },
    retainedProof: {
      lane: 'bytes-corestore-readback',
      retainedAt: new Date().toISOString(),
      artifactPath: argValue('--artifact-path') ? path.resolve(argValue('--artifact-path')) : null
    }
  })
  const json = `${JSON.stringify(proof, null, 2)}\n`
  if (argValue('--child-out')) {
    await writeFile(path.resolve(argValue('--child-out')), json, 'utf8')
  } else {
    await writeStdout(json)
  }
}

if (hasArg('--read-retained-existing')) {
  await readRetainedExisting()
} else {
  const payload = Buffer.from('mesh-ecology-bytes conduit corestore readback proof')
  const publisherStorage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-conduit-corestore-publisher-'))
  const consumerStorage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-conduit-corestore-consumer-'))
  const retainedMetadataRoot = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-conduit-retained-meta-'))
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
    let proofFromChild = null

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
    } else if (hasArg('--retained')) {
      const publishedPath = path.join(retainedMetadataRoot, 'published.json')
      await writeFile(publishedPath, `${JSON.stringify(published, null, 2)}\n`, 'utf8')
      proofFromChild = await runRetainedReadbackChild({
        storage: publisherStorage,
        publishedPath,
        artifactPath: argValue('--out') ? path.resolve(argValue('--out')) : null
      })
    } else {
      readback = await readImmutableObject({
        storage: publisherStorage,
        reference: published.reference,
        as: 'buffer'
      })
    }

    const proof = proofFromChild ?? createConduitCorestoreReadbackProof({
      proofId: hasArg('--availability')
        ? 'bytes-corestore-proof:example-local-availability:v0'
        : hasArg('--replicated')
        ? 'bytes-corestore-proof:example-local-replicated-readback:v0'
        : 'bytes-corestore-proof:example-local-readback:v0',
      readbackId: hasArg('--availability')
        ? 'bytes-corestore-readback:example-local-availability:v0'
        : hasArg('--replicated')
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
      rm(consumerStorage, { recursive: true, force: true }),
      rm(retainedMetadataRoot, { recursive: true, force: true })
    ])
  }
}

async function runRetainedReadbackChild({ storage, publishedPath, artifactPath }) {
  const childOut = path.join(path.dirname(publishedPath), 'child-proof.json')
  const child = spawn(process.execPath, [
    fileURLToPath(import.meta.url),
    '--read-retained-existing',
    '--storage',
    storage,
    '--published',
    publishedPath,
    '--child-out',
    childOut,
    ...(artifactPath ? ['--artifact-path', artifactPath] : [])
  ], {
    stdio: ['ignore', 'pipe', 'pipe']
  })
  const [stdout, stderr, code] = await Promise.all([
    collect(child.stdout),
    collect(child.stderr),
    new Promise((resolve) => child.on('close', resolve))
  ])
  if (code !== 0) {
    throw new Error(`Retained readback child failed: ${stderr}`)
  }
  if (stdout.trim()) return JSON.parse(stdout)
  return JSON.parse(await readFile(childOut, 'utf8'))
}

function collect(stream) {
  return new Promise((resolve, reject) => {
    let data = ''
    stream.setEncoding('utf8')
    stream.on('data', (chunk) => {
      data += chunk
    })
    stream.on('error', reject)
    stream.on('end', () => resolve(data))
  })
}

function writeStdout(value) {
  return new Promise((resolve, reject) => {
    process.stdout.write(value, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}
