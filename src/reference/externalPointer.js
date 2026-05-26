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
export const RESOURCE_ARTIFACT_VISIBILITY_INDEX_ARTIFACT_KIND = 'bytes_resource_artifact_visibility_index'
export const RESOURCE_ARTIFACT_VISIBILITY_INDEX_SCHEMA = 'bytes_resource_artifact_visibility_index.v0'
export const SOURCE_PRESSURE_ADAPTER_CANDIDATE_ARTIFACT_KIND = 'bytes_source_pressure_adapter_candidate'
export const SOURCE_PRESSURE_ADAPTER_CANDIDATE_SCHEMA = 'bytes.source_pressure_adapter_candidate.local.v0'
export const SOURCE_PRESSURE_ADAPTER_OPERATOR_DECISION_ARTIFACT_KIND =
  'bytes_source_pressure_adapter_operator_decision'
export const SOURCE_PRESSURE_ADAPTER_OPERATOR_DECISION_SCHEMA =
  'bytes.source_pressure_adapter_operator_decision.local.v0'
export const SOURCE_PRESSURE_OBSERVATION_RESULT_ARTIFACT_KIND =
  'bytes_source_pressure_observation_result'
export const SOURCE_PRESSURE_OBSERVATION_RESULT_SCHEMA =
  'bytes.source_pressure_observation_result.local.v0'
export const LAYER_SOURCE_PRESSURE_REVIEW_SCHEMA = 'layer-source-pressure-review.v0'

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

export const RESOURCE_ARTIFACT_AVAILABILITY_POSTURES = new Set([
  'payload_resolvable_by_bytes',
  'payload_unavailable',
  'pointer_visible',
  'resolution_receipt_visible',
  'visibility_unknown'
])

export const RESOURCE_ARTIFACT_DEVICE_DEPENDENCY_POSTURES = new Set([
  'device_dependent_scaffold',
  'local_layer_resource_ref',
  'replicated_pointer_ref',
  'session_visible_fixture_scaffold',
  'unknown'
])

export const SOURCE_PRESSURE_OPERATOR_DECISIONS = new Set([
  'hold_for_operator_revision',
  'reject_unbounded_pressure',
  'route_to_generic_layer_seam_review'
])

export const SOURCE_PRESSURE_ROUTE = Object.freeze({
  source: 'representative_source_pressure',
  review: 'generic_layer_seam_review',
  reviewSchema: LAYER_SOURCE_PRESSURE_REVIEW_SCHEMA,
  mediation: 'optional_edge_mediation',
  terminal: 'stop'
})

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

const VISIBILITY_INDEX_FIELDS = new Set([
  'artifactKind',
  'schemaVersion',
  'visibilityIndexRef',
  'resourceRef',
  'pointerRefs',
  'resolutionReceiptRefs',
  'ownerRepoRef',
  'sourcePointerSchema',
  'sourceResolutionReceiptSchema',
  'availabilityPosture',
  'replicationPosture',
  'sourceRefs',
  'observerRef',
  'observedAt',
  'deviceDependencyPosture',
  'nonClaims'
])

const VISIBILITY_INDEX_NON_CLAIM_FIELDS = [
  'visibilityIndexIsTruth',
  'visibilityIndexIsAuthority',
  'visibilityIndexIsAcceptedContinuity',
  'visibilityIndexIsResultContinuity',
  'visibilityIndexIsOperatorApproval',
  'visibilityIndexIsExecution',
  'visibilityIndexIsProductionReadiness',
  'visibilityIndexIsMeshSettlement',
  'pointerVisibilityIsPayloadValidity',
  'resolutionVisibilityIsResultValidity'
]

