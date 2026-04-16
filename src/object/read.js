const { PassThrough } = require('stream')

const Hypercore = require('hypercore')

const { createByteReference } = require('../reference')
const { assessObjectLifecycle } = require('./completeness')
const {
  DESCRIPTOR_BLOCK_INDEX,
  PAYLOAD_START_BLOCK_INDEX,
  createDescriptorHash,
  deserializeByteDescriptor
} = require('./layout')

async function readImmutableObject(options = {}) {
  const { storage, as = 'buffer', core: providedCore, wait = false, closeCore = true } = options
  const reference = createByteReference(options.reference)

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

  if (!providedCore) await core.ready()

  if (core.length < 1) {
    if (closeCore) await core.close()
    throw new Error('Immutable object is missing descriptor block 0')
  }

  const descriptorBlock = await core.get(DESCRIPTOR_BLOCK_INDEX, { wait })

  if (!descriptorBlock) {
    if (closeCore) await core.close()
    throw new Error('Immutable object descriptor block 0 is not available locally')
  }

  const descriptor = deserializeByteDescriptor(descriptorBlock)

  if (reference.descriptorHash && reference.descriptorHash !== createDescriptorHash(descriptorBlock)) {
    if (closeCore) await core.close()
    throw new Error('ByteReference.descriptorHash does not match the stored descriptor')
  }

  const fetchedLifecycle = await assessObjectLifecycle(core, descriptor, {
    fetched: true
  })

  if (as === 'stream') {
    const stream = createPayloadStream(core, { wait, closeCore })

    return {
      reference,
      descriptor,
      stream,
      lifecycle: fetchedLifecycle
    }
  }

  const bytes = await collectPayload(core, { wait })
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
}

function createPayloadStream(core, { wait, closeCore }) {
  const output = new PassThrough()
  const source = core.createReadStream({
    start: PAYLOAD_START_BLOCK_INDEX,
    end: core.length,
    wait,
    snapshot: true
  })

  ;(async () => {
    try {
      for await (const block of source) {
        output.write(block)
      }

      output.end()
    } catch (error) {
      output.destroy(error)
    } finally {
      if (closeCore) core.close().catch(() => {})
    }
  })()

  return output
}

async function collectPayload(core, { wait }) {
  const chunks = []

  for await (const block of core.createReadStream({
    start: PAYLOAD_START_BLOCK_INDEX,
    end: core.length,
    wait,
    snapshot: true
  })) {
    chunks.push(Buffer.from(block))
  }

  return Buffer.concat(chunks)
}
module.exports = {
  readImmutableObject
}
