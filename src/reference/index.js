const {
  assertHex,
  assertNonEmptyString,
  assertObject,
  normalizeIntegrityHint,
  stripUndefined
} = require('../shared')

const BYTE_REFERENCE_SCHEMA = 'mesh-ecology-bytes/byte-reference@1'
const SUPPORTED_REFERENCE_FAMILIES = new Set(['hypercore_immutable'])

function createByteReference(input = {}) {
  const reference = stripUndefined({
    family: input.family || 'hypercore_immutable',
    key: input.key,
    descriptorHash: input.descriptorHash,
    integrityHint: normalizeIntegrityHint(input.integrityHint)
  })

  return normalizeByteReference(reference)
}

function validateByteReference(input) {
  normalizeByteReference(input)
  return input
}

function normalizeByteReference(input) {
  assertObject(input, 'ByteReference')

  const allowedKeys = new Set(['family', 'key', 'descriptorHash', 'integrityHint'])

  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) {
      throw new TypeError(`ByteReference field "${key}" is not supported`)
    }
  }

  assertNonEmptyString(input.family, 'ByteReference.family')

  if (!SUPPORTED_REFERENCE_FAMILIES.has(input.family)) {
    throw new TypeError(`Unsupported ByteReference family: ${input.family}`)
  }

  assertHex(input.key, 'ByteReference.key', 64)

  if (input.descriptorHash !== undefined) {
    assertHex(input.descriptorHash, 'ByteReference.descriptorHash')
  }

  return {
    family: input.family,
    key: input.key.toLowerCase(),
    descriptorHash: input.descriptorHash ? input.descriptorHash.toLowerCase() : undefined,
    integrityHint: normalizeIntegrityHint(input.integrityHint)
  }
}

module.exports = {
  BYTE_REFERENCE_SCHEMA,
  SUPPORTED_REFERENCE_FAMILIES,
  createByteReference,
  normalizeByteReference,
  validateByteReference
}
