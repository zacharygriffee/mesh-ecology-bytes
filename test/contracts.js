import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'

import {
  READINESS_STATES,
  RETENTION_TERMS,
  assessRetentionPosture,
  createByteDescriptor,
  createByteReference,
  createExternalResourcePointer,
  createMaterializationHints,
  createMaterializationRequest,
  validateByteDescriptor,
  validateByteReference,
  validateExternalResourcePointer,
  validateMaterializationHints,
  validateMaterializationRequest,
  validateLifecycleSnapshot,
  validateReadinessState,
  validateRetentionTerm
} from '../src/index.js'

export function runContractTests() {
  testDescriptorValidation()
  testReferenceValidation()
  testExternalResourcePointerValidation()
  testHintsAndRequestSeparation()
  testReadinessStates()
  testRetentionTerms()
}

function testDescriptorValidation() {
  const minimal = createByteDescriptor({
    contentType: 'application/octet-stream',
    size: 42,
    encoding: 'binary',
    materializationHints: {}
  })

  assert.equal(minimal.contentType, 'application/octet-stream')
  assert.equal(minimal.size, 42)
  assert.equal(minimal.encoding, 'binary')
  assert.deepEqual(minimal.materializationHints, {})

  const withOptionalFields = createByteDescriptor({
    contentType: 'text/plain',
    size: 3,
    framing: 'raw',
    materializationHints: {
      preferredMode: 'stream',
      filenameHint: 'hello.txt'
    },
    integrityHint: {
      algorithm: 'sha256',
      value: 'a'.repeat(64)
    },
    role: 'runtime_blob',
    logicalId: 'logical-object-id'
  })

  assert.equal(withOptionalFields.role, 'runtime_blob')
  assert.equal(withOptionalFields.logicalId, 'logical-object-id')
  assert.equal(withOptionalFields.integrityHint.value, 'a'.repeat(64))

  assert.throws(() => validateByteDescriptor({
    size: 1,
    encoding: 'binary',
    materializationHints: {}
  }))

  assert.throws(() => validateByteDescriptor({
    contentType: 'application/octet-stream',
    size: 1,
    materializationHints: {}
  }))
}

function testReferenceValidation() {
  const reference = createByteReference({
    family: 'hypercore_immutable',
    key: 'b'.repeat(64)
  })

  assert.equal(reference.family, 'hypercore_immutable')
  assert.equal(reference.key, 'b'.repeat(64))

  const withDescriptorHash = createByteReference({
    family: 'hypercore_immutable',
    key: 'c'.repeat(64),
    descriptorHash: 'd'.repeat(64)
  })

  assert.equal(withDescriptorHash.descriptorHash, 'd'.repeat(64))

  assert.throws(() => validateByteReference({
    family: 'hypercore_immutable',
    key: 'e'.repeat(64),
    version: 1
  }))
}

