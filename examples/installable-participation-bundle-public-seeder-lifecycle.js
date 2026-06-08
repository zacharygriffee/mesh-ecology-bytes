#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  createHyperswarmTransport,
  publishImmutableObject,
  serveImmutableObject
} from '../src/index.js'

export const INSTALLABLE_BUNDLE_PUBLIC_SEEDER_PROOF_SCHEMA =
  'mesh-ecology-bytes/installable-participation-bundle-public-seeder-proof@1'
export const INSTALLABLE_BUNDLE_PUBLIC_SEEDER_READBACK_SCHEMA =
  'mesh-ecology-bytes/installable-participation-bundle-public-seeder-readback@1'
export const INSTALLABLE_BUNDLE_PUBLIC_SEEDER_DOWN_SCHEMA =
  'mesh-ecology-bytes/installable-participation-bundle-public-seeder-down@1'

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

function sha256Buffer(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`
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

function argValue(argv, name) {
  const index = argv.indexOf(name)
  return index >= 0 ? argv[index + 1] ?? null : null
}

function hasArg(argv, name) {
  return argv.includes(name)
}

function dependencyAcquisition(proof = {}) {
  return proof.artifactAcquisition ?? {}
}

function componentTarget(proof = {}) {
  return proof.componentTarget ?? null
}

function validateInputs({ packsProof, archiveBytes, storage, publicHyperdht }) {
  const issues = []
  if (packsProof?.schema !== 'mesh-ecology-packs/installable-participation-bundle-proof@1') {
    issues.push('packs_installable_bundle_schema_invalid')
  }
  if (packsProof?.status !== 'installable_participation_bundle_verified') {
    issues.push('packs_installable_bundle_not_verified')
  }
  if (packsProof?.artifactCompatibility?.tarCompatible !== true) {
    issues.push('packs_archive_not_tar_compatible')
  }
  if (!packsProof?.archiveRefs?.archiveHash) issues.push('packs_archive_hash_required')
  if (archiveBytes && packsProof?.archiveRefs?.archiveHash !== sha256Buffer(archiveBytes)) {
    issues.push('archive_hash_mismatch')
  }
  if (!packsProof?.targetMetadata?.os) issues.push('target_os_required')
  if (!packsProof?.targetMetadata?.arch) issues.push('target_arch_required')
  if (!packsProof?.targetMetadata?.runtime) issues.push('target_runtime_required')
  if (!storage) issues.push('storage_required')
  if (publicHyperdht !== true) issues.push('public_hyperdht_flag_required')

  const acquisition = dependencyAcquisition(packsProof)
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
  const target = componentTarget(packsProof)
  if (target?.repoName === 'mesh-ecology-layer') {
    if (target.expectedStatus?.schema !== 'mesh-ecology-layer/component-runtime-status@1') {
      issues.push('layer_component_status_schema_required')
    }
    if (target.expectedStatus?.artifactKind !== 'layer_owned_component_runtime_status') {
      issues.push('layer_component_status_artifact_kind_required')
    }
    if (target.declaredPrimaryCommand !== 'run/run.sh') {
      issues.push('layer_component_primary_command_required')
    }
  }
  return issues
}

function baseOperationProof(overrides = {}) {
  return {
    bytesPublishedArchiveToPublisherCorestore: false,
    bytesServedOverDefaultPublicHyperDht: false,
    publicSeederStillRunning: false,
    defaultPublicHyperDhtUsed: true,
    localHyperDhtTestnetUsed: false,
    privateBootstrapUsed: false,
    localFilesAreSeamTransport: false,
    sshIsSeamTransport: false,
    nodeModulesTransferObserved: false,
    nodeModulesTransferClaimedAsDecentralizedProof: false,
    externalFetchObserved: false,
    externalFetchIsDecentralizedProof: false,
    packsVerificationTruthClaimed: false,
    conduitFetchedBytes: false,
    conduitStoredBytes: false,
    platformActivationAuthorized: false,
    installReadyClaimed: false,
    deviceBoundaryProofClaimed: false,
    authorityClaimed: false,
    cleanupComplete: false,
    processLeftRunning: true,
    ...overrides
  }
}

export function buildInstallableBundlePublicSeederProof({
  packsProof,
  packsProofPath = null,
  archivePath = null,
  storage = null,
  sourcePacksCommitHash = null,
  createdAt = new Date().toISOString(),
  pid = process.pid,
  observation = {},
  publicHyperdht = true,
  archiveBytes = null
}) {
  const inputIssues = validateInputs({ packsProof, archiveBytes, storage, publicHyperdht })
  const observationIssues = Array.isArray(observation.issues) ? observation.issues : []
  const complete = inputIssues.length === 0 &&
    observation.published === true &&
    observation.served === true &&
    observation.byteReference &&
    observation.defaultPublicHyperDhtUsed !== false &&
    observation.localHyperDhtTestnetUsed !== true &&
    observation.privateBootstrapUsed !== true
  const status = inputIssues.length > 0
    ? 'installable_bundle_public_seeder_blocked'
    : complete
      ? 'installable_bundle_public_seeder_live'
      : 'installable_bundle_public_seeder_unresolved'
  const byteReference = observation.byteReference ?? null
  const proof = {
    schema: INSTALLABLE_BUNDLE_PUBLIC_SEEDER_PROOF_SCHEMA,
    artifactKind: 'bytes_installable_participation_bundle_public_seeder_proof',
    createdAt,
    status,
    proofRung: complete ? 'hyperswarm_discovered_feed_backed' : 'local_feed_with_public_swarm_attempt',
    sourceRefs: {
      sourceRepo: 'mesh-ecology-packs',
      sourcePacksCommitHash,
      packsProofPath,
      packsProofRef: packsProof?.proofRef ?? null,
      packsProofHash: packsProof?.proofHash ?? null,
      packsArchiveRef: packsProof?.archiveRefs?.archiveRef ?? null,
      packsArchiveHash: packsProof?.archiveRefs?.archiveHash ?? null,
      archivePath,
      distributableRef: packsProof?.sourceRefs?.distributableRef ?? null,
      profileRef: packsProof?.sourceRefs?.profileRef ?? null,
      bundleRef: packsProof?.sourceRefs?.bundleRef ?? null,
      verificationRef: packsProof?.sourceRefs?.verificationRef ?? null
    },
    bytesRefs: {
      byteReference,
      expectedHash: packsProof?.archiveRefs?.archiveHash ?? null,
      hypercoreKey: byteReference?.key ?? null,
      hypercoreLength: observation.hypercoreLength ?? null,
      descriptorHash: byteReference?.descriptorHash ?? null,
      contentType: 'application/x-tar'
    },
    storageRefs: {
      publisherStorageRef: storage ? `bytes-installable-bundle-public-seeder:${createHash('sha256').update(path.resolve(storage)).digest('hex').slice(0, 16)}` : null,
      storageOwner: 'mesh-ecology-bytes',
      storageNotMovedBetweenDevices: true,
      storageNotSharedAcrossProcesses: true
    },
    seederRefs: {
      pid,
      transport: 'default_public_hyperdht_hyperswarm',
      topic: observation.topic ?? null,
      attempts: observation.attempts ?? []
    },
    targetMetadata: packsProof?.targetMetadata ?? null,
    componentTarget: componentTarget(packsProof),
    dependencyAcquisition: dependencyAcquisition(packsProof),
    operationProof: baseOperationProof({
      bytesPublishedArchiveToPublisherCorestore: observation.published === true,
      bytesServedOverDefaultPublicHyperDht: observation.served === true,
      publicSeederStillRunning: complete,
      localHyperDhtTestnetUsed: observation.localHyperDhtTestnetUsed === true,
      privateBootstrapUsed: observation.privateBootstrapUsed === true,
      processLeftRunning: complete,
      cleanupComplete: false
    }),
    nonClaims: {
      packsVerificationTruth: false,
      conduitReachProof: false,
      conduitByteCustody: false,
      conduitMaterialization: false,
      platformAuthorization: false,
      platformActivation: false,
      platformInstallReady: false,
      deviceBoundaryProof: false,
      rbcGovernance: false,
      governedSeam: false,
      productionDurability: false,
      canonicalTruth: false,
      authority: false
    },
    issues: [...inputIssues, ...observationIssues],
    nextPosture: complete
      ? 'conduit_or_platform_materializes_installable_archive_while_bytes_public_seeder_is_live'
      : 'repair_bytes_installable_bundle_public_seeder_availability'
  }
  proof.proofHash = sha256Json(withoutHash(proof, ['proofHash', 'proofRef']))
  proof.proofRef = `bytes-installable-bundle-public-seeder:${proof.proofHash.slice('sha256:'.length, 'sha256:'.length + 16)}`
  return proof
}

export function buildInstallableBundlePublicSeederReadback({
  proof,
  proofPath = null,
  readAt = new Date().toISOString()
}) {
  const recomputedProofHash = sha256Json(withoutHash(proof, ['proofHash', 'proofRef']))
  const readback = {
    schema: INSTALLABLE_BUNDLE_PUBLIC_SEEDER_READBACK_SCHEMA,
    artifactKind: 'bytes_installable_participation_bundle_public_seeder_readback',
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
    seederRefs: proof?.seederRefs ?? null,
    componentTarget: proof?.componentTarget ?? null,
    operationProof: proof?.operationProof ?? null,
    nonClaims: proof?.nonClaims ?? null,
    nextPosture: proof?.nextPosture ?? null
  }
  readback.readbackHash = sha256Json(withoutHash(readback, ['readbackHash', 'readbackRef']))
  readback.readbackRef = `bytes-installable-bundle-public-seeder-readback:${readback.readbackHash.slice('sha256:'.length, 'sha256:'.length + 16)}`
  return readback
}

export function buildInstallableBundlePublicSeederDown({
  proof,
  stoppedAt = new Date().toISOString(),
  signal = 'SIGTERM',
  stopped = true
}) {
  const down = {
    schema: INSTALLABLE_BUNDLE_PUBLIC_SEEDER_DOWN_SCHEMA,
    artifactKind: 'bytes_installable_participation_bundle_public_seeder_down',
    stoppedAt,
    status: stopped ? 'installable_bundle_public_seeder_stopped' : 'installable_bundle_public_seeder_stop_unresolved',
    sourceProofRef: proof?.proofRef ?? null,
    sourceProofHash: proof?.proofHash ?? null,
    sourceByteReferenceKey: proof?.bytesRefs?.hypercoreKey ?? null,
    signal,
    cleanup: {
      cleanupComplete: stopped,
      processLeftRunning: !stopped,
      storageMovedBetweenDevices: false,
      storageSharedAcrossProcesses: false
    },
    nonClaims: {
      seamTransport: false,
      platformActivation: false,
      installReady: false,
      deviceBoundaryProof: false,
      productionDurability: false,
      authority: false
    }
  }
  down.downHash = sha256Json(withoutHash(down, ['downHash', 'downRef']))
  down.downRef = `bytes-installable-bundle-public-seeder-down:${down.downHash.slice('sha256:'.length, 'sha256:'.length + 16)}`
  return down
}

export function validateInstallableBundlePublicSeederProof(proof = {}) {
  const issues = []
  if (proof.schema !== INSTALLABLE_BUNDLE_PUBLIC_SEEDER_PROOF_SCHEMA) issues.push('schema_mismatch')
  if (![
    'installable_bundle_public_seeder_live',
    'installable_bundle_public_seeder_unresolved',
    'installable_bundle_public_seeder_blocked'
  ].includes(proof.status)) {
    issues.push('status_invalid')
  }
  if (proof.status === 'installable_bundle_public_seeder_live') {
    for (const [value, issue] of [
      [proof.operationProof?.bytesPublishedArchiveToPublisherCorestore, 'publish_required'],
      [proof.operationProof?.bytesServedOverDefaultPublicHyperDht, 'serve_required'],
      [proof.operationProof?.publicSeederStillRunning, 'seeder_running_required'],
      [proof.operationProof?.defaultPublicHyperDhtUsed, 'default_public_hyperdht_required'],
      [proof.operationProof?.processLeftRunning, 'process_running_required']
    ]) {
      if (value !== true) issues.push(issue)
    }
  }
  if (!proof.sourceRefs?.packsProofRef) issues.push('packs_proof_ref_required')
  if (!proof.sourceRefs?.packsArchiveHash) issues.push('packs_archive_hash_required')
  if (!proof.targetMetadata?.os) issues.push('target_os_required')
  if (!proof.targetMetadata?.arch) issues.push('target_arch_required')
  if (!proof.targetMetadata?.runtime) issues.push('target_runtime_required')
  if (proof.componentTarget?.repoName === 'mesh-ecology-layer') {
    if (proof.componentTarget.expectedStatus?.schema !== 'mesh-ecology-layer/component-runtime-status@1') {
      issues.push('layer_component_status_schema_required')
    }
    if (proof.componentTarget.expectedStatus?.artifactKind !== 'layer_owned_component_runtime_status') {
      issues.push('layer_component_status_artifact_kind_required')
    }
    if (proof.componentTarget.declaredPrimaryCommand !== 'run/run.sh') {
      issues.push('layer_component_primary_command_required')
    }
  }
  for (const [value, issue] of [
    [proof.operationProof?.localHyperDhtTestnetUsed, 'local_testnet_overclaim'],
    [proof.operationProof?.privateBootstrapUsed, 'private_bootstrap_overclaim'],
    [proof.operationProof?.localFilesAreSeamTransport, 'local_files_seam_transport_overclaim'],
    [proof.operationProof?.sshIsSeamTransport, 'ssh_seam_transport_overclaim'],
    [proof.operationProof?.nodeModulesTransferClaimedAsDecentralizedProof, 'node_modules_decentralized_overclaim'],
    [proof.operationProof?.externalFetchObserved, 'external_fetch_observed'],
    [proof.operationProof?.externalFetchIsDecentralizedProof, 'external_fetch_decentralized_overclaim'],
    [proof.operationProof?.packsVerificationTruthClaimed, 'packs_truth_overclaim'],
    [proof.operationProof?.platformActivationAuthorized, 'platform_activation_overclaim'],
    [proof.operationProof?.installReadyClaimed, 'install_ready_overclaim'],
    [proof.operationProof?.deviceBoundaryProofClaimed, 'device_boundary_overclaim'],
    [proof.operationProof?.authorityClaimed, 'authority_overclaim'],
    [proof.nonClaims?.authority, 'authority_nonclaim_overclaim'],
    [proof.nonClaims?.platformInstallReady, 'platform_install_ready_nonclaim_overclaim']
  ]) {
    if (value === true) issues.push(issue)
  }
  return issues
}

async function runUp(argv) {
  const packsProofPath = argValue(argv, '--packs-proof')
  const archivePath = argValue(argv, '--archive')
  const storage = argValue(argv, '--storage')
  const output = argValue(argv, '--output')
  const readbackOutput = argValue(argv, '--readback-output')
  const pidFile = argValue(argv, '--pid-file')
  const publicHyperdht = hasArg(argv, '--public-hyperdht')
  if (!packsProofPath || !archivePath || !storage || !output || !readbackOutput || !pidFile) {
    console.error('Usage: node examples/installable-participation-bundle-public-seeder-lifecycle.js up --packs-proof <proof> --archive <tar> --storage <path> --output <proof> --readback-output <readback> --pid-file <pid> --public-hyperdht')
    return 2
  }
  if (hasArg(argv, '--testnet') || hasArg(argv, '--bootstrap') || hasArg(argv, '--private-bootstrap')) {
    console.error('This seeder lane requires default public HyperDHT/Hyperswarm; testnet/private bootstrap flags are not accepted.')
    return 2
  }
  const packsProof = await readJson(packsProofPath)
  const archiveBytes = await readFile(path.resolve(archivePath))
  const inputIssues = validateInputs({ packsProof, archiveBytes, storage, publicHyperdht })
  let transport = null
  let served = null
  const attempts = []
  let proof
  try {
    let observation = { issues: inputIssues }
    if (inputIssues.length === 0) {
      const published = await publishImmutableObject({
        storage: path.resolve(storage),
        bytes: archiveBytes,
        descriptor: {
          contentType: 'application/x-tar',
          size: archiveBytes.length,
          framing: 'posix_tar',
          materializationHints: {
            preferredMode: 'mirror',
            visibility: 'internal',
            placementClass: 'installable_participation_bundle',
            filenameHint: 'installable-participation-bundle.tar'
          },
          integrityHint: {
            algorithm: 'sha256',
            value: packsProof.archiveRefs.archiveHash.slice('sha256:'.length)
          },
          role: 'installable_participation_bundle',
          logicalId: packsProof?.archiveRefs?.archiveRef ?? 'packs-installable-participation-bundle:unknown'
        }
      })
      attempts.push({ step: 'publish-installable-archive', status: 'complete' })
      transport = createHyperswarmTransport()
      served = await serveImmutableObject({
        storage: path.resolve(storage),
        reference: published.reference,
        transport
      })
      attempts.push({ step: 'serve-default-public-hyperdht', status: 'complete' })
      observation = {
        published: true,
        served: true,
        byteReference: published.reference,
        hypercoreLength: published.object.totalBlockCount,
        topic: served.topic?.toString?.('hex') ?? null,
        localHyperDhtTestnetUsed: false,
        privateBootstrapUsed: false,
        attempts
      }
    }
    proof = buildInstallableBundlePublicSeederProof({
      packsProof,
      packsProofPath,
      archivePath,
      archiveBytes,
      storage,
      sourcePacksCommitHash: argValue(argv, '--source-packs-commit-hash'),
      createdAt: argValue(argv, '--created-at') ?? new Date().toISOString(),
      observation,
      publicHyperdht
    })
    const readback = buildInstallableBundlePublicSeederReadback({
      proof,
      proofPath: output,
      readAt: argValue(argv, '--read-at') ?? new Date().toISOString()
    })
    const validationIssues = validateInstallableBundlePublicSeederProof(proof)
    if (validationIssues.length > 0) proof.issues = [...new Set([...proof.issues, ...validationIssues])]
    await writeJson(output, proof)
    await writeJson(readbackOutput, readback)
    await writeJson(pidFile, {
      pid: process.pid,
      proofPath: path.resolve(output),
      proofRef: proof.proofRef,
      proofHash: proof.proofHash,
      storage: path.resolve(storage),
      byteReferenceKey: proof.bytesRefs.hypercoreKey,
      startedAt: proof.createdAt
    })
    console.log(JSON.stringify({
      status: proof.status,
      proofRef: proof.proofRef,
      proofHash: proof.proofHash,
      byteReferenceKey: proof.bytesRefs.hypercoreKey,
      topic: proof.seederRefs.topic,
      pid: process.pid,
      proofRung: proof.proofRung,
      packsArchiveHash: proof.sourceRefs.packsArchiveHash,
      nonClaims: proof.nonClaims,
      issues: proof.issues
    }, null, 2))
    if (proof.status !== 'installable_bundle_public_seeder_live') {
      return proof.status === 'installable_bundle_public_seeder_blocked' ? 2 : 1
    }
    await new Promise((resolve) => {
      const done = () => resolve()
      process.once('SIGTERM', done)
      process.once('SIGINT', done)
    })
    return 0
  } finally {
    await Promise.allSettled([
      served?.close?.(),
      transport?.close?.()
    ])
  }
}

async function runDown(argv) {
  const pidFile = argValue(argv, '--pid-file')
  const output = argValue(argv, '--output')
  const proofPath = argValue(argv, '--proof') ?? null
  if (!pidFile || !output) {
    console.error('Usage: node examples/installable-participation-bundle-public-seeder-lifecycle.js down --pid-file <pid> --output <down> [--proof <proof>]')
    return 2
  }
  const pidInfo = await readJson(pidFile)
  const proof = proofPath ? await readJson(proofPath) : await readJson(pidInfo.proofPath)
  let stopped = false
  try {
    process.kill(pidInfo.pid, 'SIGTERM')
    stopped = true
  } catch (error) {
    stopped = error?.code === 'ESRCH'
  }
  const deadline = Date.now() + 5000
  while (Date.now() < deadline) {
    try {
      process.kill(pidInfo.pid, 0)
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      stopped = error?.code === 'ESRCH'
      break
    }
  }
  const down = buildInstallableBundlePublicSeederDown({
    proof,
    stopped,
    signal: 'SIGTERM',
    stoppedAt: argValue(argv, '--stopped-at') ?? new Date().toISOString()
  })
  await writeJson(output, down)
  console.log(JSON.stringify({
    status: down.status,
    downRef: down.downRef,
    sourceProofRef: down.sourceProofRef,
    cleanupComplete: down.cleanup.cleanupComplete,
    processLeftRunning: down.cleanup.processLeftRunning
  }, null, 2))
  return stopped ? 0 : 2
}

async function main(argv = process.argv.slice(2)) {
  const command = argv[0]
  if (command === 'up') return runUp(argv.slice(1))
  if (command === 'down') return runDown(argv.slice(1))
  console.error('Usage: node examples/installable-participation-bundle-public-seeder-lifecycle.js <up|down> ...')
  return 2
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => {
    process.exitCode = code
  }).catch((error) => {
    console.error(error?.stack ?? error)
    process.exitCode = 1
  })
}
