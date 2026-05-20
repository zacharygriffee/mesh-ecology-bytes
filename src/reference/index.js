import {
  assertHex,
  assertNonEmptyString,
  assertObject,
  normalizeIntegrityHint,
  stripUndefined
} from '../shared.js'

export const BYTE_REFERENCE_SCHEMA = 'mesh-ecology-bytes/byte-reference@1'
export const SUPPORTED_REFERENCE_FAMILIES = new Set(['hypercore_immutable'])

export {
  EXTERNAL_POINTER_AVAILABILITY,
  EXTERNAL_POINTER_KINDS,
  EXTERNAL_POINTER_REPLICATION_POSTURES,
  EXTERNAL_RESOURCE_KINDS,
  EXTERNAL_RESOURCE_POINTER_ARTIFACT_KIND,
  EXTERNAL_RESOURCE_POINTER_SCHEMA,
  EXTERNAL_RESOURCE_RESOLUTION_RECEIPT_ARTIFACT_KIND,
  EXTERNAL_RESOURCE_RESOLUTION_RECEIPT_SCHEMA,
  EXTERNAL_RESOURCE_RESOLUTION_STATUSES,
  RESOURCE_ARTIFACT_AVAILABILITY_POSTURES,
  RESOURCE_ARTIFACT_DEVICE_DEPENDENCY_POSTURES,
  RESOURCE_ARTIFACT_VISIBILITY_INDEX_ARTIFACT_KIND,
  RESOURCE_ARTIFACT_VISIBILITY_INDEX_SCHEMA,
  createExternalResourcePointer,
  createExternalResourceResolutionReceipt,
  createResourceArtifactVisibilityIndex,
  normalizeExternalResourcePointer,
  normalizeExternalResourceResolutionReceipt,
  normalizeResourceArtifactVisibilityIndex,
  validateExternalResourceResolutionReceipt,
  validateExternalResourcePointer,
  validateResourceArtifactVisibilityIndex
} from './externalPointer.js'

export function createByteReference(input = {}) {
  const reference = stripUndefined({
    family: input.family || 'hypercore_immutable',
    key: input.key,
    descriptorHash: input.descriptorHash,
    integrityHint: normalizeIntegrityHint(input.integrityHint)
  })

  return normalizeByteReference(reference)
}

export function validateByteReference(input) {
  normalizeByteReference(input)
  return input
}

export function normalizeByteReference(input) {
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
