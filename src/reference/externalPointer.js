import {
  assertAllowedKeys,
  assertBoolean,
  assertEnum,
  assertHex,
  assertInteger,
  assertNonEmptyString,
  assertObject,
  normalizeIntegrityHint,
  stripUndefined
} from '../shared.js'

export const EXTERNAL_RESOURCE_POINTER_ARTIFACT_KIND = 'bytes_external_resource_pointer'
export const EXTERNAL_RESOURCE_POINTER_SCHEMA = 'bytes_external_resource_pointer.v0'
export const EXTERNAL_RESOURCE_RESOLUTION_RECEIPT_ARTIFACT_KIND = 'bytes_external_resource_resolution_receipt'
export const EXTERNAL_RESOURCE_RESOLUTION_RECEIPT_SCHEMA = 'bytes_external_resource_resolution_receipt.v0'

export const EXTERNAL_RESOURCE_KINDS = new Set([
  'artifact',
  'blob',
  'directory',
  'file',
  'media',
  'repo'
])

export const EXTERNAL_POINTER_KINDS = new Set([
  'bytes_ref',
  'hyperblob',
  'hypercore',
  'hyperdrive'
])

export const EXTERNAL_POINTER_AVAILABILITY = new Set([
  'device_local',
  'mirrored',
  'replicable_pointer',
  'replicated',
  'stale',
  'unavailable'
])

export const EXTERNAL_POINTER_REPLICATION_POSTURES = new Set([
  'device_dependent_scaffold',
  'mirror_candidate',
  'not_replicated',
  'replicable_external_pointer',
  'replicated'
])

export const EXTERNAL_RESOURCE_RESOLUTION_STATUSES = new Set([
  'blocked',
  'hash_mismatch',
  'resolved',
  'unavailable'
])

const POINTER_FIELDS = new Set([
  'artifactKind',
  'schemaVersion',
  'resourceRef',
  'resourceKind',
  'pointerKind',
  'storageBackend',
  'pointer',
  'contentHash',
  'byteLength',
  'mediaType',
  'originDeviceRef',
  'availability',
  'replicationPosture',
  'sourceRefs',
  'nonClaims'
])

const NON_CLAIM_FIELDS = [
  'pointerIsTruth',
  'blobPresenceIsAcceptance',
  'contentAvailabilityIsContinuity',
  'pathIsCanonical',
  'resourceRefIsAuthority'
]

const RESOLUTION_RECEIPT_FIELDS = new Set([
  'artifactKind',
  'schemaVersion',
  'receiptRef',
  'sourceResourceRef',
  'sourcePointerRef',
  'resolverRef',
  'resolvedAt',
  'resolutionStatus',
  'contentHash',
  'byteLength',
  'mediaType',
  'evidenceRefs',
  'sourceRefs',
  'payloadImported',
  'payloadInline',
  'acceptedContinuity',
  'nonClaims'
])

const RESOLUTION_NON_CLAIM_FIELDS = [
  'resolutionIsTruth',
  'payloadAvailabilityIsAcceptance',
  'receiptIsContinuity',
  'consumerAcceptanceClaimed',
  'pathIsCanonical'
]

export function createExternalResourcePointer(input = {}) {
  return normalizeExternalResourcePointer({
    artifactKind: input.artifactKind ?? EXTERNAL_RESOURCE_POINTER_ARTIFACT_KIND,
    schemaVersion: input.schemaVersion ?? EXTERNAL_RESOURCE_POINTER_SCHEMA,
    resourceRef: input.resourceRef,
    resourceKind: input.resourceKind,
    pointerKind: input.pointerKind,
    storageBackend: input.storageBackend ?? input.pointerKind,
    pointer: input.pointer,
    contentHash: input.contentHash,
    byteLength: input.byteLength,
    mediaType: input.mediaType,
    originDeviceRef: input.originDeviceRef,
    availability: input.availability,
    replicationPosture: input.replicationPosture,
    sourceRefs: input.sourceRefs,
    nonClaims: input.nonClaims
  })
}

export function validateExternalResourcePointer(input) {
  normalizeExternalResourcePointer(input)
  return input
}

