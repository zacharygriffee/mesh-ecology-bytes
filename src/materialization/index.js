const { mkdir, stat, writeFile } = require('fs/promises')
const path = require('path')

const { validateByteReference } = require('../reference')
const {
  assertAllowedKeys,
  assertEnum,
  assertNonEmptyString,
  assertObject,
  assertOptionalString,
  stripUndefined
} = require('../shared')

const MATERIALIZATION_MODES = new Set(['stream', 'cache', 'mirror'])
const VISIBILITY_LEVELS = new Set(['operator', 'public', 'internal'])
const READINESS_STATES = ['fetched', 'complete', 'materialized', 'ready']
const READINESS_STATE_SET = new Set(READINESS_STATES)

function createMaterializationHints(input = {}) {
  validateMaterializationHints(input)

  return stripUndefined({
    preferredMode: input.preferredMode,
    visibility: input.visibility,
    placementClass: input.placementClass,
    filenameHint: input.filenameHint
  })
}

function validateMaterializationHints(input) {
  assertObject(input, 'MaterializationHints')

  if (input.preferredMode !== undefined) {
    assertEnum(input.preferredMode, 'MaterializationHints.preferredMode', MATERIALIZATION_MODES)
  }

  if (input.visibility !== undefined) {
    assertEnum(input.visibility, 'MaterializationHints.visibility', VISIBILITY_LEVELS)
  }

  if (input.placementClass !== undefined) {
    assertNonEmptyString(input.placementClass, 'MaterializationHints.placementClass')
  }

  if (input.filenameHint !== undefined) {
    assertOptionalString(input.filenameHint, 'MaterializationHints.filenameHint')

    if (input.filenameHint.includes('/') || input.filenameHint.includes('\\')) {
      throw new TypeError('MaterializationHints.filenameHint must be a filename hint, not a path')
    }
  }

  return input
}

function createMaterializationRequest(input = {}) {
  validateMaterializationRequest(input)

  return stripUndefined({
    reference: input.reference,
    targetClass: input.targetClass,
    mode: input.mode,
    filenameOverride: input.filenameOverride
  })
}

function validateMaterializationRequest(input) {
  assertObject(input, 'MaterializationRequest')
  validateByteReference(input.reference)

  if (input.targetClass !== undefined) {
    assertNonEmptyString(input.targetClass, 'MaterializationRequest.targetClass')
  }

  if (input.mode !== undefined) {
    assertEnum(input.mode, 'MaterializationRequest.mode', MATERIALIZATION_MODES)
  }

  if (input.filenameOverride !== undefined) {
    assertOptionalString(input.filenameOverride, 'MaterializationRequest.filenameOverride')

    if (input.filenameOverride.includes('/') || input.filenameOverride.includes('\\')) {
      throw new TypeError('MaterializationRequest.filenameOverride must be a filename override, not a path')
    }
  }

  return input
}

function validateReadinessState(state) {
  assertEnum(state, 'ReadinessState', READINESS_STATE_SET)
  return state
}

function validateMaterializationPlan(input) {
  assertAllowedKeys(input, 'MaterializationPlan', ['mode', 'placementClass', 'targetClass', 'visibility', 'filename'])

  if (input.mode !== undefined) {
    assertEnum(input.mode, 'MaterializationPlan.mode', MATERIALIZATION_MODES)
  }

  if (input.placementClass !== undefined) {
    assertNonEmptyString(input.placementClass, 'MaterializationPlan.placementClass')
  }

  if (input.targetClass !== undefined) {
    assertNonEmptyString(input.targetClass, 'MaterializationPlan.targetClass')
  }

  if (input.visibility !== undefined) {
    assertEnum(input.visibility, 'MaterializationPlan.visibility', VISIBILITY_LEVELS)
  }

  if (input.filename !== undefined) {
    assertOptionalString(input.filename, 'MaterializationPlan.filename')

    if (input.filename.includes('/') || input.filename.includes('\\')) {
      throw new TypeError('MaterializationPlan.filename must be a filename hint, not a path')
    }
  }

  return input
}

function resolveMaterializationPlan(options = {}) {
  const descriptor = options.descriptor
  const request = options.request
  const { validateByteDescriptor } = require('../descriptor')

  validateByteDescriptor(descriptor)

  if (request !== undefined) {
    validateMaterializationRequest(request)
  }

  const hints = descriptor.materializationHints || {}
  const mode = (request && request.mode) || hints.preferredMode || 'stream'

  assertEnum(mode, 'MaterializationPlan.mode', MATERIALIZATION_MODES)

  const plan = stripUndefined({
    mode,
    placementClass: hints.placementClass,
    targetClass: request && request.targetClass,
    visibility: hints.visibility,
    filename: (request && request.filenameOverride) || hints.filenameHint
  })

  validateMaterializationPlan(plan)

  return plan
}

async function materializeImmutableObject(options = {}) {
  const reference = options.reference

  validateByteReference(reference)

  const request = createMaterializationRequest({
    reference,
    ...(options.request || {})
  })

  const requestedMode = request.mode || 'stream'
  const effectiveRequest = createMaterializationRequest({
    ...request,
    reference,
    mode: requestedMode
  })

  if (requestedMode === 'stream') {
    const loaded = await loadImmutableObject({
      storage: options.storage,
      reference,
      transport: options.transport,
      as: 'stream'
    })

    return {
      reference: loaded.reference,
      descriptor: loaded.descriptor,
      stream: loaded.stream,
      lifecycle: loaded.lifecycle,
      plan: resolveMaterializationPlan({
        descriptor: loaded.descriptor,
        request: effectiveRequest
      })
    }
  }

  if (requestedMode === 'cache' || requestedMode === 'mirror') {
    assertNonEmptyString(options.destination, 'materialization destination')

    const loaded = await loadImmutableObject({
      storage: options.storage,
      reference,
      transport: options.transport,
      as: 'buffer'
    })

    const destination = path.resolve(options.destination)

    await mkdir(path.dirname(destination), { recursive: true })
    await writeFile(destination, loaded.bytes)

    const written = await stat(destination)

    if (written.size !== loaded.bytes.length) {
      throw new Error('Materialized file size does not match fetched byte length')
    }

    return {
      reference: loaded.reference,
      descriptor: loaded.descriptor,
      destination,
      bytesWritten: loaded.bytes.length,
      lifecycle: loaded.lifecycle,
      plan: resolveMaterializationPlan({
        descriptor: loaded.descriptor,
        request: effectiveRequest
      })
    }
  }

  throw new TypeError(`Unsupported materialization mode: ${requestedMode}`)
}

async function loadImmutableObject(options) {
  if (options.transport) {
    const { fetchImmutableObject } = require('../transport')
    return fetchImmutableObject(options)
  }

  const { readImmutableObject } = require('../object/read')
  return readImmutableObject(options)
}

module.exports = {
  MATERIALIZATION_MODES,
  READINESS_STATES,
  VISIBILITY_LEVELS,
  createMaterializationHints,
  createMaterializationRequest,
  materializeImmutableObject,
  resolveMaterializationPlan,
  validateMaterializationPlan,
  validateMaterializationHints,
  validateMaterializationRequest,
  validateReadinessState
}
