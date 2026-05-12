import { validateByteDescriptor } from '../descriptor/index.js'
import {
  MATERIALIZATION_MODES,
  READINESS_STATES,
  validateMaterializationRequest,
  validateMaterializationPlan
} from '../materialization/index.js'
import {
  SUPPORTED_REFERENCE_FAMILIES,
  normalizeByteReference,
  validateByteReference
} from '../reference/index.js'
import {
  RETENTION_TERMS,
  validateLifecycleSnapshot,
  validateRetentionPosture
} from '../object/retention.js'
import {
  assertAllowedKeys,
  assertBoolean,
  assertEnum,
  assertInteger,
  assertNonEmptyString,
  stripUndefined
} from '../shared.js'

export const BYTE_INTEROP_OPERATIONS = new Set([
  'publish_immutable_object',
  'materialize_byte_reference',
  'report_byte_status'
])

export const BYTE_INTEROP_RECEIPT_STATUSES = new Set([
  'complete',
  'ready',
  'failed'
])

export function createByteInteropProfile(input = {}) {
  assertAllowedKeys(input, 'ByteInteropProfile', [
    'bytePublication',
    'byteMaterialization',
    'referenceFamilies',
    'descriptorValidation',
    'materializationPosture',
    'retentionPosture'
  ])

  const profile = {
    bytePublication: createCapabilityProfile(input.bytePublication, {
      label: 'ByteInteropProfile.bytePublication',
      fields: {
        referenceFamilies: [...SUPPORTED_REFERENCE_FAMILIES]
      }
    }),
    byteMaterialization: createCapabilityProfile(input.byteMaterialization, {
      label: 'ByteInteropProfile.byteMaterialization',
      fields: {
        modes: [...MATERIALIZATION_MODES]
      }
    }),
    referenceFamilies: input.referenceFamilies || [...SUPPORTED_REFERENCE_FAMILIES],
    descriptorValidation: createCapabilityProfile(input.descriptorValidation, {
      label: 'ByteInteropProfile.descriptorValidation'
    }),
    materializationPosture: createCapabilityProfile(input.materializationPosture, {
      label: 'ByteInteropProfile.materializationPosture',
      fields: {
        states: READINESS_STATES
      }
    }),
    retentionPosture: createCapabilityProfile(input.retentionPosture, {
      label: 'ByteInteropProfile.retentionPosture',
      fields: {
        terms: RETENTION_TERMS
      }
    })
  }

  validateByteInteropProfile(profile)
  return profile
}

export function validateByteInteropProfile(input) {
  assertAllowedKeys(input, 'ByteInteropProfile', [
    'bytePublication',
    'byteMaterialization',
    'referenceFamilies',
    'descriptorValidation',
    'materializationPosture',
    'retentionPosture'
  ])

  validateCapabilityProfile(input.bytePublication, 'ByteInteropProfile.bytePublication', ['referenceFamilies'])
  validateReferenceFamilies(input.bytePublication.referenceFamilies, 'ByteInteropProfile.bytePublication.referenceFamilies')

  validateCapabilityProfile(input.byteMaterialization, 'ByteInteropProfile.byteMaterialization', ['modes'])
  validateEnumArray(input.byteMaterialization.modes, 'ByteInteropProfile.byteMaterialization.modes', MATERIALIZATION_MODES)

  validateReferenceFamilies(input.referenceFamilies, 'ByteInteropProfile.referenceFamilies')

  validateCapabilityProfile(input.descriptorValidation, 'ByteInteropProfile.descriptorValidation')

  validateCapabilityProfile(input.materializationPosture, 'ByteInteropProfile.materializationPosture', ['states'])
  validateEnumArray(input.materializationPosture.states, 'ByteInteropProfile.materializationPosture.states', new Set(READINESS_STATES))

  validateCapabilityProfile(input.retentionPosture, 'ByteInteropProfile.retentionPosture', ['terms'])
  validateEnumArray(input.retentionPosture.terms, 'ByteInteropProfile.retentionPosture.terms', new Set(RETENTION_TERMS))

  return input
}

