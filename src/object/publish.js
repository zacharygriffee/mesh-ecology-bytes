import { createHash } from 'node:crypto'

import Hypercore from 'hypercore'

import { createByteDescriptor } from '../descriptor/index.js'
import { createByteReference } from '../reference/index.js'
import { assessObjectLifecycle, validateMaterializedBytes } from './completeness.js'
import {
  DEFAULT_PAYLOAD_CHUNK_SIZE,
  chunkPayload,
  createDescriptorHash,
  getPayloadBlockCount,
  serializeByteDescriptor
} from './layout.js'

export async function publishImmutableObject(options = {}) {
  const { storage, descriptor, chunkSize = DEFAULT_PAYLOAD_CHUNK_SIZE } = options
  const bytes = toBuffer(options.bytes)
  const normalizedDescriptor = createByteDescriptor(descriptor)

  if (!storage) {
    throw new TypeError('publishImmutableObject requires a storage path')
  }

  if (normalizedDescriptor.size !== bytes.length) {
    throw new Error('ByteDescriptor.size must match the published byte length')
  }

  if (!validateMaterializedBytes(normalizedDescriptor, bytes)) {
    throw new Error('Published bytes do not satisfy the descriptor integrity expectations')
  }

  const core = new Hypercore(storage, {
    valueEncoding: 'binary'
  })

  await core.ready()

  if (core.length !== 0) {
    await core.close()
    throw new Error('publishImmutableObject requires an empty storage target for a new immutable object')
  }

  const descriptorBlock = serializeByteDescriptor(normalizedDescriptor)
  const payloadBlocks = chunkPayload(bytes, chunkSize)

  await core.append([descriptorBlock, ...payloadBlocks])

  const reference = createByteReference({
    family: 'hypercore_immutable',
    key: core.key.toString('hex'),
    descriptorHash: createDescriptorHash(descriptorBlock),
    integrityHint: normalizedDescriptor.integrityHint
  })

  const lifecycle = await assessObjectLifecycle(core, normalizedDescriptor, {
    fetched: true
  })

  const object = {
    key: core.key.toString('hex'),
    storage,
    descriptorHash: reference.descriptorHash,
    payloadSize: bytes.length,
    payloadBlockCount: getPayloadBlockCount(bytes, chunkSize),
    totalBlockCount: core.length,
    payloadIntegrity: createHash('sha256').update(bytes).digest('hex'),
    lifecycle
  }

  await core.close()

  return {
    descriptor: normalizedDescriptor,
    reference,
    object
  }
}

function toBuffer(value) {
  if (Buffer.isBuffer(value)) return value
  if (value instanceof Uint8Array) return Buffer.from(value)
  throw new TypeError('publishImmutableObject currently supports Buffer and Uint8Array input only')
}
