#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
  createConduitCorestoreReadbackProof,
  publishImmutableObject,
  readImmutableObject
} from '../src/index.js'

function argValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] ?? null : null
}

const payload = Buffer.from('mesh-ecology-bytes conduit corestore readback proof')
const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-conduit-corestore-'))
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

const published = await publishImmutableObject({
  storage,
  bytes: payload,
  descriptor
})
const readback = await readImmutableObject({
  storage,
  reference: published.reference,
  as: 'buffer'
})
const proof = createConduitCorestoreReadbackProof({
  proofId: 'bytes-corestore-proof:example-local-readback:v0',
  readbackId: 'bytes-corestore-readback:example-local-readback:v0',
  published,
  readback,
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
