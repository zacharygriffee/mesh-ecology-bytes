const { createHash } = require('crypto')

const { decodeByteDescriptor, normalizeByteDescriptor } = require('../descriptor')

const DESCRIPTOR_BLOCK_INDEX = 0
const PAYLOAD_START_BLOCK_INDEX = 1
const DEFAULT_PAYLOAD_CHUNK_SIZE = 64 * 1024

function serializeByteDescriptor(descriptor) {
  const normalizedDescriptor = normalizeByteDescriptor(descriptor)
  return Buffer.from(stableStringify(normalizedDescriptor), 'utf8')
}

function deserializeByteDescriptor(buffer) {
  return decodeByteDescriptor(buffer)
}

function createDescriptorHash(descriptorBuffer) {
  return createHash('sha256').update(descriptorBuffer).digest('hex')
}

function chunkPayload(buffer, chunkSize = DEFAULT_PAYLOAD_CHUNK_SIZE) {
  if (!Number.isInteger(chunkSize) || chunkSize < 1) {
    throw new TypeError('chunkSize must be an integer >= 1')
  }

  const chunks = []

  for (let offset = 0; offset < buffer.length; offset += chunkSize) {
    chunks.push(buffer.subarray(offset, offset + chunkSize))
  }

  return chunks
}

function getPayloadBlockCount(bufferOrSize, chunkSize = DEFAULT_PAYLOAD_CHUNK_SIZE) {
  const size = typeof bufferOrSize === 'number' ? bufferOrSize : bufferOrSize.byteLength

  if (!Number.isInteger(size) || size < 0) {
    throw new TypeError('payload size must be an integer >= 0')
  }

  if (size === 0) return 0
  return Math.ceil(size / chunkSize)
}

function getTotalBlockCount(bufferOrSize, chunkSize = DEFAULT_PAYLOAD_CHUNK_SIZE) {
  return PAYLOAD_START_BLOCK_INDEX + getPayloadBlockCount(bufferOrSize, chunkSize)
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort()
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }

  return JSON.stringify(value)
}

module.exports = {
  DEFAULT_PAYLOAD_CHUNK_SIZE,
  DESCRIPTOR_BLOCK_INDEX,
  PAYLOAD_START_BLOCK_INDEX,
  chunkPayload,
  createDescriptorHash,
  deserializeByteDescriptor,
  getPayloadBlockCount,
  getTotalBlockCount,
  serializeByteDescriptor
}