export function createExternalResourceResolutionReceipt(input = {}) {
  return normalizeExternalResourceResolutionReceipt({
    artifactKind: input.artifactKind ?? EXTERNAL_RESOURCE_RESOLUTION_RECEIPT_ARTIFACT_KIND,
    schemaVersion: input.schemaVersion ?? EXTERNAL_RESOURCE_RESOLUTION_RECEIPT_SCHEMA,
    receiptRef: input.receiptRef,
    sourceResourceRef: input.sourceResourceRef,
    sourcePointerRef: input.sourcePointerRef,
    resolverRef: input.resolverRef,
    resolvedAt: input.resolvedAt,
    resolutionStatus: input.resolutionStatus,
    contentHash: input.contentHash,
    byteLength: input.byteLength,
    mediaType: input.mediaType,
    evidenceRefs: input.evidenceRefs,
    sourceRefs: input.sourceRefs,
    payloadImported: input.payloadImported ?? false,
    payloadInline: input.payloadInline ?? false,
    acceptedContinuity: input.acceptedContinuity ?? false,
    nonClaims: input.nonClaims
  })
}

export function validateExternalResourceResolutionReceipt(input) {
  normalizeExternalResourceResolutionReceipt(input)
  return input
}

export function normalizeExternalResourcePointer(input) {
  assertAllowedKeys(input, 'ExternalResourcePointer', POINTER_FIELDS)

  if (input.artifactKind !== EXTERNAL_RESOURCE_POINTER_ARTIFACT_KIND) {
    throw new TypeError(`ExternalResourcePointer.artifactKind must be ${EXTERNAL_RESOURCE_POINTER_ARTIFACT_KIND}`)
  }

  if (input.schemaVersion !== EXTERNAL_RESOURCE_POINTER_SCHEMA) {
    throw new TypeError(`ExternalResourcePointer.schemaVersion must be ${EXTERNAL_RESOURCE_POINTER_SCHEMA}`)
  }

  assertNonEmptyString(input.resourceRef, 'ExternalResourcePointer.resourceRef')
  assertEnum(input.resourceKind, 'ExternalResourcePointer.resourceKind', EXTERNAL_RESOURCE_KINDS)
  assertEnum(input.pointerKind, 'ExternalResourcePointer.pointerKind', EXTERNAL_POINTER_KINDS)
  assertNonEmptyString(input.storageBackend, 'ExternalResourcePointer.storageBackend')
  assertInteger(input.byteLength, 'ExternalResourcePointer.byteLength', { min: 0 })
  assertNonEmptyString(input.mediaType, 'ExternalResourcePointer.mediaType')
  assertNonEmptyString(input.originDeviceRef, 'ExternalResourcePointer.originDeviceRef')
  assertEnum(input.availability, 'ExternalResourcePointer.availability', EXTERNAL_POINTER_AVAILABILITY)
  assertEnum(input.replicationPosture, 'ExternalResourcePointer.replicationPosture', EXTERNAL_POINTER_REPLICATION_POSTURES)

  const pointer = normalizePointer(input.pointerKind, input.pointer)
  const sourceRefs = normalizeSourceRefs(input.sourceRefs)
  const nonClaims = normalizeNonClaims(input.nonClaims)

  return stripUndefined({
    artifactKind: EXTERNAL_RESOURCE_POINTER_ARTIFACT_KIND,
    schemaVersion: EXTERNAL_RESOURCE_POINTER_SCHEMA,
    resourceRef: input.resourceRef,
    resourceKind: input.resourceKind,
    pointerKind: input.pointerKind,
    storageBackend: input.storageBackend,
    pointer,
    contentHash: normalizeIntegrityHint(input.contentHash, 'ExternalResourcePointer.contentHash'),
    byteLength: input.byteLength,
    mediaType: input.mediaType,
    originDeviceRef: input.originDeviceRef,
    availability: input.availability,
    replicationPosture: input.replicationPosture,
    sourceRefs,
    nonClaims
  })
}