const SOURCE_PRESSURE_CANDIDATE_FIELDS = new Set([
  'artifactKind',
  'schemaVersion',
  'candidateRef',
  'representativeSourcePressureRef',
  'materialRefs',
  'resourceRefs',
  'payloadVisibilityRefs',
  'availabilityEvidenceRefs',
  'unavailabilityEvidenceRefs',
  'route',
  'createdByRef',
  'createdAt',
  'acceptedContinuity',
  'layerMutation',
  'storageWrite',
  'edgeAuthorityCreated',
  'repoAgentsDispatched',
  'autoExecute',
  'payloadAction',
  'bytesOwnedLayerSourcePressureReviewEmitted',
  'nonClaims'
])

const SOURCE_PRESSURE_DECISION_FIELDS = new Set([
  'artifactKind',
  'schemaVersion',
  'decisionRef',
  'candidateRef',
  'operatorRef',
  'decidedAt',
  'decision',
  'reasonRefs',
  'route',
  'acceptedContinuity',
  'layerMutation',
  'storageWrite',
  'edgeAuthorityCreated',
  'repoAgentsDispatched',
  'autoExecute',
  'payloadAction',
  'bytesOwnedLayerSourcePressureReviewEmitted',
  'nonClaims'
])

const SOURCE_PRESSURE_OBSERVATION_RESULT_FIELDS = new Set([
  'artifactKind',
  'schemaVersion',
  'observationRef',
  'candidateRef',
  'decisionRef',
  'observerRef',
  'observedAt',
  'boundedSourcePressureArtifactRef',
  'route',
  'reviewArtifactKind',
  'reviewSchema',
  'reviewArtifactEmittedByBytes',
  'acceptedContinuity',
  'layerMutation',
  'storageWrite',
  'edgeAuthorityCreated',
  'repoAgentsDispatched',
  'autoExecute',
  'payloadAction',
  'nonClaims'
])

const SOURCE_PRESSURE_ACTION_FALSE_FIELDS = [
  'acceptedContinuity',
  'layerMutation',
  'storageWrite',
  'edgeAuthorityCreated',
  'repoAgentsDispatched',
  'autoExecute',
  'payloadAction'
]

const SOURCE_PRESSURE_CANDIDATE_NON_CLAIM_FIELDS = [
  'adapterCandidateIsLayerTruth',
  'bytesVisibilityIsLayerTruth',
  'refVisibilityIsPayloadValidity',
  'candidateIsAcceptedContinuity',
  'candidateMutatesLayer',
  'candidateWritesStorage',
  'candidateCreatesEdgeAuthority',
  'candidateDispatchesRepoAgents',
  'candidateAutoExecutes',
  'candidateFetchesPublishesPinsReplicatesOrMaterializesPayload',
  'candidateEmitsLayerSourcePressureReview'
]

const SOURCE_PRESSURE_DECISION_NON_CLAIM_FIELDS = [
  'operatorDecisionIsLayerTruth',
  'operatorDecisionIsAcceptedContinuity',
  'operatorDecisionIsExecution',
  'operatorDecisionMutatesLayer',
  'operatorDecisionWritesStorage',
  'operatorDecisionCreatesEdgeAuthority',
  'operatorDecisionDispatchesRepoAgents',
  'operatorDecisionAutoExecutes',
  'operatorDecisionFetchesPublishesPinsReplicatesOrMaterializesPayload',
  'operatorDecisionEmitsLayerSourcePressureReview'
]

