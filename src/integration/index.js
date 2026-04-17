import { validateByteDescriptor } from '../descriptor/index.js'
import { validateMaterializationPlan } from '../materialization/index.js'
import { validateByteReference } from '../reference/index.js'
import { validateLifecycleSnapshot, validateRetentionPosture } from '../object/retention.js'
import {
  assertAllowedKeys,
  assertInteger,
  assertNonEmptyString,
  stripUndefined
} from '../shared.js'

export function createPlatformMaterializationSeam(input = {}) {
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

export function validatePlatformMaterializationSeam(input) {
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

export function createPackByteBinding(input = {}) {
  validatePackByteBinding(input)

  return stripUndefined({
    reference: input.reference,
    descriptor: input.descriptor
  })
}

export function validatePackByteBinding(input) {
  assertAllowedKeys(input, 'PackByteBinding', ['reference', 'descriptor'])

  validateByteReference(input.reference)

  if (input.descriptor !== undefined) {
    validateByteDescriptor(input.descriptor)
  }

  return input
}
