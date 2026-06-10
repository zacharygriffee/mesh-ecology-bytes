import { createHash } from 'node:crypto'

import {
  EXTERNAL_RESOURCE_POINTER_SCHEMA,
  EXTERNAL_RESOURCE_RESOLUTION_RECEIPT_SCHEMA,
  createExternalResourcePointer,
  createExternalResourceResolutionReceipt,
  createResourceArtifactVisibilityIndex,
  validateExternalResourcePointer,
  validateExternalResourceResolutionReceipt,
  validateResourceArtifactVisibilityIndex
} from './externalPointer.js'

export const STUDIO_FILE_RESOURCE_LIFT_VISIBILITY_EVIDENCE_KIND =
  'bytes_studio_file_resource_lift_visibility_evidence'
export const STUDIO_FILE_RESOURCE_LIFT_VISIBILITY_EVIDENCE_SCHEMA =
  'bytes.studio_file_resource_lift_visibility_evidence.local.v0'

const POINTER_NONCLAIMS = {
  pointerIsTruth: false,
  blobPresenceIsAcceptance: false,
  contentAvailabilityIsContinuity: false,
  pathIsCanonical: false,
  resourceRefIsAuthority: false
}

const RESOLUTION_NONCLAIMS = {
  resolutionIsTruth: false,
  payloadAvailabilityIsAcceptance: false,
  receiptIsContinuity: false,
  consumerAcceptanceClaimed: false,
  pathIsCanonical: false
}

const VISIBILITY_NONCLAIMS = {
  visibilityIndexIsTruth: false,
  visibilityIndexIsAuthority: false,
  visibilityIndexIsAcceptedContinuity: false,
  visibilityIndexIsResultContinuity: false,
  visibilityIndexIsOperatorApproval: false,
  visibilityIndexIsExecution: false,
  visibilityIndexIsProductionReadiness: false,
  visibilityIndexIsMeshSettlement: false,
  pointerVisibilityIsPayloadValidity: false,
  resolutionVisibilityIsResultValidity: false
}

const EVIDENCE_NONCLAIMS = {
  pointerVisibilityIsPayloadValidity: false,
  bytesVisibilityIsLayerTruth: false,
  payloadResolvabilityIsAdmission: false,
  storageRefIsAdmission: false,
  externalReferenceIsCanon: false,
  acceptedContinuity: false,
  layerAdmission: false,
  materializationProof: false,
  authority: false
}

export function createStudioFileResourceLiftVisibilityEvidence({
  studioCandidate,
  observedAt = new Date().toISOString(),
  originDeviceRef = 'local-device:studio-operator-workstation',
  resolverRef = 'bytes-resolver:studio-lift-preflight-local',
  observerRef = 'bytes-observer:studio-lift-preflight-local'
} = {}) {
  const issues = getStudioCandidateIssues(studioCandidate)
  if (issues.length > 0) {
    throw new TypeError(`Studio lift source candidate is not usable by Bytes: ${issues.join(', ')}`)
  }

  const short = shortHash({
    liftSourceCandidateId: studioCandidate.liftSourceCandidateId,
    contentHash: studioCandidate.contentHash
  })
  const resourceRef = `bytes-resource:studio-lift-source-candidate:${studioCandidate.liftSourceCandidateId}`
  const pointerRef = `bytes-external-resource-pointer:studio-lift-source-candidate:${short}`
  const receiptRef = `bytes-resource-resolution-receipt:studio-lift-source-candidate:${short}`
  const visibilityIndexRef = `bytes-resource-artifact-visibility-index:studio-lift-source-candidate:${short}`
  const sourceRefs = [
    `studio-file-resource-lift-source-candidate:${studioCandidate.liftSourceCandidateId}`,
    ...studioCandidate.byteDescriptorProposalRefs.map((ref) => `studio-byte-descriptor-proposal:${ref.id}`),
    ...studioCandidate.resourceRefCandidateRefs.map((ref) => `studio-resource-ref-candidate:${ref.id}`)
  ]

  const pointer = createExternalResourcePointer({
    resourceRef,
    resourceKind: 'media',
    pointerKind: 'bytes_ref',
    pointer: {
      bytesRef: `studio-byte-descriptor-proposal:${studioCandidate.byteDescriptorProposalRefs[0].id}`
    },
    contentHash: studioCandidate.contentHash,
    byteLength: studioCandidate.byteLength,
    mediaType: studioCandidate.mediaType,
    originDeviceRef,
    availability: 'device_local',
    replicationPosture: 'device_dependent_scaffold',
    sourceRefs,
    nonClaims: POINTER_NONCLAIMS
  })

  const resolutionReceipt = createExternalResourceResolutionReceipt({
    receiptRef,
    sourceResourceRef: resourceRef,
    sourcePointerRef: pointerRef,
    resolverRef,
    resolvedAt: observedAt,
    resolutionStatus: 'resolved',
    contentHash: studioCandidate.contentHash,
    byteLength: studioCandidate.byteLength,
    mediaType: studioCandidate.mediaType,
    evidenceRefs: [pointerRef],
    sourceRefs,
    payloadImported: false,
    payloadInline: false,
    acceptedContinuity: false,
    nonClaims: RESOLUTION_NONCLAIMS
  })

  const visibilityIndex = createResourceArtifactVisibilityIndex({
    visibilityIndexRef,
    resourceRef,
    pointerRefs: [pointerRef],
    resolutionReceiptRefs: [receiptRef],
    availabilityPosture: 'payload_resolvable_by_bytes',
    replicationPosture: 'device_dependent_scaffold',
    sourceRefs: [pointerRef, receiptRef, ...sourceRefs],
    observerRef,
    observedAt,
    deviceDependencyPosture: 'device_dependent_scaffold',
    nonClaims: VISIBILITY_NONCLAIMS
  })

  const evidence = {
    artifactKind: STUDIO_FILE_RESOURCE_LIFT_VISIBILITY_EVIDENCE_KIND,
    schemaVersion: STUDIO_FILE_RESOURCE_LIFT_VISIBILITY_EVIDENCE_SCHEMA,
    evidenceRef: `bytes-studio-file-resource-lift-visibility-evidence:${short}`,
    observedAt,
    proofRung: 'local_supplied_material',
    visibilityStatus: 'studio_lift_source_pointer_and_payload_visibility_visible',
    sourceStudioCandidateRef: studioCandidate.liftSourceCandidateId,
    sourceStudioCandidateHash: stableHash(studioCandidate),
    pointer,
    pointerRef,
    resolutionReceipt,
    visibilityIndex,
    byteResourceVisibility: {
      pointerVisible: true,
      payloadResolvableByBytes: true,
      payloadImported: false,
      payloadInline: false,
      resourceCanon: false,
      layerAdmission: false,
      acceptedContinuity: false,
      materializationProof: false
    },
    nonClaims: EVIDENCE_NONCLAIMS
  }
  evidence.evidenceHash = `sha256:${stableHash(withoutHash(evidence))}`
  validateStudioFileResourceLiftVisibilityEvidence(evidence)
  return evidence
}