function normalizePointer(pointerKind, pointer) {
  assertObject(pointer, 'ExternalResourcePointer.pointer')

  if (
    pointer.localPath !== undefined ||
    pointer.hostPath !== undefined ||
    pointer.absolutePath !== undefined ||
    pointer.pathIsCanonical === true
  ) {
    throw new TypeError('ExternalResourcePointer.pointer must not use host-local paths as canonical resource identity')
  }

  switch (pointerKind) {
    case 'hyperblob':
      return normalizeHyperblobPointer(pointer)
    case 'hyperdrive':
      return normalizeHyperdrivePointer(pointer)
    case 'hypercore':
      return normalizeHypercorePointer(pointer)
    case 'bytes_ref':
      return normalizeBytesRefPointer(pointer)
    default:
      throw new TypeError(`Unsupported ExternalResourcePointer.pointerKind: ${pointerKind}`)
  }
}

function normalizeHyperblobPointer(pointer) {
  assertAllowedKeys(pointer, 'ExternalResourcePointer.pointer', new Set(['blobKey', 'id']))
  assertHex(pointer.blobKey, 'ExternalResourcePointer.pointer.blobKey', 64)
  assertNonEmptyString(pointer.id, 'ExternalResourcePointer.pointer.id')
  return {
    blobKey: pointer.blobKey.toLowerCase(),
    id: pointer.id
  }
}

function normalizeHyperdrivePointer(pointer) {
  assertAllowedKeys(pointer, 'ExternalResourcePointer.pointer', new Set(['driveKey', 'path']))
  assertHex(pointer.driveKey, 'ExternalResourcePointer.pointer.driveKey', 64)
  assertNonEmptyString(pointer.path, 'ExternalResourcePointer.pointer.path')

  if (pointer.path.startsWith('/') || pointer.path.includes('..')) {
    throw new TypeError('ExternalResourcePointer.pointer.path must be a drive-relative path, not a host-local path')
  }

  return {
    driveKey: pointer.driveKey.toLowerCase(),
    path: pointer.path
  }
}

function normalizeHypercorePointer(pointer) {
  assertAllowedKeys(pointer, 'ExternalResourcePointer.pointer', new Set(['hypercoreKey', 'blockRef']))
  assertHex(pointer.hypercoreKey, 'ExternalResourcePointer.pointer.hypercoreKey', 64)
  assertNonEmptyString(pointer.blockRef, 'ExternalResourcePointer.pointer.blockRef')
  return {
    hypercoreKey: pointer.hypercoreKey.toLowerCase(),
    blockRef: pointer.blockRef
  }
}

function normalizeBytesRefPointer(pointer) {
  assertAllowedKeys(pointer, 'ExternalResourcePointer.pointer', new Set(['bytesRef']))
  assertNonEmptyString(pointer.bytesRef, 'ExternalResourcePointer.pointer.bytesRef')
  return {
    bytesRef: pointer.bytesRef
  }
}

function normalizeSourceRefs(sourceRefs) {
  if (sourceRefs === undefined) return []

  if (!Array.isArray(sourceRefs)) {
    throw new TypeError('ExternalResourcePointer.sourceRefs must be an array')
  }

  return sourceRefs.map((ref, index) => {
    assertNonEmptyString(ref, `ExternalResourcePointer.sourceRefs[${index}]`)
    return ref
  })
}

function normalizeNonClaims(nonClaims) {
  assertObject(nonClaims, 'ExternalResourcePointer.nonClaims')

  for (const field of NON_CLAIM_FIELDS) {
    if (nonClaims[field] !== false) {
      throw new TypeError(`ExternalResourcePointer.nonClaims.${field} must be false`)
    }
  }

  return Object.fromEntries(NON_CLAIM_FIELDS.map((field) => [field, false]))
}