const SOURCE_PRESSURE_OBSERVATION_NON_CLAIM_FIELDS = [
  'observationIsLayerTruth',
  'bytesVisibilityIsLayerTruth',
  'refVisibilityIsPayloadValidity',
  'observationIsAcceptedContinuity',
  'observationMutatesLayer',
  'observationWritesStorage',
  'observationCreatesEdgeAuthority',
  'observationDispatchesRepoAgents',
  'observationAutoExecutes',
  'observationFetchesPublishesPinsReplicatesOrMaterializesPayload',
  'observationEmitsLayerSourcePressureReviewAsBytesOwnedArtifact'
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

export function createResourceArtifactVisibilityIndex(input = {}) {
  return normalizeResourceArtifactVisibilityIndex({
    artifactKind: input.artifactKind ?? RESOURCE_ARTIFACT_VISIBILITY_INDEX_ARTIFACT_KIND,
    schemaVersion: input.schemaVersion ?? RESOURCE_ARTIFACT_VISIBILITY_INDEX_SCHEMA,
    visibilityIndexRef: input.visibilityIndexRef,
    resourceRef: input.resourceRef,
    pointerRefs: input.pointerRefs,
    resolutionReceiptRefs: input.resolutionReceiptRefs,
    ownerRepoRef: input.ownerRepoRef ?? 'mesh-ecology-bytes',
    sourcePointerSchema: input.sourcePointerSchema ?? EXTERNAL_RESOURCE_POINTER_SCHEMA,
    sourceResolutionReceiptSchema: input.sourceResolutionReceiptSchema ?? EXTERNAL_RESOURCE_RESOLUTION_RECEIPT_SCHEMA,
    availabilityPosture: input.availabilityPosture,
    replicationPosture: input.replicationPosture,
    sourceRefs: input.sourceRefs,
    observerRef: input.observerRef,
    observedAt: input.observedAt,
    deviceDependencyPosture: input.deviceDependencyPosture,
    nonClaims: input.nonClaims
  })
}

export function validateResourceArtifactVisibilityIndex(input) {
  normalizeResourceArtifactVisibilityIndex(input)
  return input
}

export function createSourcePressureAdapterCandidate(input = {}) {
  return normalizeSourcePressureAdapterCandidate({
    artifactKind: input.artifactKind ?? SOURCE_PRESSURE_ADAPTER_CANDIDATE_ARTIFACT_KIND,
    schemaVersion: input.schemaVersion ?? SOURCE_PRESSURE_ADAPTER_CANDIDATE_SCHEMA,
    candidateRef: input.candidateRef,
    representativeSourcePressureRef: input.representativeSourcePressureRef,
    materialRefs: input.materialRefs,
    resourceRefs: input.resourceRefs,
    payloadVisibilityRefs: input.payloadVisibilityRefs,
    availabilityEvidenceRefs: input.availabilityEvidenceRefs,
    unavailabilityEvidenceRefs: input.unavailabilityEvidenceRefs,
    route: input.route ?? SOURCE_PRESSURE_ROUTE,
    createdByRef: input.createdByRef,
    createdAt: input.createdAt,
    acceptedContinuity: input.acceptedContinuity ?? false,
    layerMutation: input.layerMutation ?? false,
    storageWrite: input.storageWrite ?? false,
    edgeAuthorityCreated: input.edgeAuthorityCreated ?? false,
    repoAgentsDispatched: input.repoAgentsDispatched ?? false,
    autoExecute: input.autoExecute ?? false,
    payloadAction: input.payloadAction ?? false,
    bytesOwnedLayerSourcePressureReviewEmitted: input.bytesOwnedLayerSourcePressureReviewEmitted ?? false,
    nonClaims: input.nonClaims
  })
}

export function validateSourcePressureAdapterCandidate(input) {
  normalizeSourcePressureAdapterCandidate(input)
  return input
}

export function createSourcePressureAdapterOperatorDecision(input = {}) {
  return normalizeSourcePressureAdapterOperatorDecision({
    artifactKind: input.artifactKind ?? SOURCE_PRESSURE_ADAPTER_OPERATOR_DECISION_ARTIFACT_KIND,
    schemaVersion: input.schemaVersion ?? SOURCE_PRESSURE_ADAPTER_OPERATOR_DECISION_SCHEMA,
    decisionRef: input.decisionRef,
    candidateRef: input.candidateRef,
    operatorRef: input.operatorRef,
    decidedAt: input.decidedAt,
    decision: input.decision,
    reasonRefs: input.reasonRefs,
    route: input.route ?? SOURCE_PRESSURE_ROUTE,
    acceptedContinuity: input.acceptedContinuity ?? false,
    layerMutation: input.layerMutation ?? false,
    storageWrite: input.storageWrite ?? false,
    edgeAuthorityCreated: input.edgeAuthorityCreated ?? false,
    repoAgentsDispatched: input.repoAgentsDispatched ?? false,
    autoExecute: input.autoExecute ?? false,
    payloadAction: input.payloadAction ?? false,
    bytesOwnedLayerSourcePressureReviewEmitted: input.bytesOwnedLayerSourcePressureReviewEmitted ?? false,
    nonClaims: input.nonClaims
  })
}

export function validateSourcePressureAdapterOperatorDecision(input) {
  normalizeSourcePressureAdapterOperatorDecision(input)
  return input
}

export function createSourcePressureObservationResult(input = {}) {
  return normalizeSourcePressureObservationResult({
    artifactKind: input.artifactKind ?? SOURCE_PRESSURE_OBSERVATION_RESULT_ARTIFACT_KIND,
    schemaVersion: input.schemaVersion ?? SOURCE_PRESSURE_OBSERVATION_RESULT_SCHEMA,
    observationRef: input.observationRef,
    candidateRef: input.candidateRef,
    decisionRef: input.decisionRef,
    observerRef: input.observerRef,
    observedAt: input.observedAt,
    boundedSourcePressureArtifactRef: input.boundedSourcePressureArtifactRef,
    route: input.route ?? SOURCE_PRESSURE_ROUTE,
    reviewArtifactKind: input.reviewArtifactKind ?? 'layer_source_pressure_review',
    reviewSchema: input.reviewSchema ?? LAYER_SOURCE_PRESSURE_REVIEW_SCHEMA,
    reviewArtifactEmittedByBytes: input.reviewArtifactEmittedByBytes ?? false,
    acceptedContinuity: input.acceptedContinuity ?? false,
    layerMutation: input.layerMutation ?? false,
    storageWrite: input.storageWrite ?? false,
    edgeAuthorityCreated: input.edgeAuthorityCreated ?? false,
    repoAgentsDispatched: input.repoAgentsDispatched ?? false,
    autoExecute: input.autoExecute ?? false,
    payloadAction: input.payloadAction ?? false,
    nonClaims: input.nonClaims
  })
}

export function validateSourcePressureObservationResult(input) {
  normalizeSourcePressureObservationResult(input)
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

export function normalizeResourceArtifactVisibilityIndex(input) {
  assertAllowedKeys(input, 'ResourceArtifactVisibilityIndex', VISIBILITY_INDEX_FIELDS)

  if (input.artifactKind !== RESOURCE_ARTIFACT_VISIBILITY_INDEX_ARTIFACT_KIND) {
    throw new TypeError(`ResourceArtifactVisibilityIndex.artifactKind must be ${RESOURCE_ARTIFACT_VISIBILITY_INDEX_ARTIFACT_KIND}`)
  }

  if (input.schemaVersion !== RESOURCE_ARTIFACT_VISIBILITY_INDEX_SCHEMA) {
    throw new TypeError(`ResourceArtifactVisibilityIndex.schemaVersion must be ${RESOURCE_ARTIFACT_VISIBILITY_INDEX_SCHEMA}`)
  }

  assertNonEmptyString(input.visibilityIndexRef, 'ResourceArtifactVisibilityIndex.visibilityIndexRef')
  assertNonEmptyString(input.resourceRef, 'ResourceArtifactVisibilityIndex.resourceRef')
  assertNonEmptyString(input.ownerRepoRef, 'ResourceArtifactVisibilityIndex.ownerRepoRef')
  assertNonEmptyString(input.sourcePointerSchema, 'ResourceArtifactVisibilityIndex.sourcePointerSchema')
  assertNonEmptyString(input.sourceResolutionReceiptSchema, 'ResourceArtifactVisibilityIndex.sourceResolutionReceiptSchema')
  assertEnum(input.availabilityPosture, 'ResourceArtifactVisibilityIndex.availabilityPosture', RESOURCE_ARTIFACT_AVAILABILITY_POSTURES)
  assertEnum(input.replicationPosture, 'ResourceArtifactVisibilityIndex.replicationPosture', EXTERNAL_POINTER_REPLICATION_POSTURES)
  assertNonEmptyString(input.observerRef, 'ResourceArtifactVisibilityIndex.observerRef')
  assertNonEmptyString(input.observedAt, 'ResourceArtifactVisibilityIndex.observedAt')
  assertEnum(input.deviceDependencyPosture, 'ResourceArtifactVisibilityIndex.deviceDependencyPosture', RESOURCE_ARTIFACT_DEVICE_DEPENDENCY_POSTURES)

  return stripUndefined({
    artifactKind: RESOURCE_ARTIFACT_VISIBILITY_INDEX_ARTIFACT_KIND,
    schemaVersion: RESOURCE_ARTIFACT_VISIBILITY_INDEX_SCHEMA,
    visibilityIndexRef: input.visibilityIndexRef,
    resourceRef: input.resourceRef,
    pointerRefs: normalizeReceiptRefs(input.pointerRefs, 'ResourceArtifactVisibilityIndex.pointerRefs'),
    resolutionReceiptRefs: normalizeReceiptRefs(input.resolutionReceiptRefs, 'ResourceArtifactVisibilityIndex.resolutionReceiptRefs'),
    ownerRepoRef: input.ownerRepoRef,
    sourcePointerSchema: input.sourcePointerSchema,
    sourceResolutionReceiptSchema: input.sourceResolutionReceiptSchema,
    availabilityPosture: input.availabilityPosture,
    replicationPosture: input.replicationPosture,
    sourceRefs: normalizeReceiptRefs(input.sourceRefs, 'ResourceArtifactVisibilityIndex.sourceRefs'),
    observerRef: input.observerRef,
    observedAt: input.observedAt,
    deviceDependencyPosture: input.deviceDependencyPosture,
    nonClaims: normalizeVisibilityIndexNonClaims(input.nonClaims)
  })
}

function normalizeVisibilityIndexNonClaims(nonClaims) {
  assertObject(nonClaims, 'ResourceArtifactVisibilityIndex.nonClaims')

  for (const field of VISIBILITY_INDEX_NON_CLAIM_FIELDS) {
    if (nonClaims[field] !== false) {
      throw new TypeError(`ResourceArtifactVisibilityIndex.nonClaims.${field} must be false`)
    }
  }

  return Object.fromEntries(VISIBILITY_INDEX_NON_CLAIM_FIELDS.map((field) => [field, false]))
}

export function normalizeSourcePressureAdapterCandidate(input) {
  assertAllowedKeys(input, 'SourcePressureAdapterCandidate', SOURCE_PRESSURE_CANDIDATE_FIELDS)

  if (input.artifactKind !== SOURCE_PRESSURE_ADAPTER_CANDIDATE_ARTIFACT_KIND) {
    throw new TypeError(
      `SourcePressureAdapterCandidate.artifactKind must be ${SOURCE_PRESSURE_ADAPTER_CANDIDATE_ARTIFACT_KIND}`
    )
  }

  if (input.schemaVersion !== SOURCE_PRESSURE_ADAPTER_CANDIDATE_SCHEMA) {
    throw new TypeError(`SourcePressureAdapterCandidate.schemaVersion must be ${SOURCE_PRESSURE_ADAPTER_CANDIDATE_SCHEMA}`)
  }

  assertNonEmptyString(input.candidateRef, 'SourcePressureAdapterCandidate.candidateRef')
  assertNonEmptyString(
    input.representativeSourcePressureRef,
    'SourcePressureAdapterCandidate.representativeSourcePressureRef'
  )
  assertNonEmptyString(input.createdByRef, 'SourcePressureAdapterCandidate.createdByRef')
  assertNonEmptyString(input.createdAt, 'SourcePressureAdapterCandidate.createdAt')
  assertSourcePressureActionFalseFields(input, 'SourcePressureAdapterCandidate')

  const materialRefs = normalizeSourcePressureRefs(input.materialRefs, 'SourcePressureAdapterCandidate.materialRefs')
  const resourceRefs = normalizeSourcePressureRefs(input.resourceRefs, 'SourcePressureAdapterCandidate.resourceRefs')
  const payloadVisibilityRefs = normalizeSourcePressureRefs(
    input.payloadVisibilityRefs,
    'SourcePressureAdapterCandidate.payloadVisibilityRefs'
  )
  const availabilityEvidenceRefs = normalizeSourcePressureRefs(
    input.availabilityEvidenceRefs,
    'SourcePressureAdapterCandidate.availabilityEvidenceRefs'
  )
  const unavailabilityEvidenceRefs = normalizeSourcePressureRefs(
    input.unavailabilityEvidenceRefs,
    'SourcePressureAdapterCandidate.unavailabilityEvidenceRefs'
  )

  assertSourcePressureHasRefs('SourcePressureAdapterCandidate', [
    materialRefs,
    resourceRefs,
    payloadVisibilityRefs,
    availabilityEvidenceRefs,
    unavailabilityEvidenceRefs
  ])

  return stripUndefined({
    artifactKind: SOURCE_PRESSURE_ADAPTER_CANDIDATE_ARTIFACT_KIND,
    schemaVersion: SOURCE_PRESSURE_ADAPTER_CANDIDATE_SCHEMA,
    candidateRef: input.candidateRef,
    representativeSourcePressureRef: input.representativeSourcePressureRef,
    materialRefs,
    resourceRefs,
    payloadVisibilityRefs,
    availabilityEvidenceRefs,
    unavailabilityEvidenceRefs,
    route: normalizeSourcePressureRoute(input.route, 'SourcePressureAdapterCandidate.route'),
    createdByRef: input.createdByRef,
    createdAt: input.createdAt,
    acceptedContinuity: false,
    layerMutation: false,
    storageWrite: false,
    edgeAuthorityCreated: false,
    repoAgentsDispatched: false,
    autoExecute: false,
    payloadAction: false,
    bytesOwnedLayerSourcePressureReviewEmitted: false,
    nonClaims: normalizeSourcePressureNonClaims(
      input.nonClaims,
      SOURCE_PRESSURE_CANDIDATE_NON_CLAIM_FIELDS,
      'SourcePressureAdapterCandidate.nonClaims'
    )
  })
}

export function normalizeSourcePressureAdapterOperatorDecision(input) {
  assertAllowedKeys(input, 'SourcePressureAdapterOperatorDecision', SOURCE_PRESSURE_DECISION_FIELDS)

  if (input.artifactKind !== SOURCE_PRESSURE_ADAPTER_OPERATOR_DECISION_ARTIFACT_KIND) {
    throw new TypeError(
      `SourcePressureAdapterOperatorDecision.artifactKind must be ${SOURCE_PRESSURE_ADAPTER_OPERATOR_DECISION_ARTIFACT_KIND}`
    )
  }

  if (input.schemaVersion !== SOURCE_PRESSURE_ADAPTER_OPERATOR_DECISION_SCHEMA) {
    throw new TypeError(
      `SourcePressureAdapterOperatorDecision.schemaVersion must be ${SOURCE_PRESSURE_ADAPTER_OPERATOR_DECISION_SCHEMA}`
    )
  }

  assertNonEmptyString(input.decisionRef, 'SourcePressureAdapterOperatorDecision.decisionRef')
  assertNonEmptyString(input.candidateRef, 'SourcePressureAdapterOperatorDecision.candidateRef')
  assertNonEmptyString(input.operatorRef, 'SourcePressureAdapterOperatorDecision.operatorRef')
  assertNonEmptyString(input.decidedAt, 'SourcePressureAdapterOperatorDecision.decidedAt')
  assertEnum(input.decision, 'SourcePressureAdapterOperatorDecision.decision', SOURCE_PRESSURE_OPERATOR_DECISIONS)
  assertSourcePressureActionFalseFields(input, 'SourcePressureAdapterOperatorDecision')

  return stripUndefined({
    artifactKind: SOURCE_PRESSURE_ADAPTER_OPERATOR_DECISION_ARTIFACT_KIND,
    schemaVersion: SOURCE_PRESSURE_ADAPTER_OPERATOR_DECISION_SCHEMA,
    decisionRef: input.decisionRef,
    candidateRef: input.candidateRef,
    operatorRef: input.operatorRef,
    decidedAt: input.decidedAt,
    decision: input.decision,
    reasonRefs: normalizeSourcePressureRefs(input.reasonRefs, 'SourcePressureAdapterOperatorDecision.reasonRefs'),
    route: normalizeSourcePressureRoute(input.route, 'SourcePressureAdapterOperatorDecision.route'),
    acceptedContinuity: false,
    layerMutation: false,
    storageWrite: false,
    edgeAuthorityCreated: false,
    repoAgentsDispatched: false,
    autoExecute: false,
    payloadAction: false,
    bytesOwnedLayerSourcePressureReviewEmitted: false,
    nonClaims: normalizeSourcePressureNonClaims(
      input.nonClaims,
      SOURCE_PRESSURE_DECISION_NON_CLAIM_FIELDS,
      'SourcePressureAdapterOperatorDecision.nonClaims'
    )
  })
}

export function normalizeSourcePressureObservationResult(input) {
  assertAllowedKeys(input, 'SourcePressureObservationResult', SOURCE_PRESSURE_OBSERVATION_RESULT_FIELDS)

  if (input.artifactKind !== SOURCE_PRESSURE_OBSERVATION_RESULT_ARTIFACT_KIND) {
    throw new TypeError(
      `SourcePressureObservationResult.artifactKind must be ${SOURCE_PRESSURE_OBSERVATION_RESULT_ARTIFACT_KIND}`
    )
  }

  if (input.schemaVersion !== SOURCE_PRESSURE_OBSERVATION_RESULT_SCHEMA) {
    throw new TypeError(`SourcePressureObservationResult.schemaVersion must be ${SOURCE_PRESSURE_OBSERVATION_RESULT_SCHEMA}`)
  }

  assertNonEmptyString(input.observationRef, 'SourcePressureObservationResult.observationRef')
  assertNonEmptyString(input.candidateRef, 'SourcePressureObservationResult.candidateRef')
  assertNonEmptyString(input.decisionRef, 'SourcePressureObservationResult.decisionRef')
  assertNonEmptyString(input.observerRef, 'SourcePressureObservationResult.observerRef')
  assertNonEmptyString(input.observedAt, 'SourcePressureObservationResult.observedAt')
  assertNonEmptyString(
    input.boundedSourcePressureArtifactRef,
    'SourcePressureObservationResult.boundedSourcePressureArtifactRef'
  )
  assertNonEmptyString(input.reviewArtifactKind, 'SourcePressureObservationResult.reviewArtifactKind')
  assertNonEmptyString(input.reviewSchema, 'SourcePressureObservationResult.reviewSchema')
  assertBoolean(input.reviewArtifactEmittedByBytes, 'SourcePressureObservationResult.reviewArtifactEmittedByBytes')
  assertSourcePressureActionFalseFields(input, 'SourcePressureObservationResult')

  if (input.reviewArtifactKind !== 'layer_source_pressure_review') {
    throw new TypeError('SourcePressureObservationResult.reviewArtifactKind must be layer_source_pressure_review')
  }

  if (input.reviewSchema !== LAYER_SOURCE_PRESSURE_REVIEW_SCHEMA) {
    throw new TypeError(`SourcePressureObservationResult.reviewSchema must be ${LAYER_SOURCE_PRESSURE_REVIEW_SCHEMA}`)
  }

  if (input.reviewArtifactEmittedByBytes !== false) {
    throw new TypeError('SourcePressureObservationResult.reviewArtifactEmittedByBytes must be false')
  }

  return stripUndefined({
    artifactKind: SOURCE_PRESSURE_OBSERVATION_RESULT_ARTIFACT_KIND,
    schemaVersion: SOURCE_PRESSURE_OBSERVATION_RESULT_SCHEMA,
    observationRef: input.observationRef,
    candidateRef: input.candidateRef,
    decisionRef: input.decisionRef,
    observerRef: input.observerRef,
    observedAt: input.observedAt,
    boundedSourcePressureArtifactRef: input.boundedSourcePressureArtifactRef,
    route: normalizeSourcePressureRoute(input.route, 'SourcePressureObservationResult.route'),
    reviewArtifactKind: 'layer_source_pressure_review',
    reviewSchema: LAYER_SOURCE_PRESSURE_REVIEW_SCHEMA,
    reviewArtifactEmittedByBytes: false,
    acceptedContinuity: false,
    layerMutation: false,
    storageWrite: false,
    edgeAuthorityCreated: false,
    repoAgentsDispatched: false,
    autoExecute: false,
    payloadAction: false,
    nonClaims: normalizeSourcePressureNonClaims(
      input.nonClaims,
      SOURCE_PRESSURE_OBSERVATION_NON_CLAIM_FIELDS,
      'SourcePressureObservationResult.nonClaims'
    )
  })
}

function normalizeSourcePressureRefs(refs, label) {
  if (refs === undefined) return []

  if (!Array.isArray(refs)) {
    throw new TypeError(`${label} must be an array`)
  }

  return refs.map((ref, index) => {
    assertNonEmptyString(ref, `${label}[${index}]`)
    return ref
  })
}

function assertSourcePressureHasRefs(label, refGroups) {
  const count = refGroups.reduce((total, refs) => total + refs.length, 0)

  if (count === 0) {
    throw new TypeError(`${label} must include at least one bounded source-pressure ref`)
  }
}

function normalizeSourcePressureRoute(route, label) {
  assertAllowedKeys(route, label, new Set(['source', 'review', 'reviewSchema', 'mediation', 'terminal']))

  if (route.source !== SOURCE_PRESSURE_ROUTE.source) {
    throw new TypeError(`${label}.source must be ${SOURCE_PRESSURE_ROUTE.source}`)
  }

  if (route.review !== SOURCE_PRESSURE_ROUTE.review) {
    throw new TypeError(`${label}.review must be ${SOURCE_PRESSURE_ROUTE.review}`)
  }

  if (route.reviewSchema !== SOURCE_PRESSURE_ROUTE.reviewSchema) {
    throw new TypeError(`${label}.reviewSchema must be ${SOURCE_PRESSURE_ROUTE.reviewSchema}`)
  }

  if (route.mediation !== SOURCE_PRESSURE_ROUTE.mediation) {
    throw new TypeError(`${label}.mediation must be ${SOURCE_PRESSURE_ROUTE.mediation}`)
  }

  if (route.terminal !== SOURCE_PRESSURE_ROUTE.terminal) {
    throw new TypeError(`${label}.terminal must be ${SOURCE_PRESSURE_ROUTE.terminal}`)
  }

  return { ...SOURCE_PRESSURE_ROUTE }
}

function assertSourcePressureActionFalseFields(input, label) {
  for (const field of SOURCE_PRESSURE_ACTION_FALSE_FIELDS) {
    assertBoolean(input[field], `${label}.${field}`)

    if (input[field] !== false) {
      throw new TypeError(`${label}.${field} must be false`)
    }
  }
}

function normalizeSourcePressureNonClaims(nonClaims, fields, label) {
  assertObject(nonClaims, label)

  for (const field of fields) {
    if (nonClaims[field] !== false) {
      throw new TypeError(`${label}.${field} must be false`)
    }
  }

  return Object.fromEntries(fields.map((field) => [field, false]))
}