export function validateStudioFileResourceLiftVisibilityEvidence(evidence) {
  if (evidence?.artifactKind !== STUDIO_FILE_RESOURCE_LIFT_VISIBILITY_EVIDENCE_KIND) {
    throw new TypeError(`StudioFileResourceLiftVisibilityEvidence.artifactKind must be ${STUDIO_FILE_RESOURCE_LIFT_VISIBILITY_EVIDENCE_KIND}`)
  }
  if (evidence?.schemaVersion !== STUDIO_FILE_RESOURCE_LIFT_VISIBILITY_EVIDENCE_SCHEMA) {
    throw new TypeError(`StudioFileResourceLiftVisibilityEvidence.schemaVersion must be ${STUDIO_FILE_RESOURCE_LIFT_VISIBILITY_EVIDENCE_SCHEMA}`)
  }
  validateExternalResourcePointer(evidence.pointer)
  validateExternalResourceResolutionReceipt(evidence.resolutionReceipt)
  validateResourceArtifactVisibilityIndex(evidence.visibilityIndex)
  if (evidence.pointer.schemaVersion !== EXTERNAL_RESOURCE_POINTER_SCHEMA) {
    throw new TypeError('StudioFileResourceLiftVisibilityEvidence.pointer schema invalid')
  }
  if (evidence.resolutionReceipt.schemaVersion !== EXTERNAL_RESOURCE_RESOLUTION_RECEIPT_SCHEMA) {
    throw new TypeError('StudioFileResourceLiftVisibilityEvidence.resolutionReceipt schema invalid')
  }
  for (const [field, value] of Object.entries(EVIDENCE_NONCLAIMS)) {
    if (evidence.nonClaims?.[field] !== value) {
      throw new TypeError(`StudioFileResourceLiftVisibilityEvidence.nonClaims.${field} must be false`)
    }
  }
  for (const field of [
    'payloadImported',
    'payloadInline',
    'resourceCanon',
    'layerAdmission',
    'acceptedContinuity',
    'materializationProof'
  ]) {
    if (evidence.byteResourceVisibility?.[field] !== false) {
      throw new TypeError(`StudioFileResourceLiftVisibilityEvidence.byteResourceVisibility.${field} must be false`)
    }
  }
  return evidence
}

function getStudioCandidateIssues(candidate) {
  const issues = []
  if (candidate?.schema !== 'studio_file_resource_lift_source_candidate.local.v0') issues.push('candidate_schema_invalid')
  if (candidate?.candidateStatus !== 'source_candidate_only_not_admitted') issues.push('candidate_status_overclaim')
  if (!candidate?.liftSourceCandidateId) issues.push('candidate_id_required')
  if (!Array.isArray(candidate?.byteDescriptorProposalRefs) || candidate.byteDescriptorProposalRefs.length === 0) {
    issues.push('byte_descriptor_proposal_ref_required')
  }
  if (!Array.isArray(candidate?.resourceRefCandidateRefs) || candidate.resourceRefCandidateRefs.length === 0) {
    issues.push('resource_ref_candidate_ref_required')
  }
  if (candidate?.resourceAdmission !== false) issues.push('candidate_claims_resource_admission')
  if (candidate?.layerAdmission !== false) issues.push('candidate_claims_layer_admission')
  if (candidate?.acceptedContinuity !== false) issues.push('candidate_claims_accepted_continuity')
  if (candidate?.meshTruth !== false) issues.push('candidate_claims_mesh_truth')
  if (candidate?.authority !== false) issues.push('candidate_claims_authority')
  if (candidate?.nonClaims?.localPathIsCanon !== false) issues.push('candidate_local_path_canon_overclaim')
  if (candidate?.nonClaims?.externalReferenceIsCanon !== false) issues.push('candidate_external_reference_canon_overclaim')
  if (candidate?.nonClaims?.storageRefIsAdmission !== false) issues.push('candidate_storage_ref_admission_overclaim')
  if (candidate?.nonClaims?.viewIsSourceContinuity !== false) issues.push('candidate_view_source_continuity_overclaim')
  return issues
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function stableHash(value) {
  return createHash('sha256').update(stableJson(value), 'utf8').digest('hex')
}

function shortHash(value) {
  return stableHash(value).slice(0, 16)
}

function withoutHash(value) {
  const copy = { ...value }
  delete copy.evidenceHash
  return copy
}
