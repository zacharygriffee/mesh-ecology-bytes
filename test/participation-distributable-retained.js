import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import {
  buildParticipationDistributableRetainedProof,
  buildParticipationDistributableRetainedReadback,
  validateParticipationDistributableRetainedProof
} from '../examples/participation-distributable-retained-proof.js'

const execFileAsync = promisify(execFile)
const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const PACKS_DISTRIBUTABLE = path.resolve(
  ROOT,
  '../mesh-ecology-packs/proof-artifacts/participation-distributable-20260607T200000Z/distributable.json'
)
const cliPath = path.resolve(ROOT, 'examples/participation-distributable-retained-proof.js')

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'))
}

export async function runParticipationDistributableRetainedTests() {
  await testBuildRetainedProof()
  await testRejectOverclaims()
  await testCliWritesArtifacts()
}

async function testBuildRetainedProof() {
  const distributable = await readJson(PACKS_DISTRIBUTABLE)
  const proof = await buildParticipationDistributableRetainedProof({
    distributable,
    distributablePath: PACKS_DISTRIBUTABLE,
    sourcePacksCommitHash: '3b8248a',
    createdAt: '2026-06-07T20:10:00.000Z'
  })
  const readback = buildParticipationDistributableRetainedReadback({
    proof,
    readAt: '2026-06-07T20:10:01.000Z'
  })

  assert.equal(proof.schema, 'mesh-ecology-bytes/participation-distributable-retained-proof@1')
  assert.equal(proof.status, 'retained_readback_verified')
  assert.equal(proof.proofRung, 'local_feed')
  assert.equal(proof.sourceRefs.distributableRef, distributable.distributableRef)
  assert.equal(proof.operationProof.bytesPublishedDistributableToLocalCorestore, true)
  assert.equal(proof.operationProof.corestoreHypercoreReadbackObservedByBytes, true)
  assert.equal(proof.operationProof.retainedBytesAvailableForConduitReach, true)
  assert.equal(proof.operationProof.nodeModulesIncluded, false)
  assert.equal(proof.operationProof.publicSwarmProofClaimed, false)
  assert.equal(proof.operationProof.platformActivationAuthorized, false)
  assert.equal(proof.nonClaims.conduitReachProof, false)
  assert.equal(proof.nonClaims.platformActivation, false)
  assert.equal(readback.proofHashMatches, true)
  assert.deepEqual(validateParticipationDistributableRetainedProof(proof), [])
}

async function testRejectOverclaims() {
  const distributable = await readJson(PACKS_DISTRIBUTABLE)
  const proof = await buildParticipationDistributableRetainedProof({
    distributable,
    distributablePath: PACKS_DISTRIBUTABLE
  })
  proof.operationProof.nodeModulesIncluded = true
  proof.operationProof.nodeModulesTransferIsDecentralizedProof = true
  proof.operationProof.externalFetchObserved = true
  proof.operationProof.externalFetchIsDecentralizedProof = true
  proof.operationProof.publicSwarmProofClaimed = true
  proof.operationProof.platformActivationAuthorized = true
  proof.operationProof.authorityClaimed = true

  const issues = validateParticipationDistributableRetainedProof(proof)
  assert.ok(issues.includes('node_modules_must_not_be_retained_default'))
  assert.ok(issues.includes('node_modules_transfer_decentralized_overclaim'))
  assert.ok(issues.includes('external_fetch_observed_requires_exception'))
  assert.ok(issues.includes('external_fetch_decentralized_overclaim'))
  assert.ok(issues.includes('public_swarm_overclaim'))
  assert.ok(issues.includes('platform_activation_overclaim'))
  assert.ok(issues.includes('authority_overclaim'))
}

async function testCliWritesArtifacts() {
  const root = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-participation-retained-'))
  const output = path.join(root, 'proof.json')
  const readbackOutput = path.join(root, 'readback.json')

  try {
    await execFileAsync(process.execPath, [
      cliPath,
      '--distributable',
      PACKS_DISTRIBUTABLE,
      '--output',
      output,
      '--readback-output',
      readbackOutput,
      '--source-packs-commit-hash',
      '3b8248a',
      '--created-at',
      '2026-06-07T20:10:00.000Z',
      '--read-at',
      '2026-06-07T20:10:01.000Z'
    ])
    const proof = await readJson(output)
    const readback = await readJson(readbackOutput)
    assert.equal(proof.status, 'retained_readback_verified')
    assert.equal(proof.proofRung, 'local_feed')
    assert.equal(readback.proofHashMatches, true)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}
