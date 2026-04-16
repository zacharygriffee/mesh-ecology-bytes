const assert = require('assert/strict')
const { createHash } = require('crypto')
const { mkdtemp, rm } = require('fs/promises')
const { tmpdir } = require('os')
const path = require('path')

const Hypercore = require('hypercore')

const {
  chunkPayload,
  createByteReference,
  getPayloadBlockCount,
  isMeshBytesError,
  publishImmutableObject,
  readImmutableObject,
  serializeByteDescriptor
} = require('../src')

async function runObjectModelTests() {
  await testPublishAndReadImmutableObject()
  await testInvalidDescriptorRejectedDuringPublish()
  await testMissingDescriptorRejectedDuringRead()
  await testInvalidDescriptorRejectedDuringRead()
}

async function testPublishAndReadImmutableObject() {
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-object-'))
  const payload = Buffer.from('phase-2-object-model')
  const chunkSize = 5
  const descriptor = {
    contentType: 'application/octet-stream',
    size: payload.length,
    encoding: 'binary',
    materializationHints: {
      preferredMode: 'cache',
      filenameHint: 'object.bin'
    },
    integrityHint: {
      algorithm: 'sha256',
      value: createHash('sha256').update(payload).digest('hex')
    },
    role: 'runtime_blob',
    logicalId: 'example-object'
  }

  try {
    const published = await publishImmutableObject({
      storage,
      bytes: payload,
      descriptor,
      chunkSize
    })

    assert.equal(published.reference.family, 'hypercore_immutable')
    assert.equal(typeof published.reference.key, 'string')
    assert.equal(published.reference.key.length, 64)
    assert.equal(typeof published.reference.descriptorHash, 'string')
    assert.equal(published.object.payloadBlockCount, getPayloadBlockCount(payload, chunkSize))
    assert.deepEqual(published.object.lifecycle, {
      fetched: true,
      complete: true,
      materialized: false,
      ready: false,
      state: 'complete'
    })

    const core = new Hypercore(storage, Buffer.from(published.reference.key, 'hex'), {
      createIfMissing: false,
      valueEncoding: 'binary',
      writable: false
    })

    await core.ready()

    const descriptorBlock = await core.get(0, { wait: false })
    assert.deepEqual(descriptorBlock, serializeByteDescriptor(descriptor))
    assert.equal(core.length, 1 + getPayloadBlockCount(payload, chunkSize))

    const expectedChunks = chunkPayload(payload, chunkSize)

    for (let index = 0; index < expectedChunks.length; index++) {
      const block = await core.get(index + 1, { wait: false })
      assert.deepEqual(block, expectedChunks[index])
    }

    await core.close()

    const readBack = await readImmutableObject({
      storage,
      reference: published.reference,
      as: 'buffer'
    })

    assert.deepEqual(readBack.descriptor, published.descriptor)
    assert.deepEqual(readBack.bytes, payload)
    assert.deepEqual(readBack.lifecycle, {
      fetched: true,
      complete: true,
      materialized: true,
      ready: true,
      state: 'ready'
    })
  } finally {
    await rm(storage, { recursive: true, force: true })
  }
}

async function testInvalidDescriptorRejectedDuringPublish() {
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-invalid-publish-'))

  try {
    await assert.rejects(() => publishImmutableObject({
      storage,
      bytes: Buffer.from('abc'),
      descriptor: {
        contentType: 'application/octet-stream',
        size: 2,
        encoding: 'binary',
        materializationHints: {}
      }
    }))
  } finally {
    await rm(storage, { recursive: true, force: true })
  }
}

async function testMissingDescriptorRejectedDuringRead() {
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-missing-descriptor-'))

  try {
    const core = new Hypercore(storage, {
      valueEncoding: 'binary'
    })

    await core.ready()

    const reference = createByteReference({
      family: 'hypercore_immutable',
      key: core.key.toString('hex')
    })

    await core.close()

    await assert.rejects(
      () => readImmutableObject({
        storage,
        reference
      }),
      (error) => isMeshBytesError(error, 'ERR_DESCRIPTOR_MISSING')
    )
  } finally {
    await rm(storage, { recursive: true, force: true })
  }
}

async function testInvalidDescriptorRejectedDuringRead() {
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-invalid-descriptor-'))

  try {
    const core = new Hypercore(storage, {
      valueEncoding: 'binary'
    })

    await core.ready()
    await core.append([Buffer.from('not-json'), Buffer.from('payload')])

    const reference = createByteReference({
      family: 'hypercore_immutable',
      key: core.key.toString('hex')
    })

    await core.close()

    await assert.rejects(
      () => readImmutableObject({
        storage,
        reference
      }),
      (error) => isMeshBytesError(error, 'ERR_INVALID_DESCRIPTOR')
    )
  } finally {
    await rm(storage, { recursive: true, force: true })
  }
}

module.exports = {
  runObjectModelTests
}

if (require.main === module) {
  runObjectModelTests().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
