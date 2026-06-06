import { createHash } from 'node:crypto'

import { BYTE_DESCRIPTOR_SCHEMA } from '../descriptor/index.js'
import { validateByteReference } from '../reference/index.js'

export const CONDUIT_CORESTORE_READBACK_PROOF_SCHEMA = 'mesh-ecology-bytes/corestore-readback-proof@1'
export const CONDUIT_CORESTORE_READBACK_FIXTURE_SCHEMA = 'mesh-ecology-bytes/corestore-readback-boundary-fixture@1'
export const CONDUIT_CORESTORE_READBACK_TOPOLOGIES = new Set([
  'single_store_local_reopen',
  'local_two_store_hyperswarm_testnet_readback'
])

export function createConduitCorestoreReadbackProof(input = {}) {
  const reference = input.reference ?? input.readback?.reference ?? input.published?.reference
  const descriptor = input.descriptor ?? input.readback?.descriptor ?? input.published?.descriptor
  const lifecycle = input.lifecycle ?? input.readback?.lifecycle ?? input.published?.object?.lifecycle
  const totalBlockCount = input.totalBlockCount ?? input.published?.object?.totalBlockCount
  const expectedHash = input.expectedHash ?? descriptor?.integrityHint?.value ?? input.published?.object?.payloadIntegrity
  const createdAt = input.createdAt ?? new Date().toISOString()

  validateByteReference(reference)

  if (!descriptor) throw new TypeError('Conduit Corestore readback proof requires a descriptor')
  if (!lifecycle) throw new TypeError('Conduit Corestore readback proof requires a lifecycle snapshot')
  if (!/^[0-9a-f]{64}$/i.test(expectedHash ?? '')) {
    throw new TypeError('Conduit Corestore readback proof requires a sha256 expected hash')
  }
  if (!Number.isInteger(totalBlockCount) || totalBlockCount < 1) {
    throw new TypeError('Conduit Corestore readback proof requires a positive Hypercore length snapshot')
  }

  const readback = createCorestoreReadbackFixture({
    createdAt,
    readbackId: input.readbackId,
    reference,
    descriptor,
    lifecycle,
    totalBlockCount,
    expectedHash,
    readbackTopology: input.readbackTopology,
    replicationEvidence: input.replicationEvidence
  })
  const artifactHash = input.retainedProof?.artifactHash ?? `sha256:${hashJson({
    schema: CONDUIT_CORESTORE_READBACK_PROOF_SCHEMA,
    proofId: input.proofId ?? 'bytes-corestore-proof:local-readback:v0',
    readback
  })}`

  const artifact = {
    artifactKind: 'bytes_corestore_readback_proof',
    schema: CONDUIT_CORESTORE_READBACK_PROOF_SCHEMA,
    proofId: input.proofId ?? 'bytes-corestore-proof:local-readback:v0',
    createdAt,
    producer: {
      product: 'mesh-ecology-bytes',
      repo: 'mesh-ecology-bytes',
      boundary: 'immutable_byte_publication_retrieval_lifecycle'
    },
    readback,
    retainedProof: {
      lane: input.retainedProof?.lane ?? 'bytes-corestore-readback',
      retainedAt: input.retainedProof?.retainedAt ?? createdAt,
      artifactPath: input.retainedProof?.artifactPath ?? null,
      artifactHash,
      nonClaims: {
        localFileIsSeamTransport: false,
        localFileIsAuthority: false,
        localFileIsCanonicalTruth: false
      }
    },
    operationProof: {
      bytesProofArtifactProducedByBytes: true,
      bytesReadbackPerformedByBytes: true,
      corestoreHypercoreReadbackObservedByBytes: true,
      conduitReadProofArtifactOnly: true,
      conduitPublishedBytes: false,
      conduitFetchedBytes: false,
      conduitPinnedBytes: false,
      conduitStoredBytes: false,
      conduitMaterializedBytes: false
    },
    nonClaims: {
      proofArtifactIsCanonAuthority: false,
      proofArtifactIsAcceptance: false,
      payloadAvailabilityIsAcceptance: false,
      platformActionAuthorized: false,
      conduitPublishedBytes: false,
      conduitFetchedBytes: false,
      conduitPinnedBytes: false,
      conduitStoredBytes: false,
      conduitMaterializedBytes: false
    }
  }

  validateConduitCorestoreReadbackProof(artifact)
  return artifact
}

