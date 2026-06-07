import assert from 'node:assert/strict'

import {
  buildParticipationDistributablePublicSeederDown,
  buildParticipationDistributablePublicSeederProof,
  buildParticipationDistributablePublicSeederReadback,
  validateParticipationDistributablePublicSeederProof
} from '../examples/participation-distributable-public-seeder-lifecycle.js'

function distributable(overrides = {}) {
  return {
    schema: 'mesh_ecology_participation_distributable.v0',
    distributableRef: 'packs-participation-distributable:test',
    distributableHash: 'sha256:'.concat('a'.repeat(64)),
    sourceRefs: {
      profileRef: 'packs-participation-profile:test',
      bundleRef: 'packs-participation-bundle:test',
      verificationRef: 'packs-participation-verification:test'
    },
    targetMetadata: {
      os: 'linux',
      arch: 'x64',
      runtime: 'node:20.x'
    },
    artifactAcquisition: {
      preferredDefault: 'swarm_retained_artifacts_platform_local_install',
      nodeModulesIncluded: false,
      nodeModulesTransferDefaultAllowed: false,
      nodeModulesTransferIsDecentralizedProof: false,
      externalNpmGithubHttpFetchDefaultAllowed: false,
      externalFetchIsDecentralizedProof: false,
      externalFetchRequiresExplicitRbcReceipt: true
    },
    ...overrides
  }
}

function liveObservation(overrides = {}) {
  return {
    published: true,
    served: true,
    byteReference: {
      family: 'hypercore_immutable',
      key: 'b'.repeat(64),
      descriptorHash: 'c'.repeat(64),
      integrityHint: { algorithm: 'sha256', value: 'd'.repeat(64) }
    },
    hypercoreLength: 2,
    topic: 'e'.repeat(64),
    ...overrides
  }
}

export async function runParticipationDistributablePublicSeederTests() {
  {
    const proof = buildParticipationDistributablePublicSeederProof({
      distributable: distributable(),
      storage: '/tmp/bytes-public-seeder-test',
      observation: liveObservation(),
      publicHyperdht: true,
      createdAt: '2026-06-07T23:00:00.000Z',
      pid: 1234
    })
    const readback = buildParticipationDistributablePublicSeederReadback({ proof })
    const down = buildParticipationDistributablePublicSeederDown({ proof, stopped: true })

    assert.equal(proof.status, 'public_seeder_live')
    assert.equal(proof.proofRung, 'hyperswarm_discovered_feed_backed')
    assert.equal(proof.operationProof.bytesServedOverDefaultPublicHyperDht, true)
    assert.equal(proof.operationProof.publicSeederStillRunning, true)
    assert.equal(proof.operationProof.cleanupComplete, false)
    assert.equal(proof.operationProof.processLeftRunning, true)
    assert.equal(proof.operationProof.localFilesAreSeamTransport, false)
    assert.equal(proof.operationProof.sshIsSeamTransport, false)
    assert.equal(proof.operationProof.nodeModulesTransferClaimedAsDecentralizedProof, false)
    assert.equal(proof.operationProof.externalFetchObserved, false)
    assert.equal(proof.nonClaims.platformActivation, false)
    assert.equal(proof.nonClaims.deviceBoundaryProof, false)
    assert.equal(readback.proofHashMatches, true)
    assert.equal(down.status, 'public_seeder_stopped')
    assert.equal(down.cleanup.cleanupComplete, true)
    assert.equal(down.cleanup.processLeftRunning, false)
    assert.deepEqual(validateParticipationDistributablePublicSeederProof(proof), [])
  }

  {
    const material = distributable()
    material.artifactAcquisition.nodeModulesIncluded = true
    material.artifactAcquisition.externalNpmGithubHttpFetchDefaultAllowed = true
    const proof = buildParticipationDistributablePublicSeederProof({
      distributable: material,
      storage: null,
      observation: liveObservation(),
      publicHyperdht: false
    })

    assert.equal(proof.status, 'public_seeder_blocked')
    assert.ok(proof.issues.includes('storage_required'))
    assert.ok(proof.issues.includes('public_hyperdht_flag_required'))
    assert.ok(proof.issues.includes('node_modules_included'))
    assert.ok(proof.issues.includes('external_fetch_default_allowed'))
  }

  {
    const proof = buildParticipationDistributablePublicSeederProof({
      distributable: distributable(),
      storage: '/tmp/bytes-public-seeder-test',
      observation: liveObservation({
        localHyperDhtTestnetUsed: true
      }),
      publicHyperdht: true
    })

    assert.equal(proof.status, 'public_seeder_unresolved')
    assert.ok(validateParticipationDistributablePublicSeederProof(proof).includes('local_testnet_overclaim'))
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runParticipationDistributablePublicSeederTests().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
