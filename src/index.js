import * as descriptorApi from './descriptor/index.js'
import * as errorsApi from './errors.js'
import * as materializationApi from './materialization/index.js'
import * as referenceApi from './reference/index.js'
import * as reviewApi from './review/index.js'
import * as integrationApi from './integration/index.js'
import * as objectApi from './object/index.js'
import * as transportApi from './transport/index.js'

export {
  BYTE_DESCRIPTOR_SCHEMA,
  createByteDescriptor,
  decodeByteDescriptor,
  encodeByteDescriptor,
  normalizeByteDescriptor,
  validateByteDescriptor
} from './descriptor/index.js'
export {
  ERROR_CODES,
  MeshBytesError,
  createMeshBytesError,
  isMeshBytesError
} from './errors.js'
export {
  MATERIALIZATION_MODES,
  READINESS_STATES,
  VISIBILITY_LEVELS,
  createMaterializationHints,
  createMaterializationRequest,
  materializeImmutableObject,
  resolveMaterializationPlan,
  validateReadinessState,
  validateMaterializationHints,
  validateMaterializationPlan,
  validateMaterializationRequest
} from './materialization/index.js'
export {
  BYTE_REFERENCE_SCHEMA,
  EXTERNAL_POINTER_AVAILABILITY,
  EXTERNAL_POINTER_KINDS,
  EXTERNAL_POINTER_REPLICATION_POSTURES,
  EXTERNAL_RESOURCE_KINDS,
  EXTERNAL_RESOURCE_POINTER_ARTIFACT_KIND,
  EXTERNAL_RESOURCE_POINTER_SCHEMA,
  EXTERNAL_RESOURCE_RESOLUTION_RECEIPT_ARTIFACT_KIND,
  EXTERNAL_RESOURCE_RESOLUTION_RECEIPT_SCHEMA,
  EXTERNAL_RESOURCE_RESOLUTION_STATUSES,
  LAYER_SOURCE_PRESSURE_REVIEW_SCHEMA,
  RESOURCE_ARTIFACT_AVAILABILITY_POSTURES,
  RESOURCE_ARTIFACT_DEVICE_DEPENDENCY_POSTURES,
  RESOURCE_ARTIFACT_VISIBILITY_INDEX_ARTIFACT_KIND,
  RESOURCE_ARTIFACT_VISIBILITY_INDEX_SCHEMA,
  SOURCE_PRESSURE_ADAPTER_CANDIDATE_ARTIFACT_KIND,
  SOURCE_PRESSURE_ADAPTER_CANDIDATE_SCHEMA,
  SOURCE_PRESSURE_ADAPTER_OPERATOR_DECISION_ARTIFACT_KIND,
  SOURCE_PRESSURE_ADAPTER_OPERATOR_DECISION_SCHEMA,
  SOURCE_PRESSURE_OBSERVATION_RESULT_ARTIFACT_KIND,
  SOURCE_PRESSURE_OBSERVATION_RESULT_SCHEMA,
  SOURCE_PRESSURE_OPERATOR_DECISIONS,
  SOURCE_PRESSURE_ROUTE,
  SUPPORTED_REFERENCE_FAMILIES,
  createByteReference,
  createExternalResourcePointer,
  createExternalResourceResolutionReceipt,
  createResourceArtifactVisibilityIndex,
  createSourcePressureAdapterCandidate,
  createSourcePressureAdapterOperatorDecision,
  createSourcePressureObservationResult,
  normalizeByteReference,
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
  validateSourcePressureObservationResult,
  validateByteReference
} from './reference/index.js'
export {
  BYTES_ADJACENT_REVIEW_CHECK_STATUSES,
  BYTES_ADJACENT_REVIEW_EVIDENCE_KIND,
  BYTES_ADJACENT_REVIEW_EVIDENCE_PHASE,
  BYTES_ADJACENT_REVIEW_EVIDENCE_SCHEMA,
  BYTES_ADJACENT_REVIEW_SAFE_FLAGS,
  BYTES_ADJACENT_REVIEW_STATUSES,
  BYTES_EDGE_IMPORT_CLASSIFICATION,
  EDGE_PHASE_120_BYTES_FIXTURE_INPUT_KIND,
  assertNoForbiddenEvidenceWording,
  createAdjacentReviewEvidenceFromFixture,
  createAdjacentReviewEvidenceFromJson,
  validateAdjacentReviewEvidence
} from './review/index.js'
export {
  CONDUIT_CORESTORE_READBACK_FIXTURE_SCHEMA,
  CONDUIT_CORESTORE_READBACK_PROOF_SCHEMA,
  CONDUIT_CORESTORE_READBACK_TOPOLOGIES,
  createPackByteBinding,
  createConduitCorestoreReadbackProof,
  createPlatformMaterializationSeam,
  validateConduitCorestoreReadbackProof,
  validatePackByteBinding,
  validatePlatformMaterializationSeam
} from './integration/index.js'
export {
  DEFAULT_PAYLOAD_CHUNK_SIZE,
  DESCRIPTOR_BLOCK_INDEX,
  PAYLOAD_START_BLOCK_INDEX,
  RETENTION_TERMS,
  assessObjectLifecycle,
  assessRetentionPosture,
  chunkPayload,
  createDescriptorHash,
  deserializeByteDescriptor,
  getPayloadBlockCount,
  getTotalBlockCount,
  hasAllBlocks,
  publishImmutableObject,
  readImmutableObject,
  selectReadinessState,
  serializeByteDescriptor,
  validateLifecycleSnapshot,
  validateMaterializedBytes,
  validateRetentionPosture,
  validateRetentionTerm
} from './object/index.js'
export {
  HyperswarmTransport,
  createHyperswarmTransport,
  fetchImmutableObject,
  serveImmutableObject
} from './transport/index.js'

export default Object.freeze({
  ...descriptorApi,
  ...errorsApi,
  ...materializationApi,
  ...referenceApi,
  ...reviewApi,
  ...integrationApi,
  ...objectApi,
  ...transportApi
})
