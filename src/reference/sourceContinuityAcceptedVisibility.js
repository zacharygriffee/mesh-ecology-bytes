import { createHash } from 'node:crypto'

export const BYTES_FILE_RESOURCE_SOURCE_CONTINUITY_ACCEPTED_VISIBILITY_KIND =
  'bytes_file_resource_source_continuity_accepted_visibility'
export const BYTES_FILE_RESOURCE_SOURCE_CONTINUITY_ACCEPTED_VISIBILITY_SCHEMA =
  'bytes.file_resource_source_continuity_accepted_visibility.v0'

const REQUIRED_FALSE_NONCLAIMS = {
  bytesVisibilityIsCanon: false,
  bytesVisibilityIsAdmission: false,
  bytesVisibilityIsSourceContinuity: false,
  storageRefIsAdmission: false,
  externalReferenceIsCanon: false,
  materialAvailabilityIsDurability: false,
  layerAuthority: false,
  authority: false
}

export function createFileResourceSourceContinuityAcceptedVisibility({
  priorBytesVisibility,
  layerAcceptanceAppend,
  causalAcceptanceObservation,
  observedAt = new Date().toISOString()
} = {}) {
  const issues = sourceIssues(priorBytesVisibility, layerAcceptanceAppend, causalAcceptanceObservation)
  const visible = issues.length === 0
  const short = stableHash({
    priorBytesVisibilityRef: priorBytesVisibility?.evidenceRef,
    layerAcceptanceAppendRef: layerAcceptanceAppend?.appendRef,
    causalAcceptanceObservationRef: causalAcceptanceObservation?.observationId
  }).slice(0, 16)
  const visibility = {
    artifactKind: BYTES_FILE_RESOURCE_SOURCE_CONTINUITY_ACCEPTED_VISIBILITY_KIND,
    schemaVersion: BYTES_FILE_RESOURCE_SOURCE_CONTINUITY_ACCEPTED_VISIBILITY_SCHEMA,
    visibilityRef: `bytes-file-resource-source-continuity-accepted-visibility:${short}`,
    observedAt,
    proofRung: 'local_supplied_material',
    visibilityStatus: visible
      ? 'bytes_material_visible_after_layer_source_continuity_acceptance'
      : 'bytes_material_visibility_after_acceptance_blocked',
    sourceRefs: {
      priorBytesVisibilityRef: priorBytesVisibility?.evidenceRef ?? null,
      priorBytesVisibilityHash: priorBytesVisibility?.evidenceHash ?? null,
      layerAcceptanceAppendRef: layerAcceptanceAppend?.appendRef ?? null,
      layerAcceptanceAppendHash: layerAcceptanceAppend?.appendHash ?? null,
      causalAcceptanceObservationRef: causalAcceptanceObservation?.observationId ?? null,
      causalAcceptanceObservationHash: causalAcceptanceObservation?.observationHash ?? null,
      pointerRef: priorBytesVisibility?.pointerRef ?? null,
      resolutionReceiptRef: priorBytesVisibility?.resolutionReceipt?.receiptRef ?? null,
      visibilityIndexRef: priorBytesVisibility?.visibilityIndex?.visibilityIndexRef ?? null
    },
    materialVisibility: {
      pointerStillVisible: priorBytesVisibility?.byteResourceVisibility?.pointerVisible === true,
      payloadResolvableByBytes: priorBytesVisibility?.byteResourceVisibility?.payloadResolvableByBytes === true,
      layerSourceContinuityAccepted: layerAcceptanceAppend?.acceptedSourceContinuity?.sourceContinuityAccepted === true,
      causalAcceptanceObserved: causalAcceptanceObservation?.status === 'file-resource-source-continuity-acceptance-compatible',
      payloadImported: false,
      payloadInline: false,
      resourceCanon: false,
      layerAdmission: false,
      productionDurability: false
    },
    issues,
    nonClaims: REQUIRED_FALSE_NONCLAIMS
  }
  visibility.visibilityHash = `sha256:${stableHash(withoutHash(visibility))}`
  validateFileResourceSourceContinuityAcceptedVisibility(visibility)
  return visibility
}

export function validateFileResourceSourceContinuityAcceptedVisibility(visibility) {
  if (visibility?.artifactKind !== BYTES_FILE_RESOURCE_SOURCE_CONTINUITY_ACCEPTED_VISIBILITY_KIND) {
    throw new TypeError(`FileResourceSourceContinuityAcceptedVisibility.artifactKind must be ${BYTES_FILE_RESOURCE_SOURCE_CONTINUITY_ACCEPTED_VISIBILITY_KIND}`)
  }
  if (visibility?.schemaVersion !== BYTES_FILE_RESOURCE_SOURCE_CONTINUITY_ACCEPTED_VISIBILITY_SCHEMA) {
    throw new TypeError(`FileResourceSourceContinuityAcceptedVisibility.schemaVersion must be ${BYTES_FILE_RESOURCE_SOURCE_CONTINUITY_ACCEPTED_VISIBILITY_SCHEMA}`)
  }
  for (const [field, value] of Object.entries(REQUIRED_FALSE_NONCLAIMS)) {
    if (visibility.nonClaims?.[field] !== value) {
      throw new TypeError(`FileResourceSourceContinuityAcceptedVisibility.nonClaims.${field} must be false`)
    }
  }
  for (const field of ['payloadImported', 'payloadInline', 'resourceCanon', 'layerAdmission', 'productionDurability']) {
    if (visibility.materialVisibility?.[field] !== false) {
      throw new TypeError(`FileResourceSourceContinuityAcceptedVisibility.materialVisibility.${field} must be false`)
    }
  }
  return visibility
}

function sourceIssues(priorBytesVisibility = {}, layerAcceptanceAppend = {}, causalAcceptanceObservation = {}) {
  const issues = []
  if (priorBytesVisibility.artifactKind !== 'bytes_studio_file_resource_lift_visibility_evidence') issues.push('prior_bytes_visibility_kind_invalid')
  if (priorBytesVisibility.visibilityStatus !== 'studio_lift_source_pointer_and_payload_visibility_visible') issues.push('prior_bytes_visibility_not_visible')
  if (priorBytesVisibility.byteResourceVisibility?.payloadResolvableByBytes !== true) issues.push('payload_not_resolvable_by_bytes')
  if (layerAcceptanceAppend.artifactKind !== 'layer_file_resource_source_continuity_acceptance_append') issues.push('layer_acceptance_append_kind_invalid')
  if (layerAcceptanceAppend.appendStatus !== 'layer_file_resource_source_continuity_acceptance_appended') issues.push('layer_acceptance_append_not_appended')
  if (layerAcceptanceAppend.acceptedSourceContinuity?.sourceContinuityAccepted !== true) issues.push('source_continuity_not_accepted_by_layer')
  if (causalAcceptanceObservation.artifactKind !== 'causal_file_resource_source_continuity_acceptance_observation') issues.push('causal_acceptance_observation_kind_invalid')
  if (causalAcceptanceObservation.status !== 'file-resource-source-continuity-acceptance-compatible') issues.push('causal_acceptance_not_compatible')
  if (priorBytesVisibility.nonClaims?.storageRefIsAdmission !== false) issues.push('prior_bytes_claims_storage_ref_as_admission')
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

function withoutHash(value) {
  const copy = { ...value }
  delete copy.visibilityHash
  return copy
}
