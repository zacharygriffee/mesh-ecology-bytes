import {
  createMaterializationHints,
  validateMaterializationHints
} from '../materialization/index.js'
import {
  assertInteger,
  assertNonEmptyString,
  assertObject,
  assertOptionalString,
  normalizeIntegrityHint,
  stripUndefined
} from '../shared.js'

export const BYTE_DESCRIPTOR_SCHEMA = 'mesh-ecology-bytes/byte-descriptor@1'

export function createByteDescriptor(input = {}) {
  return normalizeByteDescriptor(input)
}

export function validateByteDescriptor(input) {
  normalizeByteDescriptor(input)
  return input
}

export function normalizeByteDescriptor(input) {
  assertObject(input, 'ByteDescriptor')

  const allowedKeys = new Set([
    'contentType',
    'size',
    'encoding',
    'framing',
    'materializationHints',
    'integrityHint',
    'role',
    'logicalId'
  ])

  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) {
      throw new TypeError(`ByteDescriptor field "${key}" is not supported`)
    }
  }

  assertNonEmptyString(input.contentType, 'ByteDescriptor.contentType')
  assertInteger(input.size, 'ByteDescriptor.size', { min: 0 })

  if (input.encoding !== undefined) {
    assertNonEmptyString(input.encoding, 'ByteDescriptor.encoding')
  }

  if (input.framing !== undefined) {
    assertNonEmptyString(input.framing, 'ByteDescriptor.framing')
  }

  if (input.encoding === undefined && input.framing === undefined) {
    throw new TypeError('ByteDescriptor requires either encoding or framing')
  }

  if (input.materializationHints === undefined) {
    throw new TypeError('ByteDescriptor.materializationHints is required and may be empty')
  }

  validateMaterializationHints(input.materializationHints)

  if (input.role !== undefined) {
    assertNonEmptyString(input.role, 'ByteDescriptor.role')
  }

  if (input.logicalId !== undefined) {
    assertOptionalString(input.logicalId, 'ByteDescriptor.logicalId')
  }

  return stripUndefined({
    contentType: input.contentType,
    size: input.size,
    encoding: input.encoding,
    framing: input.framing,
    materializationHints: createMaterializationHints(input.materializationHints),
    integrityHint: normalizeIntegrityHint(input.integrityHint),
    role: input.role,
    logicalId: input.logicalId
  })
}

export function encodeByteDescriptor(input) {
  const descriptor = normalizeByteDescriptor(input)
  return Buffer.from(JSON.stringify(descriptor), 'utf8')
}

export function decodeByteDescriptor(buffer) {
  if (!Buffer.isBuffer(buffer) && !(buffer instanceof Uint8Array)) {
    throw new TypeError('ByteDescriptor block must be a Buffer or Uint8Array')
  }

  const parsed = JSON.parse(Buffer.from(buffer).toString('utf8'))
  return normalizeByteDescriptor(parsed)
}