function testExternalResourcePointerValidation() {
  const pointer = createExternalResourcePointer({
    resourceRef: 'bytes-resource:sidecar-suggestion:example',
    resourceKind: 'artifact',
    pointerKind: 'hyperblob',
    pointer: {
      blobKey: 'a'.repeat(64),
      id: 'hyperblob-id-1'
    },
    contentHash: 'b'.repeat(64),
    byteLength: 2048,
    mediaType: 'application/json',
    originDeviceRef: 'local-device:operator-workstation',
    availability: 'replicable_pointer',
    replicationPosture: 'replicable_external_pointer',
    sourceRefs: ['edge-operator-sidecar-repair-suggestion:example'],
    nonClaims: {
      pointerIsTruth: false,
      blobPresenceIsAcceptance: false,
      contentAvailabilityIsContinuity: false,
      pathIsCanonical: false,
      resourceRefIsAuthority: false
    }
  })

  assert.equal(pointer.artifactKind, 'bytes_external_resource_pointer')
  assert.equal(pointer.schemaVersion, 'bytes_external_resource_pointer.v0')
  assert.equal(pointer.pointer.blobKey, 'a'.repeat(64))
  assert.equal(pointer.contentHash.value, 'b'.repeat(64))
  assert.deepEqual(pointer.sourceRefs, ['edge-operator-sidecar-repair-suggestion:example'])

  const drivePointer = createExternalResourcePointer({
    resourceRef: 'bytes-resource:repo-file:example',
    resourceKind: 'file',
    pointerKind: 'hyperdrive',
    pointer: {
      driveKey: 'c'.repeat(64),
      path: 'repo/docs/example.json'
    },
    contentHash: 'd'.repeat(64),
    byteLength: 64,
    mediaType: 'application/json',
    originDeviceRef: 'local-device:operator-laptop',
    availability: 'mirrored',
    replicationPosture: 'mirror_candidate',
    nonClaims: pointer.nonClaims
  })

  assert.equal(drivePointer.pointer.path, 'repo/docs/example.json')

  const corePointer = createExternalResourcePointer({
    resourceRef: 'bytes-resource:core-block:example',
    resourceKind: 'blob',
    pointerKind: 'hypercore',
    pointer: {
      hypercoreKey: 'e'.repeat(64),
      blockRef: 'block:0'
    },
    contentHash: 'f'.repeat(64),
    byteLength: 128,
    mediaType: 'application/octet-stream',
    originDeviceRef: 'local-device:operator-workstation',
    availability: 'replicated',
    replicationPosture: 'replicated',
    nonClaims: pointer.nonClaims
  })

  assert.equal(corePointer.pointer.hypercoreKey, 'e'.repeat(64))

  const bytesRefPointer = createExternalResourcePointer({
    resourceRef: 'bytes-resource:bytes-ref:example',
    resourceKind: 'artifact',
    pointerKind: 'bytes_ref',
    pointer: {
      bytesRef: 'bytes:hypercore-immutable:example'
    },
    contentHash: '1'.repeat(64),
    byteLength: 256,
    mediaType: 'application/json',
    originDeviceRef: 'local-device:operator-workstation',
    availability: 'mirrored',
    replicationPosture: 'mirror_candidate',
    nonClaims: pointer.nonClaims
  })

  assert.equal(bytesRefPointer.pointer.bytesRef, 'bytes:hypercore-immutable:example')

  assert.throws(() => validateExternalResourcePointer({
    ...pointer,
    pointer: {
      blobKey: 'a'.repeat(64),
      id: 'hyperblob-id-1',
      localPath: '/tmp/blob.json'
    }
  }), /host-local paths/)

  assert.throws(() => createExternalResourcePointer({
    ...drivePointer,
    pointer: {
      driveKey: 'c'.repeat(64),
      path: '/home/operator/repo/file.json'
    }
  }), /drive-relative path/)

  assert.throws(() => createExternalResourcePointer({
    ...pointer,
    nonClaims: {
      ...pointer.nonClaims,
      pointerIsTruth: true
    }
  }), /pointerIsTruth/)

  assert.throws(() => createExternalResourcePointer({
    ...pointer,
    availability: 'accepted_continuity'
  }), /availability/)

  assert.throws(() => createExternalResourcePointer({
    ...bytesRefPointer,
    pointer: {
      bytesRef: 'bytes:hypercore-immutable:example',
      pathIsCanonical: true
    }
  }), /host-local paths/)
}

function testHintsAndRequestSeparation() {
  const hints = createMaterializationHints({
    preferredMode: 'cache',
    placementClass: 'artifact_cache',
    visibility: 'internal',
    filenameHint: 'bundle.tgz'
  })

  const request = createMaterializationRequest({
    reference: {
      family: 'hypercore_immutable',
      key: 'f'.repeat(64)
    },
    mode: 'mirror',
    targetClass: 'runtime_input',
    filenameOverride: 'bundle-local.tgz'
  })

  validateMaterializationHints(hints)
  validateMaterializationRequest(request)

  assert.equal(hints.filenameHint, 'bundle.tgz')
  assert.equal(request.filenameOverride, 'bundle-local.tgz')
  assert.equal(request.mode, 'mirror')
  assert.ok(!Object.prototype.hasOwnProperty.call(request, 'filenameHint'))
}

function testReadinessStates() {
  assert.deepEqual(READINESS_STATES, ['fetched', 'complete', 'materialized', 'ready'])

  for (const state of READINESS_STATES) {
    assert.equal(validateReadinessState(state), state)
  }

  assert.throws(() => validateReadinessState('executed'))
}

function testRetentionTerms() {
  assert.deepEqual(RETENTION_TERMS, ['pinned', 'ephemeral', 'stale', 'prunable'])

  for (const term of RETENTION_TERMS) {
    assert.equal(validateRetentionTerm(term), term)
  }

  const lifecycle = {
    fetched: true,
    complete: true,
    materialized: true,
    ready: true,
    state: 'ready'
  }

  validateLifecycleSnapshot(lifecycle)

  assert.deepEqual(assessRetentionPosture({
    lifecycle,
    pinned: true
  }), {
    pinned: true,
    ephemeral: false,
    stale: false,
    prunable: false
  })

  assert.deepEqual(assessRetentionPosture({
    lifecycle,
    stale: true
  }), {
    pinned: false,
    ephemeral: true,
    stale: true,
    prunable: true
  })

  assert.throws(() => validateRetentionTerm('garbage-collected'))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runContractTests()
}
