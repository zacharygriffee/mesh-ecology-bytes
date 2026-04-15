const {
  createMaterializationHints,
  validateMaterializationHints
} = require('../materialization')
const {
  assertEnum,
  assertInteger,
  assertNonEmptyString,
  assertObject,
  assertOptionalString,
  normalizeHash,
  stripUndefined
} = require('../shared')

const BYTE_DESCRIPTOR_SCHEMA = 'mesh-ecology-bytes/byte-descriptor@1'
const MUTABILITY_VALUES = new Set(['immutable', 'replaceable'])

function createByteDescriptor(input = {}) {
  const descriptor = stripUndefined({
    schema: BYTE_DESCRIPTOR_SCHEMA,
    id: input.id,
    hash: normalizeHash(input.hash),
    size: input.size,
    contentType: input.contentType,
    encoding: input.encoding,
    framing: input.framing,
    mutability: input.mutability || 'immutable',
    role: input.role,
    materializationHints: input.materializationHints
      ? createMaterializationHints(input.materializationHints)
      : undefined
  })

  return normalizeByteDescriptor(descriptor)
}

function validateByteDescriptor(input) {
  normalizeByteDescriptor(input)
  return input
}

function normalizeByteDescriptor(input) {
  assertObject(input, 'ByteDescriptor')

  const allowedKeys = new Set([
    'schema',
    'id',
    'hash',
    'size',
    'contentType',
    'encoding',
    'framing',
    'mutability',
    'role',
    'materializationHints'
  ])

  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) {
      throw new TypeError(`ByteDescriptor field "${key}" is not supported`)
    }
  }

  if (input.schema !== undefined && input.schema !== BYTE_DESCRIPTOR_SCHEMA) {
    throw new TypeError(`ByteDescriptor.schema must be ${BYTE_DESCRIPTOR_SCHEMA}`)
  }

  const hash = normalizeHash(input.hash)

  if (input.id === undefined && hash === undefined) {
    throw new TypeError('ByteDescriptor requires either id or hash')
  }

  if (input.id !== undefined) {
    assertNonEmptyString(input.id, 'ByteDescriptor.id')
  }

  if (hash !== undefined) {
    assertOptionalString(hash.algorithm, 'ByteDescriptor.hash.algorithm')
  }

  if (input.size !== undefined) {
    assertInteger(input.size, 'ByteDescriptor.size', { min: 0 })
  }

  if (input.contentType !== undefined) {
    assertNonEmptyString(input.contentType, 'ByteDescriptor.contentType')
  }

  if (input.encoding !== undefined) {
    assertNonEmptyString(input.encoding, 'ByteDescriptor.encoding')
  }

  if (input.framing !== undefined) {
    assertNonEmptyString(input.framing, 'ByteDescriptor.framing')
  }

  if (input.mutability !== undefined) {
    assertEnum(input.mutability, 'ByteDescriptor.mutability', MUTABILITY_VALUES)
  }

  if (input.role !== undefined) {
    assertNonEmptyString(input.role, 'ByteDescriptor.role')
  }

  if (input.materializationHints !== undefined) {
    validateMaterializationHints(input.materializationHints)
  }

  return stripUndefined({
    schema: BYTE_DESCRIPTOR_SCHEMA,
    id: input.id,
    hash,
    size: input.size,
    contentType: input.contentType,
    encoding: input.encoding,
    framing: input.framing,
    mutability: input.mutability || 'immutable',
    role: input.role,
    materializationHints: input.materializationHints
      ? createMaterializationHints(input.materializationHints)
      : undefined
  })
}

function encodeByteDescriptor(input) {
  const descriptor = normalizeByteDescriptor(input)
  return Buffer.from(JSON.stringify(descriptor), 'utf8')
}

function decodeByteDescriptor(buffer) {
  if (!Buffer.isBuffer(buffer) && !(buffer instanceof Uint8Array)) {
    throw new TypeError('ByteDescriptor block must be a Buffer or Uint8Array')
  }

  const parsed = JSON.parse(Buffer.from(buffer).toString('utf8'))
  return normalizeByteDescriptor(parsed)
}

module.exports = {
  BYTE_DESCRIPTOR_SCHEMA,
  MUTABILITY_VALUES,
  createByteDescriptor,
  decodeByteDescriptor,
  encodeByteDescriptor,
  normalizeByteDescriptor,
  validateByteDescriptor
}
