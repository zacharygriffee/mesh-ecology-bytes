const { validateByteReference } = require('../reference')
const {
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

module.exports = {
  MATERIALIZATION_MODES,
  READINESS_STATES,
  VISIBILITY_LEVELS,
  createMaterializationHints,
  createMaterializationRequest,
  validateMaterializationHints,
  validateMaterializationRequest,
  validateReadinessState
}
