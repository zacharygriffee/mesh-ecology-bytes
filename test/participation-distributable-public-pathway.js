import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
  buildParticipationDistributablePublicPathwayProof,
  buildParticipationDistributablePublicPathwayReadback,
  validateParticipationDistributablePublicPathwayProof
} from '../examples/participation-distributable-public-pathway-proof.js'

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

async function storageRoots() {
  const publisher = await mkdtemp(path.join(tmpdir(), 'bytes-public-pathway-publisher-'))
  const consumer = await mkdtemp(path.join(tmpdir(), 'bytes-public-pathway-consumer-'))
  return {
    publisher,
    consumer,
    async cleanup() {
      await Promise.allSettled([
        rm(publisher, { recursive: true, force: true }),
        rm(consumer, { recursive: true, force: true })
      ])
    }
  }
}

export async function runParticipationDistributablePublicPathwayTests() {
  {
    const roots = await storageRoots()
    try {
      const proof = buildParticipationDistributablePublicPathwayProof({
        distributable: distributable(),
        publisherStorage: roots.publisher,
        consumerStorage: roots.consumer,
        observation: {
          publicSwarmFetchComplete: true,
          published: true,
          served: true,
          fetched: true,
          byteReference: {
            family: 'hypercore_immutable',
            key: 'b'.repeat(64),
            descriptorHash: 'c'.repeat(64),
            integrityHint: { algorithm: 'sha256', value: 'd'.repeat(64) }
          },
          hypercoreLength: 2,
          topic: 'e'.repeat(64),
          descriptorHashVerified: true,
          payloadHashVerified: true,
          consumerReadbackAfterFetchVerified: true,
          cleanupComplete: true
        },
        publicHyperdht: true,
        createdAt: '2026-06-07T21:00:00.000Z'
      })
      const readback = buildParticipationDistributablePublicPathwayReadback({ proof })

      assert.equal(proof.status, 'public_pathway_complete')
      assert.equal(proof.proofRung, 'hyperswarm_discovered_feed_backed')
      assert.equal(proof.operationProof.defaultPublicHyperDhtUsed, true)
      assert.equal(proof.operationProof.localHyperDhtTestnetUsed, false)
      assert.equal(proof.operationProof.independentStorageRootsUsed, true)
      assert.equal(proof.operationProof.nodeModulesTransferClaimedAsDecentralizedProof, false)
      assert.equal(proof.operationProof.externalFetchObserved, false)
      assert.equal(proof.operationProof.deviceBoundaryProofClaimed, false)
      assert.equal(proof.nonClaims.platformActivation, false)
      assert.equal(readback.proofHashMatches, true)
      assert.deepEqual(validateParticipationDistributablePublicPathwayProof(proof), [])
    } finally {
      await roots.cleanup()
    }
  }

  {
    const roots = await storageRoots()
    try {
      const proof = buildParticipationDistributablePublicPathwayProof({
        distributable: distributable(),
        publisherStorage: roots.publisher,
        consumerStorage: roots.consumer,
        observation: {
          published: true,
          served: true,
          fetched: false,
          publicSwarmFetchComplete: false,
          cleanupComplete: true,
          issues: ['public_swarm_fetch_unresolved']
        },
        publicHyperdht: true
      })

      assert.equal(proof.status, 'public_pathway_unresolved')
      assert.equal(proof.operationProof.bytesFetchedIntoConsumerCorestore, false)
      assert.ok(proof.issues.includes('public_swarm_fetch_unresolved'))
      assert.equal(proof.nonClaims.deviceBoundaryProof, false)
    } finally {
      await roots.cleanup()
    }
  }

  {
    const roots = await storageRoots()
    try {
      const material = distributable()
      material.artifactAcquisition.nodeModulesIncluded = true
      material.artifactAcquisition.externalNpmGithubHttpFetchDefaultAllowed = true
      const proof = buildParticipationDistributablePublicPathwayProof({
        distributable: material,
        publisherStorage: roots.publisher,
        consumerStorage: roots.publisher,
        observation: {
          publicSwarmFetchComplete: true,
          descriptorHashVerified: true,
          payloadHashVerified: true,
          consumerReadbackAfterFetchVerified: true,
          cleanupComplete: true
        },
        publicHyperdht: false
      })

      assert.equal(proof.status, 'public_pathway_blocked')
      assert.ok(proof.issues.includes('independent_storage_roots_required'))
      assert.ok(proof.issues.includes('public_hyperdht_flag_required'))
      assert.ok(proof.issues.includes('node_modules_included'))
      assert.ok(proof.issues.includes('external_fetch_default_allowed'))
    } finally {
      await roots.cleanup()
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runParticipationDistributablePublicPathwayTests().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
