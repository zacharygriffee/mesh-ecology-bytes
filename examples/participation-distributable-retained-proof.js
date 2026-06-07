#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
  createConduitCorestoreReadbackProof,
  publishImmutableObject,
  readImmutableObject,
  validateConduitCorestoreReadbackProof
} from '../src/index.js'

export const PARTICIPATION_DISTRIBUTABLE_RETAINED_PROOF_SCHEMA =
  'mesh-ecology-bytes/participation-distributable-retained-proof@1'
export const PARTICIPATION_DISTRIBUTABLE_RETAINED_READBACK_SCHEMA =
  'mesh-ecology-bytes/participation-distributable-retained-readback@1'

function argValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] ?? null : null
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function sha256Json(value) {
  return `sha256:${createHash('sha256').update(stableStringify(value)).digest('hex')}`
}

function withoutHash(value, fields) {
  const copy = { ...value }
  for (const field of fields) delete copy[field]
  return copy
}

async function readJson(file) {
  return JSON.parse(await readFile(path.resolve(file), 'utf8'))
}

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export async function buildParticipationDistributableRetainedProof({
  distributable,
  distributablePath = null,
  sourcePacksCommitHash = null,
  createdAt = new Date().toISOString()
}) {
  const payload = Buffer.from(JSON.stringify(distributable, null, 2))
  const expectedHash = createHash('sha256').update(payload).digest('hex')
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-participation-distributable-'))

  try {
    const published = await publishImmutableObject({
      storage,
      bytes: payload,
      descriptor: {
        contentType: 'application/json',
        size: payload.length,
        encoding: 'utf8',
        materializationHints: {
          preferredMode: 'stream',
          visibility: 'internal',
          placementClass: 'participation_distributable',
          filenameHint: 'participation-distributable.json'
        },
        integrityHint: {
          algorithm: 'sha256',
          value: expectedHash
        },
        role: 'participation_distributable',
        logicalId: distributable?.distributableRef ?? 'packs-participation-distributable:unknown'
      }
    })
    const readback = await readImmutableObject({
      storage,
      reference: published.reference,
      as: 'buffer'
    })
    const corestoreProof = createConduitCorestoreReadbackProof({
      proofId: `bytes-participation-distributable-retained:${expectedHash.slice(0, 16)}`,
      readbackId: `bytes-participation-distributable-readback:${expectedHash.slice(0, 16)}`,
      published,
      readback,
      readbackTopology: 'retained_store_process_readback',
      retentionEvidence: {
        retainedStoreClass: 'bytes_owned_local_runtime_store',
        readbackProcessBoundary: 'separate_node_process',
        publisherClosedBeforeReadback: true,
        readbackAfterReopen: true,
        seedCommitment: {
          scope: 'proof_window',
          maySeed: true,
          retentionTerm: 'pinned_for_proof',
          authorityGranted: false
        },
        retentionBeyondProofWindowClaimed: false
      },
      retainedProof: {
        lane: 'participation-distributable-retained-readback',
        retainedAt: createdAt,
        artifactPath: distributablePath
      }
    })
    validateConduitCorestoreReadbackProof(corestoreProof)

    const proof = {
      schema: PARTICIPATION_DISTRIBUTABLE_RETAINED_PROOF_SCHEMA,
      artifactKind: 'bytes_participation_distributable_retained_proof',
      createdAt,
      status: 'retained_readback_verified',
      proofRung: 'local_feed',
      sourceRefs: {
        sourceRepo: 'mesh-ecology-packs',
        sourcePacksCommitHash,
        distributablePath,
        distributableRef: distributable?.distributableRef ?? null,
        distributableHash: distributable?.distributableHash ?? null,
        profileRef: distributable?.sourceRefs?.profileRef ?? null,
        bundleRef: distributable?.sourceRefs?.bundleRef ?? null,
        verificationRef: distributable?.sourceRefs?.verificationRef ?? null
      },
      bytesRefs: {
        byteReference: published.reference,
        expectedHash: `sha256:${expectedHash}`,
        hypercoreKey: published.reference.key,
        hypercoreLength: published.object.totalBlockCount,
        descriptorHash: published.reference.descriptorHash,
        retainedProofId: corestoreProof.proofId,
        retainedReadbackId: corestoreProof.readback.readbackId
      },
      targetMetadata: distributable?.targetMetadata ?? null,
      dependencyAcquisition: distributable?.artifactAcquisition ?? null,
      corestoreProof,
      operationProof: {
        bytesPublishedDistributableToLocalCorestore: true,
        corestoreHypercoreReadbackObservedByBytes: true,
        retainedBytesAvailableForConduitReach: true,
        distributableHashPreserved: Boolean(distributable?.distributableHash),
        rawBytesEmbeddedInProof: false,
        nodeModulesIncluded: distributable?.artifactAcquisition?.nodeModulesIncluded === true,
        nodeModulesTransferIsDecentralizedProof: false,
        externalFetchObserved: false,
        externalFetchIsDecentralizedProof: false,
        conduitFetchedBytes: false,
        conduitStoredBytes: false,
        conduitMaterializedBytes: false,
        platformActivationAuthorized: false,
        publicSwarmProofClaimed: false,
        deviceBoundaryProofClaimed: false,
        authorityClaimed: false
      },
      nonClaims: {
        packsVerificationTruth: false,
        conduitReachProof: false,
        conduitByteCustody: false,
        platformAuthorization: false,
        platformActivation: false,
        publicSwarmProof: false,
        deviceBoundaryProof: false,
        rbcGovernance: false,
        governedSeam: false,
        productionDurability: false,
        canonicalTruth: false,
        authority: false
      }
    }
    proof.proofHash = sha256Json(withoutHash(proof, ['proofHash', 'proofRef']))
    proof.proofRef = `bytes-participation-distributable-retained:${proof.proofHash.slice('sha256:'.length, 'sha256:'.length + 16)}`
    return proof
  } finally {
    await rm(storage, { recursive: true, force: true })
  }
}

