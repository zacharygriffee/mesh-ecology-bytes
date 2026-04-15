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

function createMaterializationHints(input = {}) {
  validateMaterializationHints(input)

  return stripUndefined({
    preferredMode: input.preferredMode,
    visibility: input.visibility,
    placementClass: input.placementClass
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

  return input
}

function createMaterializationRequest(input = {}) {
  validateMaterializationRequest(input)

  return stripUndefined({
    reference: input.reference,
    targetClass: input.targetClass,
    mode: input.mode,
    filenameHint: input.filenameHint
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

  if (input.filenameHint !== undefined) {
    assertOptionalString(input.filenameHint, 'MaterializationRequest.filenameHint')

    if (input.filenameHint.includes('/') || input.filenameHint.includes('\\')) {
      throw new TypeError('MaterializationRequest.filenameHint must be a filename hint, not a path')
    }
  }

  return input
}

module.exports = {
  MATERIALIZATION_MODES,
  VISIBILITY_LEVELS,
  createMaterializationHints,
  createMaterializationRequest,
  validateMaterializationHints,
  validateMaterializationRequest
}
