export const BYTES_ADJACENT_REVIEW_EVIDENCE_SCHEMA =
  'mesh-ecology-bytes/adjacent-review-evidence@1'

export const BYTES_ADJACENT_REVIEW_EVIDENCE_KIND =
  'bytes_owned_adjacent_review_evidence'

export const EDGE_PHASE_120_BYTES_FIXTURE_INPUT_KIND =
  'edge_phase_120_bytes_adjacent_review_packet_fixture'

export const BYTES_ADJACENT_REVIEW_EVIDENCE_PHASE = 121

export const BYTES_EDGE_IMPORT_CLASSIFICATION = Object.freeze({
  seamId: 'bytes',
  evidenceKind: 'bytes_edge_packet_review_evidence',
  edgeExpectedArtifactKind: 'bytes_edge_packet_review_evidence',
  classificationOnly: true,
  edgeOwnsSchema: false
})

export const BYTES_ADJACENT_REVIEW_STATUSES = new Set([
  'review_only_pass',
  'review_only_needs_followup',
  'review_only_incomplete_fixture',
  'review_only_rejected_fixture'
])

export const BYTES_ADJACENT_REVIEW_CHECK_STATUSES = new Set([
  'present',
  'missing',
  'malformed',
  'unsupported',
  'reviewed',
  'not_applicable',
  'deferred'
])

export const BYTES_ADJACENT_REVIEW_SAFE_FLAGS = Object.freeze({
  reviewOnly: true,
  evidenceOnly: true,
  edgePacketAcceptedAsSchema: false,
  edgePacketAcceptedAsCommand: false,
  bytePublicationClaimed: false,
  byteStorageClaimed: false,
  bytePinningClaimed: false,
  byteReplicationClaimed: false,
  byteFetchClaimed: false,
  byteAvailabilityClaimed: false,
  contentTruthClaimed: false,
  materializationProofClaimed: false,
  productionProofClaimed: false,
  meshTruthClaimed: false,
  edgeAuthorityGranted: false
})

const DEFAULT_INPUT = Object.freeze({
  fixturePath: 'test/fixtures/edge/phase-120-bytes-adjacent-review-packet-fixture.json',
  sourceRepo: 'mesh-ecology-edge',
  sourcePhase: 120,
  sourceArtifactPath: 'docs/reviews/phase-120-bytes-adjacent-review-packet-fixture.json'
})

const REQUIRED_SECTIONS = [
  ['review_checklist_present', 'reviewChecklist', 'array'],
  ['bytes_wording_guardrails_present', 'bytesWordingGuardrails', 'object'],
  ['expected_bytes_owned_response_shape_present', 'expectedBytesEvidenceResponseShape', 'object'],
  ['stop_go_result_present', 'stopGoDecision', 'object']
]

const RUNTIME_INSTRUCTION_FIELDS = new Set([
  'publish',
  'fetch',
  'pin',
  'replicate',
  'materialize',
  'schedule',
  'discover',
  'execute'
])

const UNSAFE_CLAIM_FLAGS = [
  'edgePacketAcceptedAsSchema',
  'edgePacketAcceptedAsCommand',
  'bytePublicationClaimed',
  'byteStorageClaimed',
  'bytePinningClaimed',
  'byteReplicationClaimed',
  'byteFetchClaimed',
  'byteAvailabilityClaimed',
  'contentTruthClaimed',
  'materializationProofClaimed',
  'productionProofClaimed',
  'meshTruthClaimed',
  'edgeAuthorityGranted',
  'adjacentAccepted',
  'adjacentAcceptanceClaimed',
  'bytesAccepted',
  'bytesSchemaAccepted',
  'executionImplied',
  'callsAdjacentRepo',
  'executesAction',
  'schedulesWork',
  'publishesToMesh',
  'infersAdjacentTruth',
  'infersMeshParticipation',
  'adjacentRepoAuthority',
  'hiddenStateMutation'
]

const FORBIDDEN_EVIDENCE_WORDING = [
  'verified content',
  'content-address truth',
  'materialization proof',
  'production proof',
  'mesh truth',
  'published bytes',
  'pinned bytes',
  'replicated bytes',
  'available bytes',
  'accepted adjacent packet',
  'publish bytes',
  'write bytes',
  'pin bytes',
  'store bytes',
  'replicate bytes',
  'fetch bytes',
  'verify content',
  'content is available',
  'content is canonical',
  'byte proof',
  'mesh proof'
]

