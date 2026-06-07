#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  createHyperswarmTransport,
  fetchImmutableObject,
  publishImmutableObject,
  readImmutableObject,
  serveImmutableObject
} from '../src/index.js'

export const PARTICIPATION_DISTRIBUTABLE_PUBLIC_PATHWAY_PROOF_SCHEMA =
  'mesh-ecology-bytes/participation-distributable-public-pathway-proof@1'
export const PARTICIPATION_DISTRIBUTABLE_PUBLIC_PATHWAY_READBACK_SCHEMA =
  'mesh-ecology-bytes/participation-distributable-public-pathway-readback@1'

function argValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] ?? null : null
}

function hasArg(name) {
  return process.argv.includes(name)
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
  const resolved = path.resolve(file)
  await mkdir(path.dirname(resolved), { recursive: true })
  await writeFile(resolved, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function dependencyAcquisition(distributable = {}) {
  return distributable.artifactAcquisition ?? distributable.dependencyAcquisition ?? {}
}

function validateInputs({ distributable, publisherStorage, consumerStorage, publicHyperdht }) {
  const issues = []
  if (distributable?.schema !== 'mesh_ecology_participation_distributable.v0') {
    issues.push('distributable_schema_invalid')
  }
  if (!publisherStorage) issues.push('publisher_storage_required')
  if (!consumerStorage) issues.push('consumer_storage_required')
  if (publisherStorage && consumerStorage && path.resolve(publisherStorage) === path.resolve(consumerStorage)) {
    issues.push('independent_storage_roots_required')
  }
  if (publicHyperdht !== true) issues.push('public_hyperdht_flag_required')

  const acquisition = dependencyAcquisition(distributable)
  if (acquisition.nodeModulesIncluded !== false) issues.push('node_modules_included')
  if (acquisition.nodeModulesTransferDefaultAllowed !== false) {
    issues.push('node_modules_transfer_default_allowed')
  }
  if (acquisition.nodeModulesTransferIsDecentralizedProof !== false) {
    issues.push('node_modules_transfer_claimed_as_decentralized_proof')
  }
  if (acquisition.externalNpmGithubHttpFetchDefaultAllowed !== false) {
    issues.push('external_fetch_default_allowed')
  }
  if (acquisition.externalFetchIsDecentralizedProof !== false) {
    issues.push('external_fetch_claimed_as_decentralized_proof')
  }
  if (acquisition.externalFetchRequiresExplicitRbcReceipt !== true) {
    issues.push('external_fetch_rbc_exception_requirement_missing')
  }
  return issues
}

function baseOperationProof(overrides = {}) {
  return {
    bytesPublishedDistributableToPublisherCorestore: false,
    bytesServedOverDefaultPublicHyperDht: false,
    bytesFetchedIntoConsumerCorestore: false,
    descriptorHashVerified: false,
    payloadHashVerified: false,
    consumerReadbackAfterFetchVerified: false,
    independentStorageRootsUsed: false,
    defaultPublicHyperDhtUsed: true,
    localHyperDhtTestnetUsed: false,
    privateBootstrapUsed: false,
    localFilesAreSeamTransport: false,
    sshIsSeamTransport: false,
    nodeModulesTransferObserved: false,
    nodeModulesTransferClaimedAsDecentralizedProof: false,
    externalFetchObserved: false,
    externalFetchIsDecentralizedProof: false,
    conduitFetchedBytes: false,
    conduitStoredBytes: false,
    conduitMaterializedBytes: false,
    platformActivationAuthorized: false,
    deviceBoundaryProofClaimed: false,
    authorityClaimed: false,
    cleanupComplete: false,
    processLeftRunning: false,
    ...overrides
  }
}

export function buildParticipationDistributablePublicPathwayProof({
  distributable,
  distributablePath = null,
  publisherStorage = null,
  consumerStorage = null,
  sourcePacksCommitHash = null,
  createdAt = new Date().toISOString(),
  timeoutMs = 30000,
  observation = {},
  publicHyperdht = true
}) {
  const inputIssues = validateInputs({ distributable, publisherStorage, consumerStorage, publicHyperdht })
  const observationIssues = Array.isArray(observation.issues) ? observation.issues : []
  const complete = inputIssues.length === 0 &&
    observation.publicSwarmFetchComplete === true &&
    observation.payloadHashVerified === true &&
    observation.descriptorHashVerified === true &&
    observation.consumerReadbackAfterFetchVerified === true &&
    observation.cleanupComplete === true &&
    observation.localHyperDhtTestnetUsed !== true &&
    observation.privateBootstrapUsed !== true
  const status = inputIssues.length > 0
    ? 'public_pathway_blocked'
    : complete
      ? 'public_pathway_complete'
      : 'public_pathway_unresolved'
  const expectedPayloadHash = distributable
    ? createHash('sha256').update(Buffer.from(JSON.stringify(distributable, null, 2))).digest('hex')
    : null
  const byteReference = observation.byteReference ?? null
  const proof = {
    schema: PARTICIPATION_DISTRIBUTABLE_PUBLIC_PATHWAY_PROOF_SCHEMA,
    artifactKind: 'bytes_participation_distributable_public_pathway_proof',
    createdAt,
    status,
    proofRung: complete ? 'hyperswarm_discovered_feed_backed' : 'local_feed_with_public_swarm_attempt',
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
      byteReference,
      expectedHash: expectedPayloadHash ? `sha256:${expectedPayloadHash}` : null,
      hypercoreKey: byteReference?.key ?? null,
      hypercoreLength: observation.hypercoreLength ?? null,
      descriptorHash: byteReference?.descriptorHash ?? null
    },
    storageRefs: {
      publisherStorageRef: publisherStorage ? `bytes-public-pathway-publisher:${createHash('sha256').update(path.resolve(publisherStorage)).digest('hex').slice(0, 16)}` : null,
      consumerStorageRef: consumerStorage ? `bytes-public-pathway-consumer:${createHash('sha256').update(path.resolve(consumerStorage)).digest('hex').slice(0, 16)}` : null,
      independentStorageRootsUsed: publisherStorage && consumerStorage
        ? path.resolve(publisherStorage) !== path.resolve(consumerStorage)
        : false
    },
    pathwayRefs: {
      transport: 'default_public_hyperdht_hyperswarm',
      topic: observation.topic ?? null,
      attempts: observation.attempts ?? [],
      timeoutMs
    },
    targetMetadata: distributable?.targetMetadata ?? null,
    dependencyAcquisition: dependencyAcquisition(distributable),
    operationProof: baseOperationProof({
      bytesPublishedDistributableToPublisherCorestore: observation.published === true,
      bytesServedOverDefaultPublicHyperDht: observation.served === true,
      bytesFetchedIntoConsumerCorestore: observation.fetched === true,
      descriptorHashVerified: observation.descriptorHashVerified === true,
      payloadHashVerified: observation.payloadHashVerified === true,
      consumerReadbackAfterFetchVerified: observation.consumerReadbackAfterFetchVerified === true,
      independentStorageRootsUsed: publisherStorage && consumerStorage
        ? path.resolve(publisherStorage) !== path.resolve(consumerStorage)
        : false,
      localHyperDhtTestnetUsed: observation.localHyperDhtTestnetUsed === true,
      privateBootstrapUsed: observation.privateBootstrapUsed === true,
      cleanupComplete: observation.cleanupComplete === true,
      processLeftRunning: observation.processLeftRunning === true
    }),
    nonClaims: {
      packsVerificationTruth: false,
      conduitReachProof: false,
      conduitByteCustody: false,
      conduitMaterialization: false,
      platformAuthorization: false,
      platformActivation: false,
      deviceBoundaryProof: false,
      rbcGovernance: false,
      governedSeam: false,
      productionDurability: false,
      canonicalTruth: false,
      authority: false
    },
    issues: [...inputIssues, ...observationIssues],
    nextPosture: complete
      ? 'conduit_consume_bytes_public_pathway_for_live_retained_distribution'
      : 'rerun_bytes_public_pathway_or_repair_swarm_timing'
  }
  proof.proofHash = sha256Json(withoutHash(proof, ['proofHash', 'proofRef']))
  proof.proofRef = `bytes-participation-distributable-public-pathway:${proof.proofHash.slice('sha256:'.length, 'sha256:'.length + 16)}`
  return proof
}

export function buildParticipationDistributablePublicPathwayReadback({
  proof,
  proofPath = null,
  readAt = new Date().toISOString()
}) {
  const recomputedProofHash = sha256Json(withoutHash(proof, ['proofHash', 'proofRef']))
  const readback = {
    schema: PARTICIPATION_DISTRIBUTABLE_PUBLIC_PATHWAY_READBACK_SCHEMA,
    artifactKind: 'bytes_participation_distributable_public_pathway_readback',
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
    storageRefs: proof?.storageRefs ?? null,
    pathwayRefs: proof?.pathwayRefs ?? null,
    operationProof: proof?.operationProof ?? null,
    nonClaims: proof?.nonClaims ?? null,
    nextPosture: proof?.nextPosture ?? null
  }
  readback.readbackHash = sha256Json(withoutHash(readback, ['readbackHash', 'readbackRef']))
  readback.readbackRef = `bytes-participation-distributable-public-pathway-readback:${readback.readbackHash.slice('sha256:'.length, 'sha256:'.length + 16)}`
  return readback
}

export function validateParticipationDistributablePublicPathwayProof(proof = {}) {
  const issues = []
  if (proof.schema !== PARTICIPATION_DISTRIBUTABLE_PUBLIC_PATHWAY_PROOF_SCHEMA) issues.push('schema_mismatch')
  if (!['public_pathway_complete', 'public_pathway_unresolved', 'public_pathway_blocked'].includes(proof.status)) {
    issues.push('status_invalid')
  }
  if (proof.status === 'public_pathway_complete') {
    for (const [value, issue] of [
      [proof.operationProof?.bytesPublishedDistributableToPublisherCorestore, 'publish_required'],
      [proof.operationProof?.bytesServedOverDefaultPublicHyperDht, 'serve_required'],
      [proof.operationProof?.bytesFetchedIntoConsumerCorestore, 'fetch_required'],
      [proof.operationProof?.descriptorHashVerified, 'descriptor_hash_required'],
      [proof.operationProof?.payloadHashVerified, 'payload_hash_required'],
      [proof.operationProof?.consumerReadbackAfterFetchVerified, 'consumer_readback_required'],
      [proof.operationProof?.independentStorageRootsUsed, 'independent_storage_required'],
      [proof.operationProof?.defaultPublicHyperDhtUsed, 'default_public_hyperdht_required'],
      [proof.operationProof?.cleanupComplete, 'cleanup_required']
    ]) {
      if (value !== true) issues.push(issue)
    }
  }
  for (const [value, issue] of [
    [proof.operationProof?.localHyperDhtTestnetUsed, 'local_testnet_overclaim'],
    [proof.operationProof?.privateBootstrapUsed, 'private_bootstrap_overclaim'],
    [proof.operationProof?.localFilesAreSeamTransport, 'local_files_seam_transport_overclaim'],
    [proof.operationProof?.sshIsSeamTransport, 'ssh_seam_transport_overclaim'],
    [proof.operationProof?.nodeModulesTransferObserved, 'node_modules_transfer_observed'],
    [proof.operationProof?.nodeModulesTransferClaimedAsDecentralizedProof, 'node_modules_decentralized_overclaim'],
    [proof.operationProof?.externalFetchObserved, 'external_fetch_observed'],
    [proof.operationProof?.externalFetchIsDecentralizedProof, 'external_fetch_decentralized_overclaim'],
    [proof.operationProof?.platformActivationAuthorized, 'platform_activation_overclaim'],
    [proof.operationProof?.deviceBoundaryProofClaimed, 'device_boundary_overclaim'],
    [proof.operationProof?.authorityClaimed, 'authority_overclaim'],
    [proof.nonClaims?.authority, 'authority_nonclaim_overclaim']
  ]) {
    if (value === true) issues.push(issue)
  }
  return issues
}

async function runPublicPathway({
  distributable,
  publisherStorage,
  consumerStorage,
  timeoutMs
}) {
  const payload = Buffer.from(JSON.stringify(distributable, null, 2))
  const expectedHash = createHash('sha256').update(payload).digest('hex')
  const publisherTransport = createHyperswarmTransport()
  const consumerTransport = createHyperswarmTransport()
  let served = null
  const attempts = []

  try {
    const published = await publishImmutableObject({
      storage: publisherStorage,
      bytes: payload,
      descriptor: {
        contentType: 'application/json',
        size: payload.length,
        encoding: 'utf8',
        materializationHints: {
          preferredMode: 'mirror',
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
    attempts.push({ step: 'publish', status: 'complete' })

    served = await serveImmutableObject({
      storage: publisherStorage,
      reference: published.reference,
      transport: publisherTransport
    })
    attempts.push({ step: 'serve-default-public-hyperdht', status: 'complete' })

    const fetched = await fetchImmutableObject({
      storage: consumerStorage,
      reference: published.reference,
      transport: consumerTransport,
      as: 'buffer',
      timeoutMs
    })
    attempts.push({ step: 'fetch-default-public-hyperdht', status: 'complete' })

    const localReadback = await readImmutableObject({
      storage: consumerStorage,
      reference: published.reference,
      as: 'buffer'
    })
    attempts.push({ step: 'consumer-readback', status: 'complete' })

    return {
      published: true,
      served: true,
      fetched: true,
      publicSwarmFetchComplete: true,
      byteReference: published.reference,
      hypercoreLength: published.object.totalBlockCount,
      topic: served.topic?.toString?.('hex') ?? null,
      descriptorHashVerified: fetched.reference.descriptorHash === published.reference.descriptorHash,
      payloadHashVerified: createHash('sha256').update(fetched.bytes).digest('hex') === expectedHash,
      consumerReadbackAfterFetchVerified: createHash('sha256').update(localReadback.bytes).digest('hex') === expectedHash,
      localHyperDhtTestnetUsed: false,
      privateBootstrapUsed: false,
      cleanupComplete: false,
      processLeftRunning: false,
      attempts
    }
  } catch (error) {
    attempts.push({ step: 'public-pathway', status: 'unresolved', error: error?.message ?? String(error) })
    return {
      published: attempts.some((attempt) => attempt.step === 'publish' && attempt.status === 'complete'),
      served: attempts.some((attempt) => attempt.step === 'serve-default-public-hyperdht' && attempt.status === 'complete'),
      fetched: false,
      publicSwarmFetchComplete: false,
      localHyperDhtTestnetUsed: false,
      privateBootstrapUsed: false,
      cleanupComplete: false,
      processLeftRunning: false,
      attempts,
      issues: ['public_swarm_fetch_unresolved']
    }
  } finally {
    await Promise.allSettled([
      served?.close?.(),
      publisherTransport.close(),
      consumerTransport.close()
    ])
  }
}

async function main() {
  const distributablePath = argValue('--distributable')
  const publisherStorage = argValue('--publisher-storage')
  const consumerStorage = argValue('--consumer-storage')
  const output = argValue('--output')
  const readbackOutput = argValue('--readback-output')
  const publicHyperdht = hasArg('--public-hyperdht')
  const timeoutMs = Number.parseInt(argValue('--timeout-ms') ?? '30000', 10)
  if (!distributablePath || !publisherStorage || !consumerStorage || !output || !readbackOutput) {
    console.error('Usage: node examples/participation-distributable-public-pathway-proof.js --distributable <path> --publisher-storage <path> --consumer-storage <path> --output <proof> --readback-output <readback> --public-hyperdht')
    process.exit(2)
  }
  if (hasArg('--testnet') || hasArg('--bootstrap') || hasArg('--private-bootstrap')) {
    console.error('This proof lane requires default public HyperDHT/Hyperswarm; testnet/private bootstrap flags are not accepted.')
    process.exit(2)
  }
  const distributable = await readJson(distributablePath)
  const inputIssues = validateInputs({ distributable, publisherStorage, consumerStorage, publicHyperdht })
  const observation = inputIssues.length === 0
    ? await runPublicPathway({
      distributable,
      publisherStorage: path.resolve(publisherStorage),
      consumerStorage: path.resolve(consumerStorage),
      timeoutMs
    })
    : { issues: inputIssues, cleanupComplete: true }
  observation.cleanupComplete = true
  const proof = buildParticipationDistributablePublicPathwayProof({
    distributable,
    distributablePath,
    publisherStorage,
    consumerStorage,
    sourcePacksCommitHash: argValue('--source-packs-commit-hash'),
    createdAt: argValue('--created-at') ?? new Date().toISOString(),
    timeoutMs,
    observation,
    publicHyperdht
  })
  const readback = buildParticipationDistributablePublicPathwayReadback({
    proof,
    proofPath: output,
    readAt: argValue('--read-at') ?? new Date().toISOString()
  })
  const validationIssues = validateParticipationDistributablePublicPathwayProof(proof)
  if (validationIssues.length > 0) proof.issues = [...new Set([...proof.issues, ...validationIssues])]
  await writeJson(output, proof)
  await writeJson(readbackOutput, readback)
  console.log(JSON.stringify({
    status: proof.status,
    proofRef: proof.proofRef,
    proofHash: proof.proofHash,
    readbackHash: readback.readbackHash,
    distributableRef: proof.sourceRefs.distributableRef,
    byteReferenceKey: proof.bytesRefs.hypercoreKey,
    topic: proof.pathwayRefs.topic,
    proofRung: proof.proofRung,
    cleanupComplete: proof.operationProof.cleanupComplete,
    nonClaims: proof.nonClaims,
    issues: proof.issues
  }, null, 2))
  process.exit(proof.status === 'public_pathway_blocked' ? 2 : 0)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error?.stack ?? error)
    process.exit(1)
  })
}
