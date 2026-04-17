import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { validateByteDescriptor } from '../descriptor/index.js'
import { createMeshBytesError } from '../errors.js'
import { createOperationScope } from '../operation.js'
import { validateByteReference } from '../reference/index.js'
import {
  assertAllowedKeys,
  assertEnum,
  assertNonEmptyString,
  assertObject,
  assertOptionalString,
  stripUndefined
} from '../shared.js'

export const MATERIALIZATION_MODES = new Set(['stream', 'cache', 'mirror'])
export const VISIBILITY_LEVELS = new Set(['operator', 'public', 'internal'])
export const READINESS_STATES = ['fetched', 'complete', 'materialized', 'ready']
const READINESS_STATE_SET = new Set(READINESS_STATES)

export function createMaterializationHints(input = {}) {
  validateMaterializationHints(input)

  return stripUndefined({
    preferredMode: input.preferredMode,
    visibility: input.visibility,
    placementClass: input.placementClass,
    filenameHint: input.filenameHint
  })
}

export function validateMaterializationHints(input) {
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

export function createMaterializationRequest(input = {}) {
  validateMaterializationRequest(input)

  return stripUndefined({
    reference: input.reference,
    targetClass: input.targetClass,
    mode: input.mode,
    filenameOverride: input.filenameOverride
  })
}

export function validateMaterializationRequest(input) {
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

export function validateReadinessState(state) {
  assertEnum(state, 'ReadinessState', READINESS_STATE_SET)
  return state
}

export function validateMaterializationPlan(input) {
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

export function resolveMaterializationPlan(options = {}) {
  const descriptor = options.descriptor
  const request = options.request

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

export async function materializeImmutableObject(options = {}) {
  const reference = options.reference
  const scope = createOperationScope(options)

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
      as: 'stream',
      timeoutMs: options.timeoutMs,
      signal: options.signal
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
      as: 'buffer',
      timeoutMs: options.timeoutMs,
      signal: options.signal
    })

    const destination = path.resolve(options.destination)

    await scope.waitFor(
      mkdir(path.dirname(destination), { recursive: true }),
      'Materialization destination preparation'
    )

    try {
      await scope.waitFor(
        writeFile(destination, loaded.bytes),
        'Materialization write'
      )
    } catch (error) {
      if (error.code === 'ERR_OPERATION_ABORTED' || error.code === 'ERR_OPERATION_TIMEOUT') {
        throw error
      }

      throw createMeshBytesError(
        'ERR_MATERIALIZATION_WRITE_FAILED',
        'Materialization write failed',
        { cause: error }
      )
    }

    const written = await scope.waitFor(
      stat(destination),
      'Materialization verification stat'
    )

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
    const { fetchImmutableObject } = await import('../transport/index.js')
    return fetchImmutableObject(options)
  }

  const { readImmutableObject } = await import('../object/read.js')
  return readImmutableObject(options)
}