export function validateConduitCorestoreReadbackProof(artifact = {}) {
  const issues = []

  if (artifact.schema !== CONDUIT_CORESTORE_READBACK_PROOF_SCHEMA) issues.push('schema_mismatch')
  if (artifact.artifactKind !== 'bytes_corestore_readback_proof') issues.push('artifact_kind_mismatch')
  if (artifact.producer?.product !== 'mesh-ecology-bytes') issues.push('producer_product_required')
  if (artifact.producer?.repo !== 'mesh-ecology-bytes') issues.push('producer_repo_required')
  if (!artifact.retainedProof?.lane) issues.push('retained_proof_lane_required')
  if (!/^sha256:[0-9a-f]{64}$/i.test(artifact.retainedProof?.artifactHash ?? '')) {
    issues.push('retained_proof_hash_required')
  }
  validateReadbackFixture(artifact.readback, issues)

  for (const key of ['rawBytes', 'payloadBytes', 'bytesPayload', 'materializedBytes']) {
    if (artifact[key] !== undefined || artifact.readback?.[key] !== undefined) {
      issues.push(`raw_bytes_forbidden:${key}`)
    }
  }
  for (const claim of [
    'conduitPublishedBytes',
    'conduitFetchedBytes',
    'conduitPinnedBytes',
    'conduitStoredBytes',
    'conduitMaterializedBytes'
  ]) {
    if (artifact.operationProof?.[claim] !== false || artifact.nonClaims?.[claim] !== false) {
      issues.push(`conduit_non_claim_required:${claim}`)
    }
  }
  if (artifact.accepted === true || artifact.payloadAvailabilityIsAcceptance === true ||
    artifact.nonClaims?.payloadAvailabilityIsAcceptance !== false) {
    issues.push('acceptance_forbidden')
  }
  if (artifact.platformActionAuthorized === true || artifact.nonClaims?.platformActionAuthorized !== false) {
    issues.push('platform_activation_forbidden')
  }

  if (issues.length > 0) {
    throw new TypeError(`Invalid Conduit Corestore readback proof: ${issues.join(',')}`)
  }

  return artifact
}

function createCorestoreReadbackFixture(input) {
  const filenameHint = input.descriptor.materializationHints?.filenameHint ?? 'bytes-object.bin'
  return {
    artifactKind: 'bytes_owned_corestore_readback_fixture',
    schema: CONDUIT_CORESTORE_READBACK_FIXTURE_SCHEMA,
    readbackId: input.readbackId ?? 'bytes-corestore-readback:local-readback:v0',
    createdAt: input.createdAt,
    owner: {
      product: 'mesh-ecology-bytes',
      boundary: 'immutable_byte_publication_and_readback'
    },
    storageSubstrate: 'corestore-hypercore',
    readbackTopology: input.readbackTopology ?? 'single_store_local_reopen',
    replicationEvidence: input.replicationEvidence ?? null,
    bytes: {
      reference: {
        schema: 'mesh-ecology-bytes/byte-reference@1',
        transport: 'hypercore',
        key: input.reference.key,
        version: input.totalBlockCount,
        descriptor: {
          index: 0,
          hash: input.reference.descriptorHash
        }
      },
      materializationRequest: {
        targetClass: 'runtime_input',
        mode: 'stream',
        filenameHint
      },
      role: 'opaque_blob_reference',
      nonClaims: {
        bytePublicationClaimed: false,
        byteFetchClaimed: false,
        bytePinningClaimed: false,
        byteMaterializationClaimed: false,
        byteStorageClaimed: false,
        placementAuthorityClaimed: false,
        deploymentReadinessClaimed: false,
        activationClaimed: false,
        bytesDescriptorMeaningInterpreted: false,
        conduitIsBytesAuthority: false
      }
    },
    expectedHash: input.expectedHash,
    descriptor: {
      schema: BYTE_DESCRIPTOR_SCHEMA,
      role: input.descriptor.role ?? 'runtime_blob',
      mutability: 'immutable',
      materializationHints: {
        preferredMode: input.descriptor.materializationHints?.preferredMode ?? 'stream',
        visibility: input.descriptor.materializationHints?.visibility ?? 'internal',
        placementClass: input.descriptor.materializationHints?.placementClass ?? 'runtime_input'
      }
    },
    readback: {
      descriptorRead: true,
      bytesReadable: input.lifecycle.fetched === true || input.lifecycle.complete === true || input.lifecycle.ready === true,
      storageReopened: true,
      source: 'bytes_owned_corestore_readback'
    },
    operationProof: {
      bytesOwnedReadbackObserved: true,
      corestoreHypercoreReadbackObserved: true,
      conduitPublishedBytes: false,
      conduitFetchedBytes: false,
      conduitPinnedBytes: false,
      conduitStoredBytes: false,
      conduitMaterializedBytes: false
    },
    nonClaims: {
      canonicalTruthClaimed: false,
      familyCanonDecided: false,
      electedHeadDecided: false,
      actorMeaningOwned: false,
      componentMeaningOwned: false,
      packSemanticsOwned: false,
      bytePublicationClaimed: false,
      byteFetchClaimed: false,
      bytePinningClaimed: false,
      byteMaterializationClaimed: false,
      payloadAvailabilityIsAcceptance: false,
      materializationClaimed: false,
      activationClaimed: false,
      platformActionAuthorized: false,
      webSourceIsCanonical: false,
      externalCandidateAccepted: false,
      authorityGranted: false,
      observerAdmissionGranted: false,
      storageIsCanonAuthority: false,
      conduitIsDistributionAuthority: false,
      byteReadbackClaimedByConduit: false,
      bytesCorestoreFixtureIsCanon: false
    }
  }
}

