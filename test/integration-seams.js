import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'

import {
  assessRetentionPosture,
  createPackByteBinding,
  createPlatformMaterializationSeam,
  resolveMaterializationPlan,
  validatePackByteBinding,
  validatePlatformMaterializationSeam
} from '../src/index.js'

export function runIntegrationSeamTests() {
  testPlatformMaterializationSeam()
  testPackByteBinding()
  testSeamValidatorsRejectUnsupportedFields()
}

function testPlatformMaterializationSeam() {
  const descriptor = {
    contentType: 'application/octet-stream',
    size: 12,
    encoding: 'binary',
    materializationHints: {
      preferredMode: 'cache',
      placementClass: 'artifact_cache',
      filenameHint: 'bundle.bin'
    }
  }
  const reference = {
    family: 'hypercore_immutable',
    key: 'a'.repeat(64)
  }
  const lifecycle = {
    fetched: true,
    complete: true,
    materialized: true,
    ready: true,
    state: 'ready'
  }
  const retention = assessRetentionPosture({
    lifecycle,
    pinned: true
  })
  const plan = resolveMaterializationPlan({
    descriptor,
    request: {
      reference,
      mode: 'cache',
      targetClass: 'runtime_input',
      filenameOverride: 'bundle-local.bin'
    }
  })

  const seam = createPlatformMaterializationSeam({
    reference,
    descriptor,
    lifecycle,
    retention,
    plan,
    destination: '/tmp/mesh-phase-7/bundle-local.bin',
    bytesWritten: descriptor.size
  })

  validatePlatformMaterializationSeam(seam)

  assert.equal(seam.reference.key, 'a'.repeat(64))
  assert.equal(seam.plan.mode, 'cache')
  assert.equal(seam.bytesWritten, 12)
}

function testPackByteBinding() {
  const binding = createPackByteBinding({
    reference: {
      family: 'hypercore_immutable',
      key: 'b'.repeat(64)
    },
    descriptor: {
      contentType: 'application/octet-stream',
      size: 7,
      framing: 'raw',
      materializationHints: {}
    }
  })

  validatePackByteBinding(binding)

  assert.equal(binding.reference.family, 'hypercore_immutable')
  assert.equal(binding.descriptor.size, 7)
}

function testSeamValidatorsRejectUnsupportedFields() {
  const reference = {
    family: 'hypercore_immutable',
    key: 'c'.repeat(64)
  }
  const descriptor = {
    contentType: 'application/octet-stream',
    size: 5,
    encoding: 'binary',
    materializationHints: {}
  }
  const lifecycle = {
    fetched: true,
    complete: true,
    materialized: false,
    ready: false,
    state: 'complete'
  }

  assert.throws(() => validatePlatformMaterializationSeam({
    reference,
    descriptor,
    lifecycle,
    deploymentState: 'live'
  }))

  assert.throws(() => validatePackByteBinding({
    reference,
    descriptor,
    artifactType: 'web_bundle'
  }))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runIntegrationSeamTests()
}
