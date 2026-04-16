const { PassThrough } = require('stream')

const Hypercore = require('hypercore')

const { createMeshBytesError, isMeshBytesError } = require('../errors')
const { createOperationScope } = require('../operation')
const { createByteReference } = require('../reference')
const { assessObjectLifecycle, validateMaterializedBytes } = require('./completeness')
const {
  DESCRIPTOR_BLOCK_INDEX,
  PAYLOAD_START_BLOCK_INDEX,
  createDescriptorHash,
  deserializeByteDescriptor
} = require('./layout')

async function readImmutableObject(options = {}) {
  const { storage, as = 'buffer', core: providedCore, wait = false, closeCore = true } = options
  const reference = createByteReference(options.reference)
  const scope = createOperationScope(options)

  if (!storage && !providedCore) {
    throw new TypeError('readImmutableObject requires either a storage path or an opened core')
  }

  if (as !== 'buffer' && as !== 'stream') {
    throw new TypeError('readImmutableObject only supports "buffer" or "stream" output')
  }

  const core = providedCore || new Hypercore(storage, Buffer.from(reference.key, 'hex'), {
    createIfMissing: false,
    valueEncoding: 'binary',
    writable: false
  })
  const ownsCore = !providedCore

  try {
    if (!providedCore) {
      await scope.waitFor(core.ready(), 'Immutable object open')
    }

    if (core.length < 1) {
      throw createMeshBytesError('ERR_DESCRIPTOR_MISSING', 'Immutable object is missing descriptor block 0')
    }

    const descriptorBlock = await scope.waitFor(
      core.get(DESCRIPTOR_BLOCK_INDEX, { wait }),
      'Immutable object descriptor read'
    )

    if (!descriptorBlock) {
      throw createMeshBytesError(
        'ERR_DESCRIPTOR_UNAVAILABLE',
        'Immutable object descriptor block 0 is not available locally'
      )
    }

    let descriptor

    try {
      descriptor = deserializeByteDescriptor(descriptorBlock)
    } catch (error) {
      if (isMeshBytesError(error)) {
        throw error
      }

      throw createMeshBytesError(
        'ERR_INVALID_DESCRIPTOR',
        'Immutable object descriptor block 0 is invalid',
        { cause: error }
      )
    }

    if (reference.descriptorHash && reference.descriptorHash !== createDescriptorHash(descriptorBlock)) {
      throw createMeshBytesError(
        'ERR_DESCRIPTOR_HASH_MISMATCH',
        'ByteReference.descriptorHash does not match the stored descriptor'
      )
    }

    const fetchedLifecycle = await assessObjectLifecycle(core, descriptor, {
      fetched: true
    })

    if (as === 'stream') {
      const stream = createPayloadStream(core, { wait, closeCore, scope })

      return {
        reference,
        descriptor,
        stream,
        lifecycle: fetchedLifecycle
      }
    }

    const bytes = await collectPayload(core, { wait, scope })

    if (!validateMaterializedBytes(descriptor, bytes)) {
      throw createMeshBytesError(
        'ERR_INTEGRITY_MISMATCH',
        'Materialized bytes do not satisfy the descriptor integrity expectations'
      )
    }

    const lifecycle = await assessObjectLifecycle(core, descriptor, {
      fetched: true,
      materialized: true,
      materializedBytes: bytes
    })

    if (closeCore) await core.close()

    return {
      reference,
      descriptor,
      bytes,
      lifecycle
    }
  } catch (error) {
    if (ownsCore || closeCore) {
      await core.close().catch(() => {})
    }

    throw error
  }
}

function createPayloadStream(core, { wait, closeCore, scope }) {
  const output = new PassThrough()
  const source = core.createReadStream({
    start: PAYLOAD_START_BLOCK_INDEX,
    end: core.length,
    wait,
    snapshot: true
  })
  const stream = scope.bindStream(output, 'Immutable object payload stream', {
    onAbort: () => source.destroy(),
    onTimeout: () => source.destroy()
  })

  ;(async () => {
    try {
      for await (const block of source) {
        scope.throwIfAborted('Immutable object payload stream')
        stream.write(block)
      }

      stream.end()
    } catch (error) {
      stream.destroy(error)
    } finally {
      if (closeCore) core.close().catch(() => {})
    }
  })()

  return stream
}

async function collectPayload(core, { wait, scope }) {
  const source = core.createReadStream({
    start: PAYLOAD_START_BLOCK_INDEX,
    end: core.length,
    wait,
    snapshot: true
  })
  const chunks = []

  return scope.waitFor((async () => {
    try {
      for await (const block of source) {
        scope.throwIfAborted('Immutable object payload read')
        chunks.push(Buffer.from(block))
      }

      return Buffer.concat(chunks)
    } finally {
      source.destroy()
    }
  })(), 'Immutable object payload read', {
    onAbort: () => source.destroy(),
    onTimeout: () => source.destroy()
  })
}
module.exports = {
  readImmutableObject
}