export function createAdjacentReviewEvidenceFromJson(jsonText, options = {}) {
  let fixture

  try {
    fixture = JSON.parse(jsonText)
  } catch (error) {
    return createReviewEvidence({
      status: 'review_only_rejected_fixture',
      reasonCodes: ['malformed_json'],
      findings: [
        {
          findingId: 'fixture_json_parse_failed',
          severity: 'error',
          message: error.message
        }
      ],
      checks: [
        createCheck('fixture_json_parseable', 'malformed', 'malformed_json')
      ],
      options
    })
  }

  return createAdjacentReviewEvidenceFromFixture(fixture, options)
}

export function createAdjacentReviewEvidenceFromFixture(fixture, options = {}) {
  if (!isPlainObject(fixture)) {
    return createReviewEvidence({
      status: 'review_only_rejected_fixture',
      reasonCodes: ['fixture_top_level_not_object'],
      findings: [
        {
          findingId: 'fixture_top_level_not_object',
          severity: 'error',
          message: 'Static Edge fixture must parse to a JSON object.'
        }
      ],
      checks: [
        createCheck('fixture_json_object', 'malformed', 'fixture_top_level_not_object')
      ],
      options
    })
  }

  const checks = [
    createCheck('fixture_json_object', 'present')
  ]
  const findings = []
  const reasonCodes = []

  reviewEdgePhase120Identity(fixture, checks, findings, reasonCodes, options)
  reviewRequiredSections(fixture, checks, findings, reasonCodes)
  reviewChecklistStability(fixture, checks, findings, reasonCodes)
  reviewGuardrailStability(fixture, checks, findings, reasonCodes)
  reviewStopGoDecision(fixture, checks, findings, reasonCodes)
  reviewRuntimeInstructionFields(fixture, checks, findings, reasonCodes)
  reviewUnsafeClaims(fixture, checks, findings, reasonCodes)
  reviewPacketPresenceAcceptance(fixture, checks, findings, reasonCodes)

  const status = selectReviewStatus(checks, findings)

  return createReviewEvidence({
    status,
    reasonCodes: reasonCodes.length === 0 ? ['static_fixture_review_passed'] : unique(reasonCodes),
    findings,
    checks,
    guardrails: createGuardrailEvidence(fixture),
    correlation: extractCorrelationRefs(fixture, options),
    options
  })
}

export function validateAdjacentReviewEvidence(evidence) {
  if (!isPlainObject(evidence)) {
    throw new TypeError('AdjacentReviewEvidence must be an object')
  }

  if (evidence.schema !== BYTES_ADJACENT_REVIEW_EVIDENCE_SCHEMA) {
    throw new TypeError('AdjacentReviewEvidence.schema is not supported')
  }

  if (evidence.artifactKind !== BYTES_ADJACENT_REVIEW_EVIDENCE_KIND) {
    throw new TypeError('AdjacentReviewEvidence.artifactKind is not supported')
  }

  if (evidence.phase !== BYTES_ADJACENT_REVIEW_EVIDENCE_PHASE) {
    throw new TypeError('AdjacentReviewEvidence.phase is not supported')
  }

  if (!BYTES_ADJACENT_REVIEW_STATUSES.has(evidence.status)) {
    throw new TypeError('AdjacentReviewEvidence.status is not supported')
  }

  assertClassification(evidence.edgeImportClassification)
  assertSafeFlags(evidence)
  assertNoForbiddenEvidenceWording(evidence)

  if (!Array.isArray(evidence.checks)) {
    throw new TypeError('AdjacentReviewEvidence.checks must be an array')
  }

  for (const check of evidence.checks) {
    if (!isPlainObject(check) || !BYTES_ADJACENT_REVIEW_CHECK_STATUSES.has(check.status)) {
      throw new TypeError('AdjacentReviewEvidence.checks contains unsupported check status')
    }
  }

  if (!Array.isArray(evidence.guardrails)) {
    throw new TypeError('AdjacentReviewEvidence.guardrails must be an array')
  }

  if (!Array.isArray(evidence.reasonCodes)) {
    throw new TypeError('AdjacentReviewEvidence.reasonCodes must be an array')
  }

  return evidence
}

export function assertNoForbiddenEvidenceWording(value) {
  const strings = collectStringValues(value)

  for (const text of strings) {
    const normalized = text.toLowerCase()

    for (const forbidden of FORBIDDEN_EVIDENCE_WORDING) {
      if (normalized.includes(forbidden)) {
        throw new TypeError(`AdjacentReviewEvidence contains forbidden wording: ${forbidden}`)
      }
    }
  }
}

