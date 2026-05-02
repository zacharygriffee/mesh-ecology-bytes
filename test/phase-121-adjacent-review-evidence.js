import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  BYTES_ADJACENT_REVIEW_EVIDENCE_KIND,
  BYTES_ADJACENT_REVIEW_EVIDENCE_PHASE,
  BYTES_ADJACENT_REVIEW_EVIDENCE_SCHEMA,
  BYTES_ADJACENT_REVIEW_SAFE_FLAGS,
  BYTES_EDGE_IMPORT_CLASSIFICATION,
  assertNoForbiddenEvidenceWording,
  createAdjacentReviewEvidenceFromFixture,
  createAdjacentReviewEvidenceFromJson,
  validateAdjacentReviewEvidence
} from '../src/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixturePath = join(__dirname, 'fixtures/edge/phase-120-bytes-adjacent-review-packet-fixture.json')
const evidenceArtifactPath = join(__dirname, '../docs/reviews/phase-121-bytes-edge-review-evidence.json')

export function runPhase121AdjacentReviewEvidenceTests() {
  testValidStaticFixtureProducesBytesOwnedEvidence()
  testCheckedInEvidenceArtifactMatchesHelperOutput()
  testMalformedJsonYieldsRejectedEvidence()
  testWrongTopLevelTypeYieldsRejectedEvidence()
  testIncompleteFixtureYieldsIncompleteEvidence()
  testRuntimeInstructionFieldsNeedFollowup()
  testUnsafeClaimsNeedFollowup()
  testPacketPresenceNeverCreatesAcceptance()
  testCorrelationRefsArePreservedAsInertRefs()
  testForbiddenEvidenceWordingIsRejected()
  testNoByteContentOrRuntimeApisAreUsed()
}

function testValidStaticFixtureProducesBytesOwnedEvidence() {
  const evidence = createAdjacentReviewEvidenceFromJson(readFixtureText())

  validateAdjacentReviewEvidence(evidence)

  assert.equal(evidence.schema, BYTES_ADJACENT_REVIEW_EVIDENCE_SCHEMA)
  assert.equal(evidence.artifactKind, BYTES_ADJACENT_REVIEW_EVIDENCE_KIND)
  assert.equal(evidence.phase, BYTES_ADJACENT_REVIEW_EVIDENCE_PHASE)
  assert.equal(evidence.status, 'review_only_pass')
  assert.deepEqual(evidence.edgeImportClassification, BYTES_EDGE_IMPORT_CLASSIFICATION)

  for (const [flag, value] of Object.entries(BYTES_ADJACENT_REVIEW_SAFE_FLAGS)) {
    assert.equal(evidence[flag], value)
  }

  assert.equal(evidence.edgeImportClassification.classificationOnly, true)
  assert.equal(evidence.edgeImportClassification.edgeOwnsSchema, false)
  assert.equal(evidence.edgeImportClassification.seamId, 'bytes')
  assert.equal(evidence.reviewOnly, true)
  assert.equal(evidence.evidenceOnly, true)
  assert.equal(evidence.edgePacketAcceptedAsSchema, false)
  assert.equal(evidence.edgePacketAcceptedAsCommand, false)
  assert.equal(evidence.bytePublicationClaimed, false)
  assert.equal(evidence.byteStorageClaimed, false)
  assert.equal(evidence.bytePinningClaimed, false)
  assert.equal(evidence.byteReplicationClaimed, false)
  assert.equal(evidence.byteFetchClaimed, false)
  assert.equal(evidence.byteAvailabilityClaimed, false)
  assert.equal(evidence.contentTruthClaimed, false)
  assert.equal(evidence.materializationProofClaimed, false)
  assert.equal(evidence.productionProofClaimed, false)
  assert.equal(evidence.meshTruthClaimed, false)
  assert.equal(evidence.edgeAuthorityGranted, false)
  assert.equal(evidence.adjacentAcceptanceFromPacketPresence, false)
}

function testCheckedInEvidenceArtifactMatchesHelperOutput() {
  const generated = createAdjacentReviewEvidenceFromJson(readFixtureText())
  const checkedIn = JSON.parse(readFileSync(evidenceArtifactPath, 'utf8'))

  validateAdjacentReviewEvidence(checkedIn)
  assert.deepEqual(checkedIn, generated)
}

function testMalformedJsonYieldsRejectedEvidence() {
  const evidence = createAdjacentReviewEvidenceFromJson('{')

  validateAdjacentReviewEvidence(evidence)
  assert.equal(evidence.status, 'review_only_rejected_fixture')
  assert.ok(evidence.reasonCodes.includes('malformed_json'))
}

