import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'

import {
  assessRetentionPosture,
  createByteInteropProfile,
  createByteInteropReceipt,
  createByteInteropRequest,
  createPackByteBinding,
  createPlatformMaterializationSeam,
  resolveMaterializationPlan,
  validateByteInteropProfile,
  validateByteInteropReceipt,
  validateByteInteropRequest,
  validatePackByteBinding,
  validatePlatformMaterializationSeam
} from '../src/index.js'

export function runIntegrationSeamTests() {
  testByteInteropProfile()
  testByteInteropRequestsAndReceipts()
  testByteInteropValidationEdges()
  testPlatformMaterializationSeam()
  testPackByteBinding()
  testSeamValidatorsRejectUnsupportedFields()
}

function testByteInteropProfile() {
  const profile = createByteInteropProfile()

  validateByteInteropProfile(profile)

  assert.equal(profile.bytePublication.supported, true)
  assert.deepEqual(profile.bytePublication.referenceFamilies, ['hypercore_immutable'])
  assert.deepEqual(profile.byteMaterialization.modes, ['stream', 'cache', 'mirror'])
  assert.deepEqual(profile.referenceFamilies, ['hypercore_immutable'])
  assert.deepEqual(profile.materializationPosture.states, ['fetched', 'complete', 'materialized', 'ready'])
  assert.deepEqual(profile.retentionPosture.terms, ['pinned', 'ephemeral', 'stale', 'prunable'])
}

function testByteInteropRequestsAndReceipts() {
  const descriptor = {
    contentType: 'application/octet-stream',
    size: 4,
    encoding: 'binary',
    materializationHints: {
      preferredMode: 'cache',
      placementClass: 'artifact_cache'
    }
  }
  const reference = {
    family: 'hypercore_immutable',
    key: 'd'.repeat(64)
  }
  const lifecycle = {
    fetched: true,
    complete: true,
    materialized: true,
    ready: true,
    state: 'ready'
  }
  const plan = resolveMaterializationPlan({
    descriptor,
    request: {
      reference,
      mode: 'cache',
      targetClass: 'runtime_input'
    }
  })

  const publishRequest = createByteInteropRequest({
    operation: 'publish_immutable_object',
    descriptor,
    bytes: Buffer.from('mesh')
  })
  validateByteInteropRequest(publishRequest)
  assert.equal(publishRequest.bytes.length, 4)

  const materializeRequest = createByteInteropRequest({
    operation: 'materialize_byte_reference',
    reference,
    request: {
      reference,
      mode: 'cache',
      targetClass: 'runtime_input'
    },
    destination: '/tmp/mesh-phase-7/bundle.bin'
  })
  validateByteInteropRequest(materializeRequest)
  assert.equal(materializeRequest.request.mode, 'cache')

  const statusRequest = createByteInteropRequest({
    operation: 'report_byte_status',
    reference,
    includeDescriptor: true
  })
  validateByteInteropRequest(statusRequest)
  assert.equal(statusRequest.includeDescriptor, true)

  const publishReceipt = createByteInteropReceipt({
    operation: 'publish_immutable_object',
    status: 'complete',
    reference,
    descriptor
  })
  validateByteInteropReceipt(publishReceipt)

  const materializeReceipt = createByteInteropReceipt({
    operation: 'materialize_byte_reference',
    status: 'ready',
    reference,
    descriptor,
    lifecycle,
    plan,
    destination: '/tmp/mesh-phase-7/bundle.bin',
    bytesWritten: 4
  })
  validateByteInteropReceipt(materializeReceipt)
  assert.equal(materializeReceipt.bytesWritten, 4)

  const statusReceipt = createByteInteropReceipt({
    operation: 'report_byte_status',
    status: 'ready',
    reference,
    descriptor,
    lifecycle,
    retention: assessRetentionPosture({
      lifecycle,
      pinned: true
    })
  })
  validateByteInteropReceipt(statusReceipt)
  assert.equal(statusReceipt.retention.pinned, true)
}

function testByteInteropValidationEdges() {
  const reference = {
    family: 'hypercore_immutable',
    key: 'e'.repeat(64)
  }
  const otherReference = {
    family: 'hypercore_immutable',
    key: 'f'.repeat(64)
  }
  const descriptor = {
    contentType: 'application/octet-stream',
    size: 4,
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
  const plan = resolveMaterializationPlan({
    descriptor,
    request: {
      reference,
      mode: 'cache'
    }
  })

  assert.throws(() => createByteInteropRequest({
    operation: 'materialize_byte_reference',
    reference
  }), /request is required/)

  assert.throws(() => createByteInteropRequest({
    operation: 'materialize_byte_reference',
    reference,
    request: {
      reference: otherReference,
      mode: 'cache'
    },
    destination: '/tmp/mesh-phase-7/mismatch.bin'
  }), /must match/)

  assert.throws(() => createByteInteropRequest({
    operation: 'materialize_byte_reference',
    reference,
    request: {
      reference,
      mode: 'cache'
    }
  }), /destination is required/)

  assert.throws(() => createByteInteropRequest({
    operation: 'materialize_byte_reference',
    reference,
    request: {
      reference,
      mode: 'stream'
    },
    destination: '/tmp/mesh-phase-7/stream.bin'
  }), /destination is only supported/)

  assert.throws(() => createByteInteropReceipt({
    operation: 'publish_immutable_object',
    status: 'complete',
    reference
  }), /descriptor is required/)

  assert.throws(() => createByteInteropReceipt({
    operation: 'materialize_byte_reference',
    status: 'ready',
    reference,
    plan
  }), /lifecycle is required/)

  assert.throws(() => createByteInteropReceipt({
    operation: 'materialize_byte_reference',
    status: 'ready',
    reference,
    lifecycle
  }), /plan is required/)

  assert.throws(() => createByteInteropReceipt({
    operation: 'report_byte_status',
    status: 'ready',
    reference
  }), /lifecycle is required/)

  assert.throws(() => createByteInteropReceipt({
    operation: 'report_byte_status',
    status: 'ready',
    reference,
    lifecycle,
    error: {
      code: 'unexpected',
      message: 'unexpected failure'
    }
  }), /only supported for failed receipts/)

  assert.throws(() => createByteInteropReceipt({
    operation: 'report_byte_status',
    status: 'failed'
  }), /error/)

  const failedReceipt = createByteInteropReceipt({
    operation: 'report_byte_status',
    status: 'failed',
    error: {
      code: 'source_unavailable',
      message: 'source byte reference is not currently reachable'
    }
  })
  validateByteInteropReceipt(failedReceipt)
  assert.equal(failedReceipt.error.code, 'source_unavailable')
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

  assert.throws(() => createByteInteropProfile({
    deploymentState: 'live'
  }))

  assert.throws(() => createByteInteropProfile({
    bytePublication: {
      supported: true,
      referenceFamilies: ['hypercore_immutable'],
      artifactType: 'web_bundle'
    }
  }))

  assert.throws(() => validateByteInteropRequest({
    operation: 'publish_immutable_object',
    descriptor,
    bytes: Buffer.from('hello'),
    deploymentState: 'live'
  }))

  assert.throws(() => validateByteInteropReceipt({
    operation: 'report_byte_status',
    status: 'ready',
    reference,
    lifecycle,
    activationState: 'active'
  }))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runIntegrationSeamTests()
}
