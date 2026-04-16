const { validateByteDescriptor } = require('../descriptor')
const { validateMaterializationPlan } = require('../materialization')
const { validateByteReference } = require('../reference')
const { validateLifecycleSnapshot, validateRetentionPosture } = require('../object/retention')
const {
  assertAllowedKeys,
  assertInteger,
  assertNonEmptyString,
  stripUndefined
} = require('../shared')

function createPlatformMaterializationSeam(input = {}) {
  validatePlatformMaterializationSeam(input)

  return stripUndefined({
    reference: input.reference,
    descriptor: input.descriptor,
    lifecycle: input.lifecycle,
    retention: input.retention,
    plan: input.plan,
    destination: input.destination,
    bytesWritten: input.bytesWritten
  })
}

function validatePlatformMaterializationSeam(input) {
  assertAllowedKeys(input, 'PlatformMaterializationSeam', [
    'reference',
    'descriptor',
    'lifecycle',
    'retention',
    'plan',
    'destination',
    'bytesWritten'
  ])

  validateByteReference(input.reference)
  validateByteDescriptor(input.descriptor)
  validateLifecycleSnapshot(input.lifecycle)

  if (input.retention !== undefined) {
    validateRetentionPosture(input.retention)
  }

  if (input.plan !== undefined) {
    validateMaterializationPlan(input.plan)
  }

  if (input.destination !== undefined) {
    assertNonEmptyString(input.destination, 'PlatformMaterializationSeam.destination')
  }

  if (input.bytesWritten !== undefined) {
    assertInteger(input.bytesWritten, 'PlatformMaterializationSeam.bytesWritten', { min: 0 })
  }

  return input
}

function createPackByteBinding(input = {}) {
  validatePackByteBinding(input)

  return stripUndefined({
    reference: input.reference,
    descriptor: input.descriptor
  })
}

function validatePackByteBinding(input) {
  assertAllowedKeys(input, 'PackByteBinding', ['reference', 'descriptor'])

  validateByteReference(input.reference)

  if (input.descriptor !== undefined) {
    validateByteDescriptor(input.descriptor)
  }

  return input
}

module.exports = {
  createPackByteBinding,
  createPlatformMaterializationSeam,
  validatePackByteBinding,
  validatePlatformMaterializationSeam
}
