import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'

import {
  READINESS_STATES,
  RETENTION_TERMS,
  assessRetentionPosture,
  createByteDescriptor,
  createByteReference,
  createMaterializationHints,
  createMaterializationRequest,
  validateByteDescriptor,
  validateByteReference,
  validateMaterializationHints,
  validateMaterializationRequest,
  validateLifecycleSnapshot,
  validateReadinessState,
  validateRetentionTerm
} from '../src/index.js'

export function runContractTests() {
  testDescriptorValidation()
  testReferenceValidation()
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