function createReviewEvidence({
  status,
  reasonCodes,
  findings,
  checks,
  guardrails = [],
  correlation,
  options = {}
}) {
  const input = {
    kind: EDGE_PHASE_120_BYTES_FIXTURE_INPUT_KIND,
    fixturePath: options.fixturePath || DEFAULT_INPUT.fixturePath,
    sourceRepo: options.sourceRepo || DEFAULT_INPUT.sourceRepo,
    sourcePhase: options.sourcePhase || DEFAULT_INPUT.sourcePhase,
    sourceArtifactPath: options.sourceArtifactPath || DEFAULT_INPUT.sourceArtifactPath,
    staticFixtureOnly: true,
    edgeRuntimeAccess: false
  }

  const evidence = {
    schema: BYTES_ADJACENT_REVIEW_EVIDENCE_SCHEMA,
    artifactKind: BYTES_ADJACENT_REVIEW_EVIDENCE_KIND,
    phase: BYTES_ADJACENT_REVIEW_EVIDENCE_PHASE,
    input,
    correlation: correlation || createBaseCorrelation(options),
    edgeImportClassification: { ...BYTES_EDGE_IMPORT_CLASSIFICATION },
    ...BYTES_ADJACENT_REVIEW_SAFE_FLAGS,
    adjacentAcceptanceFromPacketPresence: false,
    status,
    checks,
    guardrails,
    reasonCodes: unique(reasonCodes),
    findings
  }

  validateAdjacentReviewEvidence(evidence)
  return evidence
}

function reviewEdgePhase120Identity(fixture, checks, findings, reasonCodes, options) {
  const sourcePhase = options.sourcePhase || DEFAULT_INPUT.sourcePhase
  const sourceRepo = options.sourceRepo || DEFAULT_INPUT.sourceRepo

  if (sourceRepo === 'mesh-ecology-edge' && sourcePhase === 120) {
    checks.push(createCheck('edge_phase_120_source_context_present', 'present'))
  } else {
    checks.push(createCheck('edge_phase_120_source_context_present', 'missing', 'edge_phase_120_context_missing'))
    findings.push(createFinding('edge_phase_120_context_missing', 'error'))
    reasonCodes.push('edge_phase_120_context_missing')
  }

  if (
    fixture.targetRepo === 'mesh-ecology-bytes' &&
    fixture.seamId === 'bytes' &&
    fixture.targetSurface === 'byte_interop'
  ) {
    checks.push(createCheck('bytes_target_identity_present', 'present'))
  } else {
    checks.push(createCheck('bytes_target_identity_present', 'missing', 'bytes_target_identity_missing'))
    findings.push(createFinding('bytes_target_identity_missing', 'error'))
    reasonCodes.push('bytes_target_identity_missing')
  }
}

function reviewRequiredSections(fixture, checks, findings, reasonCodes) {
  for (const [checkId, field, expectedType] of REQUIRED_SECTIONS) {
    const value = fixture[field]
    const present = expectedType === 'array' ? Array.isArray(value) : isPlainObject(value)

    if (present) {
      checks.push(createCheck(checkId, 'present'))
    } else {
      checks.push(createCheck(checkId, 'missing', `${field}_missing`))
      findings.push(createFinding(`${field}_missing`, 'error'))
      reasonCodes.push(`${field}_missing`)
    }
  }
}

function reviewChecklistStability(fixture, checks, findings, reasonCodes) {
  if (!Array.isArray(fixture.reviewChecklist)) return

  const missingStableMarkers = fixture.reviewChecklist
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !isPlainObject(item) || !hasNonEmptyString(item.checklistId) && !hasNonEmptyString(item.label))
    .map(({ index }) => index)

  if (missingStableMarkers.length === 0 && fixture.reviewChecklist.length > 0) {
    checks.push(createCheck('checklist_stable_markers_present', 'present'))
  } else {
    checks.push(createCheck('checklist_stable_markers_present', 'malformed', 'checklist_stable_markers_missing'))
    findings.push(createFinding('checklist_stable_markers_missing', 'error', { indexes: missingStableMarkers }))
    reasonCodes.push('checklist_stable_markers_missing')
  }
}

function reviewGuardrailStability(fixture, checks, findings, reasonCodes) {
  const guardrails = fixture.bytesWordingGuardrails
  if (!isPlainObject(guardrails)) return

  const useWordingStable = Array.isArray(guardrails.useWording) &&
    guardrails.useWording.every((item) => typeof item === 'string' && item.trim() !== '')
  const avoidWordingStable = Array.isArray(guardrails.avoidWording) &&
    guardrails.avoidWording.every((item) => typeof item === 'string' && item.trim() !== '')

  if (hasNonEmptyString(guardrails.guardrailSetId) && useWordingStable && avoidWordingStable) {
    checks.push(createCheck('guardrail_stable_markers_present', 'present'))
  } else {
    checks.push(createCheck('guardrail_stable_markers_present', 'malformed', 'guardrail_stable_markers_missing'))
    findings.push(createFinding('guardrail_stable_markers_missing', 'error'))
    reasonCodes.push('guardrail_stable_markers_missing')
  }
}

