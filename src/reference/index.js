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
  LAYER_SOURCE_PRESSURE_REVIEW_SCHEMA,
  SOURCE_PRESSURE_ADAPTER_CANDIDATE_ARTIFACT_KIND,
  SOURCE_PRESSURE_ADAPTER_CANDIDATE_SCHEMA,
  SOURCE_PRESSURE_ADAPTER_OPERATOR_DECISION_ARTIFACT_KIND,
  SOURCE_PRESSURE_ADAPTER_OPERATOR_DECISION_SCHEMA,
  SOURCE_PRESSURE_OBSERVATION_RESULT_ARTIFACT_KIND,
  SOURCE_PRESSURE_OBSERVATION_RESULT_SCHEMA,
  SOURCE_PRESSURE_OPERATOR_DECISIONS,
  SOURCE_PRESSURE_ROUTE,
  createExternalResourcePointer,
  createExternalResourceResolutionReceipt,
  createResourceArtifactVisibilityIndex,
  createSourcePressureAdapterCandidate,
  createSourcePressureAdapterOperatorDecision,
  createSourcePressureObservationResult,
  normalizeExternalResourcePointer,
  normalizeExternalResourceResolutionReceipt,
  normalizeResourceArtifactVisibilityIndex,
  normalizeSourcePressureAdapterCandidate,
  normalizeSourcePressureAdapterOperatorDecision,
  normalizeSourcePressureObservationResult,
  validateExternalResourceResolutionReceipt,
  validateExternalResourcePointer,
  validateResourceArtifactVisibilityIndex,
  validateSourcePressureAdapterCandidate,
  validateSourcePressureAdapterOperatorDecision,
  validateSourcePressureObservationResult
} from './externalPointer.js'
export {
  STUDIO_FILE_RESOURCE_LIFT_VISIBILITY_EVIDENCE_KIND,
  STUDIO_FILE_RESOURCE_LIFT_VISIBILITY_EVIDENCE_SCHEMA,
  createStudioFileResourceLiftVisibilityEvidence,
  validateStudioFileResourceLiftVisibilityEvidence
} from './studioLiftVisibility.js'
export {
  BYTES_FILE_RESOURCE_SOURCE_CONTINUITY_ACCEPTED_VISIBILITY_KIND,
  BYTES_FILE_RESOURCE_SOURCE_CONTINUITY_ACCEPTED_VISIBILITY_SCHEMA,
  createFileResourceSourceContinuityAcceptedVisibility,
  validateFileResourceSourceContinuityAcceptedVisibility
} from './sourceContinuityAcceptedVisibility.js'

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