export function createByteInteropRequest(input = {}) {
  validateByteInteropRequest(input)

  return stripUndefined({
    operation: input.operation,
    descriptor: input.descriptor,
    bytes: input.bytes,
    reference: input.reference,
    request: input.request,
    destination: input.destination,
    includeDescriptor: input.includeDescriptor
  })
}

export function validateByteInteropRequest(input) {
  assertAllowedKeys(input, 'ByteInteropRequest', [
    'operation',
    'descriptor',
    'bytes',
    'reference',
    'request',
    'destination',
    'includeDescriptor'
  ])

  assertEnum(input.operation, 'ByteInteropRequest.operation', BYTE_INTEROP_OPERATIONS)

  if (input.operation === 'publish_immutable_object') {
    validatePublishInteropRequest(input)
  } else if (input.operation === 'materialize_byte_reference') {
    validateMaterializeInteropRequest(input)
  } else if (input.operation === 'report_byte_status') {
    validateStatusInteropRequest(input)
  }

  return input
}

export function createByteInteropReceipt(input = {}) {
  validateByteInteropReceipt(input)

  return stripUndefined({
    operation: input.operation,
    status: input.status,
    reference: input.reference,
    descriptor: input.descriptor,
    lifecycle: input.lifecycle,
    retention: input.retention,
    plan: input.plan,
    destination: input.destination,
    bytesWritten: input.bytesWritten,
    error: input.error
  })
}

export function validateByteInteropReceipt(input) {
  assertAllowedKeys(input, 'ByteInteropReceipt', [
    'operation',
    'status',
    'reference',
    'descriptor',
    'lifecycle',
    'retention',
    'plan',
    'destination',
    'bytesWritten',
    'error'
  ])

  assertEnum(input.operation, 'ByteInteropReceipt.operation', BYTE_INTEROP_OPERATIONS)
  assertEnum(input.status, 'ByteInteropReceipt.status', BYTE_INTEROP_RECEIPT_STATUSES)

  if (input.status === 'failed') {
    validateInteropError(input.error)
    return input
  }

  if (input.error !== undefined) {
    throw new TypeError('ByteInteropReceipt.error is only supported for failed receipts')
  }

  validateByteReference(input.reference)

  if (input.descriptor !== undefined) {
    validateByteDescriptor(input.descriptor)
  }

  if (input.lifecycle !== undefined) {
    validateLifecycleSnapshot(input.lifecycle)
  }

  if (input.retention !== undefined) {
    validateRetentionPosture(input.retention)
  }

  if (input.plan !== undefined) {
    validateMaterializationPlan(input.plan)
  }

  if (input.destination !== undefined) {
    assertNonEmptyString(input.destination, 'ByteInteropReceipt.destination')
  }

  if (input.bytesWritten !== undefined) {
    assertInteger(input.bytesWritten, 'ByteInteropReceipt.bytesWritten', { min: 0 })
  }

  validateReceiptRequiredFields(input)

  return input
}

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

function createCapabilityProfile(input, options) {
  const value = input || {}
  const fields = options.fields || {}
  const fieldNames = Object.keys(fields)

  if (input !== undefined) {
    validateCapabilityProfile(input, options.label, fieldNames)
  }

  return {
    supported: value.supported === undefined ? true : value.supported,
    ...Object.fromEntries(
      Object.entries(fields).map(([key, defaultValue]) => [key, value[key] || [...defaultValue]])
    )
  }
}

function validateCapabilityProfile(input, label, fields = []) {
  assertAllowedKeys(input, label, ['supported', ...fields])
  assertBoolean(input.supported, `${label}.supported`)
}

function validateReferenceFamilies(families, label) {
  validateEnumArray(families, label, SUPPORTED_REFERENCE_FAMILIES)
}