export function buildParticipationDistributableRetainedReadback({
  proof,
  proofPath = null,
  readAt = new Date().toISOString()
} = {}) {
  const recomputedProofHash = sha256Json(withoutHash(proof, ['proofHash', 'proofRef']))
  const readback = {
    schema: PARTICIPATION_DISTRIBUTABLE_RETAINED_READBACK_SCHEMA,
    artifactKind: 'bytes_participation_distributable_retained_readback',
    readAt,
    proofPath,
    proofRef: proof?.proofRef ?? null,
    proofHash: proof?.proofHash ?? null,
    recomputedProofHash,
    proofHashMatches: proof?.proofHash === recomputedProofHash,
    status: proof?.status ?? null,
    proofRung: proof?.proofRung ?? null,
    sourceRefs: proof?.sourceRefs ?? null,
    bytesRefs: proof?.bytesRefs ?? null,
    targetMetadata: proof?.targetMetadata ?? null,
    dependencyAcquisition: proof?.dependencyAcquisition ?? null,
    operationProof: proof?.operationProof ?? null,
    nonClaims: proof?.nonClaims ?? null
  }
  readback.readbackHash = sha256Json(withoutHash(readback, ['readbackHash', 'readbackRef']))
  readback.readbackRef = `bytes-participation-distributable-retained-readback:${readback.readbackHash.slice('sha256:'.length, 'sha256:'.length + 16)}`
  return readback
}

export function validateParticipationDistributableRetainedProof(proof = {}) {
  const issues = []
  if (proof.schema !== PARTICIPATION_DISTRIBUTABLE_RETAINED_PROOF_SCHEMA) issues.push('schema_mismatch')
  if (proof.status !== 'retained_readback_verified') issues.push('status_mismatch')
  if (proof.proofRung !== 'local_feed') issues.push('proof_rung_must_be_local_feed')
  if (!proof.sourceRefs?.distributableRef) issues.push('distributable_ref_required')
  if (!proof.bytesRefs?.byteReference?.key) issues.push('byte_reference_required')
  if (proof.operationProof?.bytesPublishedDistributableToLocalCorestore !== true) {
    issues.push('bytes_corestore_publish_required')
  }
  if (proof.operationProof?.corestoreHypercoreReadbackObservedByBytes !== true) {
    issues.push('bytes_corestore_readback_required')
  }
  for (const [value, issue] of [
    [proof.operationProof?.nodeModulesIncluded, 'node_modules_must_not_be_retained_default'],
    [proof.operationProof?.nodeModulesTransferIsDecentralizedProof, 'node_modules_transfer_decentralized_overclaim'],
    [proof.operationProof?.externalFetchObserved, 'external_fetch_observed_requires_exception'],
    [proof.operationProof?.externalFetchIsDecentralizedProof, 'external_fetch_decentralized_overclaim'],
    [proof.operationProof?.publicSwarmProofClaimed, 'public_swarm_overclaim'],
    [proof.operationProof?.deviceBoundaryProofClaimed, 'device_boundary_overclaim'],
    [proof.operationProof?.platformActivationAuthorized, 'platform_activation_overclaim'],
    [proof.operationProof?.authorityClaimed, 'authority_overclaim']
  ]) {
    if (value === true) issues.push(issue)
  }
  return issues
}

async function main() {
  const distributablePath = argValue('--distributable')
  const output = argValue('--output')
  const readbackOutput = argValue('--readback-output')
  if (!distributablePath || !output || !readbackOutput) {
    console.error('Usage: node examples/participation-distributable-retained-proof.js --distributable <path> --output <proof> --readback-output <readback>')
    process.exit(2)
  }
  const distributable = await readJson(distributablePath)
  const proof = await buildParticipationDistributableRetainedProof({
    distributable,
    distributablePath,
    sourcePacksCommitHash: argValue('--source-packs-commit-hash'),
    createdAt: argValue('--created-at') ?? new Date().toISOString()
  })
  const readback = buildParticipationDistributableRetainedReadback({
    proof,
    proofPath: output,
    readAt: argValue('--read-at') ?? new Date().toISOString()
  })
  const issues = validateParticipationDistributableRetainedProof(proof)
  if (issues.length > 0 || readback.proofHashMatches !== true) {
    console.error(JSON.stringify({ status: 'failed', issues, readback }, null, 2))
    process.exit(2)
  }
  await writeJson(path.resolve(output), proof)
  await writeJson(path.resolve(readbackOutput), readback)
  console.log(JSON.stringify({
    status: proof.status,
    proofRef: proof.proofRef,
    proofHash: proof.proofHash,
    readbackHash: readback.readbackHash,
    distributableRef: proof.sourceRefs.distributableRef,
    byteReferenceKey: proof.bytesRefs.byteReference.key,
    proofRung: proof.proofRung,
    nonClaims: proof.nonClaims
  }, null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