function reviewStopGoDecision(fixture, checks, findings, reasonCodes) {
  const decision = fixture.stopGoDecision

  if (isPlainObject(decision) && decision.decision === 'go_for_bytes_repo_review') {
    checks.push(createCheck('stop_go_result_go_for_bytes_repo_review', 'present'))
  } else {
    checks.push(createCheck('stop_go_result_go_for_bytes_repo_review', 'missing', 'stop_go_result_not_go_for_bytes_repo_review'))
    findings.push(createFinding('stop_go_result_not_go_for_bytes_repo_review', 'error'))
    reasonCodes.push('stop_go_result_not_go_for_bytes_repo_review')
  }
}

function reviewRuntimeInstructionFields(fixture, checks, findings, reasonCodes) {
  const unsupportedFields = Object.keys(fixture)
    .filter((field) => RUNTIME_INSTRUCTION_FIELDS.has(field.toLowerCase()))

  if (unsupportedFields.length === 0) {
    checks.push(createCheck('runtime_instruction_fields_absent', 'reviewed'))
    return
  }

  checks.push(createCheck('runtime_instruction_fields_absent', 'unsupported', 'runtime_instruction_fields_present'))
  findings.push(createFinding('runtime_instruction_fields_present', 'warning', { fields: unsupportedFields }))
  reasonCodes.push('runtime_instruction_fields_present')
}

function reviewUnsafeClaims(fixture, checks, findings, reasonCodes) {
  const unsafeClaims = [
    ...collectTrueUnsafeFlags(fixture, 'fixture'),
    ...collectTrueUnsafeFlags(fixture.expectedBytesEvidenceResponseShape, 'expected_response_shape'),
    ...collectTrueUnsafeFlags(fixture.stopGoDecision, 'stop_go_decision')
  ]

  if (unsafeClaims.length === 0) {
    checks.push(createCheck('runtime_and_truth_claims_absent', 'reviewed'))
    return
  }

  checks.push(createCheck('runtime_and_truth_claims_absent', 'unsupported', 'runtime_or_truth_claims_present'))
  findings.push(createFinding('runtime_or_truth_claims_present', 'warning', { claims: unsafeClaims }))
  reasonCodes.push('runtime_or_truth_claims_present')
}

function reviewPacketPresenceAcceptance(fixture, checks, findings, reasonCodes) {
  if (
    fixture.adjacentAccepted === true ||
    fixture.adjacentAcceptanceClaimed === true ||
    fixture.bytesAccepted === true ||
    fixture.bytesSchemaAccepted === true
  ) {
    checks.push(createCheck('packet_presence_does_not_create_acceptance', 'unsupported', 'packet_presence_acceptance_claimed'))
    findings.push(createFinding('packet_presence_acceptance_claimed', 'warning'))
    reasonCodes.push('packet_presence_acceptance_claimed')
    return
  }

  checks.push(createCheck('packet_presence_does_not_create_acceptance', 'reviewed'))
}

function createGuardrailEvidence(fixture) {
  const guardrails = fixture && fixture.bytesWordingGuardrails

  if (!isPlainObject(guardrails)) {
    return [
      {
        guardrailId: 'bytes_fixture_review_wording_guardrails',
        status: 'missing'
      }
    ]
  }

  return [
    {
      guardrailId: guardrails.guardrailSetId || 'bytes_fixture_review_wording_guardrails',
      status: 'reviewed',
      useWordingLabelCount: Array.isArray(guardrails.useWording) ? guardrails.useWording.length : 0,
      avoidWordingLabelCount: Array.isArray(guardrails.avoidWording) ? guardrails.avoidWording.length : 0,
      forbiddenWordingCopied: false
    }
  ]
}

