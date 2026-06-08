import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  buildInstallableBundlePublicSeederDown,
  buildInstallableBundlePublicSeederProof,
  buildInstallableBundlePublicSeederReadback,
  validateInstallableBundlePublicSeederProof
} from '../examples/installable-participation-bundle-public-seeder-lifecycle.js'

function packsProof(overrides = {}) {
  return {
    schema: 'mesh-ecology-packs/installable-participation-bundle-proof@1',
    status: 'installable_participation_bundle_verified',
    proofRef: 'packs-installable-participation-bundle:test',
    proofHash: 'sha256:'.concat('a'.repeat(64)),
    sourceRefs: {
      distributableRef: 'packs-participation-distributable:test',
      profileRef: 'packs-participation-profile:test',
      bundleRef: 'packs-participation-bundle:test',
      verificationRef: 'packs-participation-verification:test'
    },
    archiveRefs: {
      archiveRef: 'packs-installable-participation-bundle:archive',
      archiveHash: 'sha256:'.concat('d'.repeat(64))
    },
    artifactCompatibility: {
      tarCompatible: true
    },
    targetMetadata: {
      os: 'linux',
      arch: 'x64',
      runtime: 'node:20.x'
    },
    componentTarget: {
      repoName: 'mesh-ecology-layer',
      componentRef: 'component:mesh-ecology-layer',
      declaredPrimaryCommand: 'run/run.sh',
      expectedStatus: {
        schema: 'mesh-ecology-layer/component-runtime-status@1',
        artifactKind: 'layer_owned_component_runtime_status',
        startedFile: 'runtime/layer-component-status.json',
        stoppedFile: 'runtime/layer-component-stopped.json'
      },
      layerOwnedStatusExpected: true,
      platformMayHostAndSurfaceStatus: true,
      packsOwnsBundleVerificationOnly: true
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

function archiveBytes() {
  return Buffer.from('fake tar bytes for unit proof')
}

function proofWithMatchingArchive(overrides = {}) {
  const bytes = archiveBytes()
  const proof = packsProof({
    archiveRefs: {
      archiveRef: 'packs-installable-participation-bundle:archive',
      archiveHash: `sha256:${createHash('sha256').update(bytes).digest('hex')}`
    }
  })
  return { proof: { ...proof, ...overrides }, bytes }
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
    hypercoreLength: 3,
    topic: 'e'.repeat(64),
    ...overrides
  }
}

export async function runInstallableParticipationBundlePublicSeederTests() {
  {
    const { proof: packs, bytes } = proofWithMatchingArchive()
    const proof = buildInstallableBundlePublicSeederProof({
      packsProof: packs,
      archiveBytes: bytes,
      storage: '/tmp/bytes-installable-public-seeder-test',
      observation: liveObservation(),
      publicHyperdht: true,
      createdAt: '2026-06-08T12:30:00.000Z',
      pid: 1234
    })
    const readback = buildInstallableBundlePublicSeederReadback({ proof })
    const down = buildInstallableBundlePublicSeederDown({ proof, stopped: true })

    assert.equal(proof.status, 'installable_bundle_public_seeder_live')
    assert.equal(proof.proofRung, 'hyperswarm_discovered_feed_backed')
    assert.equal(proof.sourceRefs.packsProofRef, packs.proofRef)
    assert.equal(proof.sourceRefs.packsArchiveHash, packs.archiveRefs.archiveHash)
    assert.equal(proof.componentTarget.repoName, 'mesh-ecology-layer')
    assert.equal(proof.componentTarget.expectedStatus.schema, 'mesh-ecology-layer/component-runtime-status@1')
    assert.equal(readback.componentTarget.repoName, 'mesh-ecology-layer')
    assert.equal(proof.bytesRefs.contentType, 'application/x-tar')
    assert.equal(proof.operationProof.bytesServedOverDefaultPublicHyperDht, true)
    assert.equal(proof.operationProof.packsVerificationTruthClaimed, false)
    assert.equal(proof.operationProof.platformActivationAuthorized, false)
    assert.equal(proof.operationProof.installReadyClaimed, false)
    assert.equal(proof.operationProof.nodeModulesTransferClaimedAsDecentralizedProof, false)
    assert.equal(proof.operationProof.externalFetchObserved, false)
    assert.equal(proof.nonClaims.platformInstallReady, false)
    assert.equal(readback.proofHashMatches, true)
    assert.equal(down.status, 'installable_bundle_public_seeder_stopped')
    assert.equal(down.cleanup.cleanupComplete, true)
    assert.deepEqual(validateInstallableBundlePublicSeederProof(proof), [])
  }

  {
    const { proof: packs, bytes } = proofWithMatchingArchive()
    packs.artifactCompatibility.tarCompatible = false
    packs.artifactAcquisition.nodeModulesIncluded = true
    packs.artifactAcquisition.externalNpmGithubHttpFetchDefaultAllowed = true
    const proof = buildInstallableBundlePublicSeederProof({
      packsProof: packs,
      archiveBytes: bytes,
      storage: null,
      observation: liveObservation(),
      publicHyperdht: false
    })

    assert.equal(proof.status, 'installable_bundle_public_seeder_blocked')
    assert.ok(proof.issues.includes('packs_archive_not_tar_compatible'))
    assert.ok(proof.issues.includes('storage_required'))
    assert.ok(proof.issues.includes('public_hyperdht_flag_required'))
    assert.ok(proof.issues.includes('node_modules_included'))
    assert.ok(proof.issues.includes('external_fetch_default_allowed'))
  }

  {
    const { proof: packs, bytes } = proofWithMatchingArchive()
    const proof = buildInstallableBundlePublicSeederProof({
      packsProof: packs,
      archiveBytes: bytes,
      storage: '/tmp/bytes-installable-public-seeder-test',
      observation: liveObservation({
        localHyperDhtTestnetUsed: true
      }),
      publicHyperdht: true
    })

    assert.equal(proof.status, 'installable_bundle_public_seeder_unresolved')
    assert.ok(validateInstallableBundlePublicSeederProof(proof).includes('local_testnet_overclaim'))
  }

  {
    const { proof: packs, bytes } = proofWithMatchingArchive()
    packs.componentTarget.expectedStatus.schema = 'mesh-ecology-layer/ambiguous-status@1'
    const proof = buildInstallableBundlePublicSeederProof({
      packsProof: packs,
      archiveBytes: bytes,
      storage: '/tmp/bytes-installable-public-seeder-test',
      observation: liveObservation(),
      publicHyperdht: true
    })

    assert.equal(proof.status, 'installable_bundle_public_seeder_blocked')
    assert.ok(proof.issues.includes('layer_component_status_schema_required'))
    assert.ok(validateInstallableBundlePublicSeederProof(proof).includes('layer_component_status_schema_required'))
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runInstallableParticipationBundlePublicSeederTests().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