function validateReadbackFixture(readback = {}, issues) {
  if (readback.schema !== CONDUIT_CORESTORE_READBACK_FIXTURE_SCHEMA) issues.push('readback_schema_mismatch')
  if (readback.owner?.product !== 'mesh-ecology-bytes') issues.push('readback_owner_required')
  if (readback.storageSubstrate !== 'corestore-hypercore') issues.push('readback_storage_substrate_required')
  if (!CONDUIT_CORESTORE_READBACK_TOPOLOGIES.has(readback.readbackTopology ?? '')) {
    issues.push('readback_topology_required')
  }
  validateReplicationEvidence(readback.replicationEvidence, readback.readbackTopology, issues)
  if (!/^[0-9a-f]{64}$/i.test(readback.expectedHash ?? '')) issues.push('expected_hash_required')
  if (readback.bytes?.reference?.schema !== 'mesh-ecology-bytes/byte-reference@1') issues.push('byte_reference_schema_required')
  if (readback.bytes?.reference?.transport !== 'hypercore') issues.push('byte_reference_transport_required')
  if (!/^[0-9a-f]{64}$/i.test(readback.bytes?.reference?.key ?? '')) issues.push('byte_reference_key_required')
  if (!Number.isInteger(readback.bytes?.reference?.version) || readback.bytes.reference.version < 1) {
    issues.push('byte_reference_version_required')
  }
  rejectEmbeddedBytesForValidation(readback, 'readback', issues)
  rejectEmbeddedBytesForValidation(readback.bytes, 'readback.bytes', issues)
  if (readback.readback?.descriptorRead !== true || readback.readback?.bytesReadable !== true) {
    issues.push('readback_evidence_required')
  }
}

function hashJson(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function validateReplicationEvidence(evidence, topology, issues) {
  if (topology === 'single_store_local_reopen') {
    if (evidence !== null && evidence !== undefined) issues.push('single_store_replication_evidence_forbidden')
    return
  }

  if (topology === 'local_two_store_hyperswarm_testnet_readback') {
    if (evidence?.substrate !== 'hyperswarm-local-testnet') {
      issues.push('replication_evidence_substrate_required')
    }
    if (evidence?.publisherStore !== 'separate_local_store' ||
      evidence?.consumerStore !== 'separate_local_store') {
      issues.push('replication_evidence_separate_stores_required')
    }
    if (evidence?.bytesFetchedByBytes !== true || evidence?.consumerReadbackAfterFetch !== true) {
      issues.push('replication_evidence_readback_required')
    }
  }
}

function rejectEmbeddedBytesForValidation(value = {}, label, issues) {
  for (const key of ['bytes', 'rawBytes', 'payloadBytes', 'bytesPayload', 'materializedBytes']) {
    if (key === 'bytes' && label === 'readback') continue
    if (value?.[key] !== undefined && (key !== 'bytes' || Buffer.isBuffer(value[key]) || value[key] instanceof Uint8Array)) {
      issues.push(`raw_bytes_forbidden:${label}.${key}`)
    }
  }
}
