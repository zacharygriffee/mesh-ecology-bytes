const {
  assertHex,
  assertInteger,
  assertNonEmptyString,
  assertObject,
  stripUndefined
} = require('../shared')

const BYTE_REFERENCE_SCHEMA = 'mesh-ecology-bytes/byte-reference@1'
const SUPPORTED_TRANSPORTS = new Set(['hypercore'])

function createByteReference(input = {}) {
  const reference = stripUndefined({
    schema: BYTE_REFERENCE_SCHEMA,
    transport: input.transport || 'hypercore',
    key: input.key,
    version: input.version,
    descriptor: input.descriptor || { index: 0 }
  })

  return normalizeByteReference(reference)
}

function validateByteReference(input) {
  normalizeByteReference(input)
  return input
}

function normalizeByteReference(input) {
  assertObject(input, 'ByteReference')

  const allowedKeys = new Set(['schema', 'transport', 'key', 'version', 'descriptor'])

  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) {
      throw new TypeError(`ByteReference field "${key}" is not supported`)
    }
  }

  if (input.schema !== undefined && input.schema !== BYTE_REFERENCE_SCHEMA) {
    throw new TypeError(`ByteReference.schema must be ${BYTE_REFERENCE_SCHEMA}`)
  }

  assertNonEmptyString(input.transport, 'ByteReference.transport')

  if (!SUPPORTED_TRANSPORTS.has(input.transport)) {
    throw new TypeError(`Unsupported ByteReference transport: ${input.transport}`)
  }

  assertHex(input.key, 'ByteReference.key', 64)

  if (input.version !== undefined) {
    assertInteger(input.version, 'ByteReference.version', { min: 1 })
  }

  if (input.descriptor !== undefined) {
    assertObject(input.descriptor, 'ByteReference.descriptor')
    const descriptorKeys = Object.keys(input.descriptor)

    if (descriptorKeys.length !== 1 || descriptorKeys[0] !== 'index') {
      throw new TypeError('ByteReference.descriptor only supports an { index } pointer')
    }

    assertInteger(input.descriptor.index, 'ByteReference.descriptor.index', { min: 0 })
  }

  return {
    schema: BYTE_REFERENCE_SCHEMA,
    transport: input.transport,
    key: input.key.toLowerCase(),
    version: input.version,
    descriptor: input.descriptor ? { index: input.descriptor.index } : undefined
  }
}

module.exports = {
  BYTE_REFERENCE_SCHEMA,
  SUPPORTED_TRANSPORTS,
  createByteReference,
  normalizeByteReference,
  validateByteReference
}