function extractCorrelationRefs(fixture, options) {
  const expectedShape = isPlainObject(fixture.expectedBytesEvidenceResponseShape)
    ? fixture.expectedBytesEvidenceResponseShape
    : {}
  const packet = isPlainObject(fixture.packet) ? fixture.packet : {}

  return {
    ...createBaseCorrelation(options),
    fixtureId: fixture.fixtureId,
    packetRef: fixture.packetRef,
    packetSetRef: fixture.packetSetRef,
    packetId: packet.packetId,
    createdAt: fixture.createdAt,
    sourceGeneratedAt: fixture.createdAt,
    sourceContractRef: packet.sourceContractRef || expectedShape.sourceContractRef,
    sourceContractSetRef: packet.sourceContractSetRef || expectedShape.sourceContractSetRef,
    sourceLedgerRef: packet.sourceLedgerRef || expectedShape.sourceLedgerRef,
    sourceReadinessRollupRef: packet.sourceReadinessRollupRef || expectedShape.sourceReadinessRollupRef,
    sourceEvidenceRefs: copyArray(packet.sourceEvidenceRefs || expectedShape.sourceEvidenceRefs),
    sourceWorkPacketRefs: copyArray(packet.sourceWorkPacketRefs || expectedShape.sourceWorkPacketRefs),
    sourceNextActionRefs: copyArray(packet.sourceNextActionRefs || expectedShape.sourceNextActionRefs),
    sourceLedgerEventRefs: copyArray(packet.sourceLedgerEventRefs || expectedShape.sourceLedgerEventRefs),
    sourceLedgerDeltaRefs: copyArray(packet.sourceLedgerDeltaRefs || expectedShape.sourceLedgerDeltaRefs),
    checklistIds: extractChecklistIds(fixture.reviewChecklist),
    guardrailSetId: isPlainObject(fixture.bytesWordingGuardrails)
      ? fixture.bytesWordingGuardrails.guardrailSetId
      : undefined,
    expectedResponseShape: {
      edgeExpectedArtifactKind: expectedShape.artifactKind,
      edgeExpectedSchemaVersion: expectedShape.schemaVersion,
      expectedEvidenceId: expectedShape.evidenceId
    },
    stopGoResult: isPlainObject(fixture.stopGoDecision)
      ? fixture.stopGoDecision.decision
      : undefined
  }
}

function createBaseCorrelation(options) {
  return {
    sourceRepo: options.sourceRepo || DEFAULT_INPUT.sourceRepo,
    sourcePhase: options.sourcePhase || DEFAULT_INPUT.sourcePhase,
    sourceFixturePath: options.sourceArtifactPath || DEFAULT_INPUT.sourceArtifactPath
  }
}

function selectReviewStatus(checks, findings) {
  if (findings.some((finding) => finding.severity === 'error')) {
    return 'review_only_incomplete_fixture'
  }

  if (checks.some((check) => check.status === 'unsupported')) {
    return 'review_only_needs_followup'
  }

  return 'review_only_pass'
}

function createCheck(checkId, status, reasonCode) {
  return {
    checkId,
    status,
    ...(reasonCode === undefined ? {} : { reasonCode })
  }
}

function createFinding(findingId, severity, details) {
  return {
    findingId,
    severity,
    ...(details === undefined ? {} : { details })
  }
}

function collectTrueUnsafeFlags(value, location) {
  if (!isPlainObject(value)) return []

  return UNSAFE_CLAIM_FLAGS
    .filter((flag) => value[flag] === true)
    .map((flag) => ({ location, flag }))
}

function collectStringValues(value, seen = new Set()) {
  if (typeof value === 'string') return [value]
  if (value === null || typeof value !== 'object') return []
  if (seen.has(value)) return []
  seen.add(value)

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStringValues(item, seen))
  }

  return Object.values(value).flatMap((item) => collectStringValues(item, seen))
}

function extractChecklistIds(checklist) {
  if (!Array.isArray(checklist)) return []

  return checklist
    .map((item) => {
      if (!isPlainObject(item)) return undefined
      return item.checklistId || item.label
    })
    .filter((item) => item !== undefined)
}

function assertClassification(classification) {
  if (!isPlainObject(classification)) {
    throw new TypeError('AdjacentReviewEvidence.edgeImportClassification must be an object')
  }

  for (const [key, value] of Object.entries(BYTES_EDGE_IMPORT_CLASSIFICATION)) {
    if (classification[key] !== value) {
      throw new TypeError(`AdjacentReviewEvidence.edgeImportClassification.${key} is not supported`)
    }
  }
}

function assertSafeFlags(evidence) {
  for (const [key, value] of Object.entries(BYTES_ADJACENT_REVIEW_SAFE_FLAGS)) {
    if (evidence[key] !== value) {
      throw new TypeError(`AdjacentReviewEvidence.${key} must be ${value}`)
    }
  }
}

function copyArray(value) {
  return Array.isArray(value) ? [...value] : []
}

function hasNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== ''
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function unique(values) {
  return [...new Set(values)]
}