function testWrongTopLevelTypeYieldsRejectedEvidence() {
  const evidence = createAdjacentReviewEvidenceFromJson('[]')

  validateAdjacentReviewEvidence(evidence)
  assert.equal(evidence.status, 'review_only_rejected_fixture')
  assert.ok(evidence.reasonCodes.includes('fixture_top_level_not_object'))
}

function testIncompleteFixtureYieldsIncompleteEvidence() {
  const fixture = cloneFixture()
  delete fixture.reviewChecklist

  const evidence = createAdjacentReviewEvidenceFromFixture(fixture)

  validateAdjacentReviewEvidence(evidence)
  assert.equal(evidence.status, 'review_only_incomplete_fixture')
  assert.ok(evidence.reasonCodes.includes('reviewChecklist_missing'))
}

function testRuntimeInstructionFieldsNeedFollowup() {
  const fixture = cloneFixture()
  fixture.execute = true

  const evidence = createAdjacentReviewEvidenceFromFixture(fixture)

  validateAdjacentReviewEvidence(evidence)
  assert.equal(evidence.status, 'review_only_needs_followup')
  assert.ok(evidence.reasonCodes.includes('runtime_instruction_fields_present'))
  assert.equal(findCheck(evidence, 'runtime_instruction_fields_absent').status, 'unsupported')
}

function testUnsafeClaimsNeedFollowup() {
  const fixture = cloneFixture()
  fixture.byteAvailabilityClaimed = true

  const evidence = createAdjacentReviewEvidenceFromFixture(fixture)

  validateAdjacentReviewEvidence(evidence)
  assert.equal(evidence.status, 'review_only_needs_followup')
  assert.ok(evidence.reasonCodes.includes('runtime_or_truth_claims_present'))
  assert.equal(evidence.byteAvailabilityClaimed, false)
}

function testPacketPresenceNeverCreatesAcceptance() {
  const fixture = cloneFixture()
  fixture.adjacentAccepted = true

  const evidence = createAdjacentReviewEvidenceFromFixture(fixture)

  validateAdjacentReviewEvidence(evidence)
  assert.equal(evidence.status, 'review_only_needs_followup')
  assert.ok(evidence.reasonCodes.includes('packet_presence_acceptance_claimed'))
  assert.equal(evidence.adjacentAcceptanceFromPacketPresence, false)
  assert.notEqual(evidence.status, 'review_only_pass')
}

function testCorrelationRefsArePreservedAsInertRefs() {
  const fixture = cloneFixture()
  const evidence = createAdjacentReviewEvidenceFromFixture(fixture)

  validateAdjacentReviewEvidence(evidence)
  assert.equal(evidence.correlation.sourceRepo, 'mesh-ecology-edge')
  assert.equal(evidence.correlation.sourcePhase, 120)
  assert.equal(
    evidence.correlation.sourceFixturePath,
    'docs/reviews/phase-120-bytes-adjacent-review-packet-fixture.json'
  )
  assert.equal(evidence.correlation.fixtureId, fixture.fixtureId)
  assert.equal(evidence.correlation.packetRef, fixture.packetRef)
  assert.equal(evidence.correlation.packetSetRef, fixture.packetSetRef)
  assert.equal(evidence.correlation.stopGoResult, 'go_for_bytes_repo_review')
  assert.deepEqual(
    evidence.correlation.checklistIds,
    fixture.reviewChecklist.map((item) => item.checklistId)
  )
  assert.equal(
    evidence.correlation.guardrailSetId,
    fixture.bytesWordingGuardrails.guardrailSetId
  )
  assert.equal(
    evidence.correlation.expectedResponseShape.edgeExpectedArtifactKind,
    fixture.expectedBytesEvidenceResponseShape.artifactKind
  )
}

function testForbiddenEvidenceWordingIsRejected() {
  assert.throws(() => assertNoForbiddenEvidenceWording({
    note: 'content is available'
  }))

  const evidence = createAdjacentReviewEvidenceFromJson(readFixtureText())
  assertNoForbiddenEvidenceWording(evidence)
}

function testNoByteContentOrRuntimeApisAreUsed() {
  const fixture = cloneFixture()
  Object.defineProperty(fixture, 'bytes', {
    enumerable: true,
    get() {
      throw new Error('byte content was accessed')
    }
  })

  const evidence = createAdjacentReviewEvidenceFromFixture(fixture)

  validateAdjacentReviewEvidence(evidence)
  assert.equal(evidence.status, 'review_only_pass')
  assert.equal(evidence.bytePublicationClaimed, false)
  assert.equal(evidence.byteFetchClaimed, false)
  assert.equal(evidence.materializationProofClaimed, false)
}

function findCheck(evidence, checkId) {
  return evidence.checks.find((check) => check.checkId === checkId)
}

function cloneFixture() {
  return JSON.parse(readFixtureText())
}

function readFixtureText() {
  return readFileSync(fixturePath, 'utf8')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPhase121AdjacentReviewEvidenceTests()
}