export function normalizeExternalResourceResolutionReceipt(input) {
  assertAllowedKeys(input, 'ExternalResourceResolutionReceipt', RESOLUTION_RECEIPT_FIELDS)

  if (input.artifactKind !== EXTERNAL_RESOURCE_RESOLUTION_RECEIPT_ARTIFACT_KIND) {
    throw new TypeError(`ExternalResourceResolutionReceipt.artifactKind must be ${EXTERNAL_RESOURCE_RESOLUTION_RECEIPT_ARTIFACT_KIND}`)
  }

  if (input.schemaVersion !== EXTERNAL_RESOURCE_RESOLUTION_RECEIPT_SCHEMA) {
    throw new TypeError(`ExternalResourceResolutionReceipt.schemaVersion must be ${EXTERNAL_RESOURCE_RESOLUTION_RECEIPT_SCHEMA}`)
  }

  assertNonEmptyString(input.receiptRef, 'ExternalResourceResolutionReceipt.receiptRef')
  assertNonEmptyString(input.sourceResourceRef, 'ExternalResourceResolutionReceipt.sourceResourceRef')
  assertNonEmptyString(input.sourcePointerRef, 'ExternalResourceResolutionReceipt.sourcePointerRef')
  assertNonEmptyString(input.resolverRef, 'ExternalResourceResolutionReceipt.resolverRef')
  assertNonEmptyString(input.resolvedAt, 'ExternalResourceResolutionReceipt.resolvedAt')
  assertEnum(input.resolutionStatus, 'ExternalResourceResolutionReceipt.resolutionStatus', EXTERNAL_RESOURCE_RESOLUTION_STATUSES)
  assertInteger(input.byteLength, 'ExternalResourceResolutionReceipt.byteLength', { min: 0 })
  assertNonEmptyString(input.mediaType, 'ExternalResourceResolutionReceipt.mediaType')
  assertBoolean(input.payloadImported, 'ExternalResourceResolutionReceipt.payloadImported')
  assertBoolean(input.payloadInline, 'ExternalResourceResolutionReceipt.payloadInline')
  assertBoolean(input.acceptedContinuity, 'ExternalResourceResolutionReceipt.acceptedContinuity')

  if (input.payloadImported !== false) {
    throw new TypeError('ExternalResourceResolutionReceipt.payloadImported must be false')
  }

  if (input.payloadInline !== false) {
    throw new TypeError('ExternalResourceResolutionReceipt.payloadInline must be false')
  }

  if (input.acceptedContinuity !== false) {
    throw new TypeError('ExternalResourceResolutionReceipt.acceptedContinuity must be false')
  }

  return stripUndefined({
    artifactKind: EXTERNAL_RESOURCE_RESOLUTION_RECEIPT_ARTIFACT_KIND,
    schemaVersion: EXTERNAL_RESOURCE_RESOLUTION_RECEIPT_SCHEMA,
    receiptRef: input.receiptRef,
    sourceResourceRef: input.sourceResourceRef,
    sourcePointerRef: input.sourcePointerRef,
    resolverRef: input.resolverRef,
    resolvedAt: input.resolvedAt,
    resolutionStatus: input.resolutionStatus,
    contentHash: normalizeIntegrityHint(input.contentHash, 'ExternalResourceResolutionReceipt.contentHash'),
    byteLength: input.byteLength,
    mediaType: input.mediaType,
    evidenceRefs: normalizeReceiptRefs(input.evidenceRefs, 'ExternalResourceResolutionReceipt.evidenceRefs'),
    sourceRefs: normalizeReceiptRefs(input.sourceRefs, 'ExternalResourceResolutionReceipt.sourceRefs'),
    payloadImported: false,
    payloadInline: false,
    acceptedContinuity: false,
    nonClaims: normalizeResolutionNonClaims(input.nonClaims)
  })
}

function normalizeReceiptRefs(refs, label) {
  if (refs === undefined) return []

  if (!Array.isArray(refs)) {
    throw new TypeError(`${label} must be an array`)
  }

  return refs.map((ref, index) => {
    assertNonEmptyString(ref, `${label}[${index}]`)
    return ref
  })
}

function normalizeResolutionNonClaims(nonClaims) {
  assertObject(nonClaims, 'ExternalResourceResolutionReceipt.nonClaims')

  for (const field of RESOLUTION_NON_CLAIM_FIELDS) {
    if (nonClaims[field] !== false) {
      throw new TypeError(`ExternalResourceResolutionReceipt.nonClaims.${field} must be false`)
    }
  }

  return Object.fromEntries(RESOLUTION_NON_CLAIM_FIELDS.map((field) => [field, false]))
}