function validateEnumArray(values, label, allowedValues) {
  if (!Array.isArray(values)) {
    throw new TypeError(`${label} must be an array`)
  }

  if (values.length === 0) {
    throw new TypeError(`${label} must not be empty`)
  }

  for (const value of values) {
    assertEnum(value, label, allowedValues)
  }

  return values
}

function validatePublishInteropRequest(input) {
  validateByteDescriptor(input.descriptor)
  validateBytes(input.bytes, 'ByteInteropRequest.bytes')

  if (input.bytes.length !== input.descriptor.size) {
    throw new TypeError('ByteInteropRequest.bytes length must match ByteDescriptor.size')
  }

  rejectFields(input, 'ByteInteropRequest', [
    'reference',
    'request',
    'destination',
    'includeDescriptor'
  ])
}

function validateMaterializeInteropRequest(input) {
  validateByteReference(input.reference)
  if (input.request === undefined) {
    throw new TypeError('ByteInteropRequest.request is required for materialize_byte_reference')
  }

  validateMaterializationRequest(input.request)
  assertSameReference(input.reference, input.request.reference, 'ByteInteropRequest.request.reference')

  if ((input.request.mode === 'cache' || input.request.mode === 'mirror') && input.destination === undefined) {
    throw new TypeError('ByteInteropRequest.destination is required for cache and mirror materialization')
  }

  if (input.destination !== undefined) {
    if (input.request.mode !== 'cache' && input.request.mode !== 'mirror') {
      throw new TypeError('ByteInteropRequest.destination is only supported for cache and mirror materialization')
    }
    assertNonEmptyString(input.destination, 'ByteInteropRequest.destination')
  }

  rejectFields(input, 'ByteInteropRequest', [
    'descriptor',
    'bytes',
    'includeDescriptor'
  ])
}

function validateStatusInteropRequest(input) {
  validateByteReference(input.reference)

  if (input.includeDescriptor !== undefined) {
    assertBoolean(input.includeDescriptor, 'ByteInteropRequest.includeDescriptor')
  }

  rejectFields(input, 'ByteInteropRequest', [
    'descriptor',
    'bytes',
    'request',
    'destination'
  ])
}

function validateBytes(bytes, label) {
  if (!Buffer.isBuffer(bytes) && !(bytes instanceof Uint8Array)) {
    throw new TypeError(`${label} must be a Buffer or Uint8Array`)
  }
}

function assertSameReference(left, right, label) {
  const normalizedLeft = JSON.stringify(normalizeByteReference(left))
  const normalizedRight = JSON.stringify(normalizeByteReference(right))

  if (normalizedLeft !== normalizedRight) {
    throw new TypeError(`${label} must match ByteInteropRequest.reference`)
  }
}

function validateInteropError(error) {
  assertAllowedKeys(error, 'ByteInteropReceipt.error', ['code', 'message'])
  assertNonEmptyString(error.code, 'ByteInteropReceipt.error.code')
  assertNonEmptyString(error.message, 'ByteInteropReceipt.error.message')
}

function validateReceiptRequiredFields(input) {
  if (input.operation === 'publish_immutable_object') {
    if (input.descriptor === undefined) {
      throw new TypeError('ByteInteropReceipt.descriptor is required for publish receipts')
    }
  }

  if (input.operation === 'materialize_byte_reference') {
    if (input.lifecycle === undefined) {
      throw new TypeError('ByteInteropReceipt.lifecycle is required for materialize receipts')
    }
    if (input.plan === undefined) {
      throw new TypeError('ByteInteropReceipt.plan is required for materialize receipts')
    }
  }

  if (input.operation === 'report_byte_status' && input.lifecycle === undefined) {
    throw new TypeError('ByteInteropReceipt.lifecycle is required for status receipts')
  }
}

function rejectFields(input, label, fields) {
  for (const field of fields) {
    if (input[field] !== undefined) {
      throw new TypeError(`${label}.${field} is not supported for ${input.operation}`)
    }
  }
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
