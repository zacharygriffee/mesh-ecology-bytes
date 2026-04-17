import { validateReadinessState } from '../materialization/index.js'
import { assertAllowedKeys, assertBoolean, assertObject } from '../shared.js'

export const RETENTION_TERMS = ['pinned', 'ephemeral', 'stale', 'prunable']

export function assessRetentionPosture(options = {}) {
  assertObject(options, 'RetentionInspection')

  if (options.lifecycle !== undefined) {
    validateLifecycleSnapshot(options.lifecycle)
  }

  const pinned = options.pinned === undefined ? false : validateBooleanOption(options.pinned, 'RetentionInspection.pinned')
  const stale = options.stale === undefined ? false : validateBooleanOption(options.stale, 'RetentionInspection.stale')
  const local = options.lifecycle ? options.lifecycle.fetched === true : false
  const ephemeral = !pinned
  const prunable = local && !pinned

  return {
    pinned,
    ephemeral,
    stale,
    prunable
  }
}

export function validateLifecycleSnapshot(lifecycle) {
  assertAllowedKeys(lifecycle, 'RetentionInspection.lifecycle', ['fetched', 'complete', 'materialized', 'ready', 'state'])
  validateBooleanOption(lifecycle.fetched, 'RetentionInspection.lifecycle.fetched')
  validateBooleanOption(lifecycle.complete, 'RetentionInspection.lifecycle.complete')
  validateBooleanOption(lifecycle.materialized, 'RetentionInspection.lifecycle.materialized')
  validateBooleanOption(lifecycle.ready, 'RetentionInspection.lifecycle.ready')

  if (lifecycle.state !== undefined) {
    validateReadinessState(lifecycle.state)
  }

  return lifecycle
}

export function validateRetentionPosture(posture) {
  assertAllowedKeys(posture, 'RetentionPosture', ['pinned', 'ephemeral', 'stale', 'prunable'])
  validateBooleanOption(posture.pinned, 'RetentionPosture.pinned')
  validateBooleanOption(posture.ephemeral, 'RetentionPosture.ephemeral')
  validateBooleanOption(posture.stale, 'RetentionPosture.stale')
  validateBooleanOption(posture.prunable, 'RetentionPosture.prunable')
  return posture
}

export function validateRetentionTerm(term) {
  if (!RETENTION_TERMS.includes(term)) {
    throw new TypeError(`RetentionTerm must be one of: ${RETENTION_TERMS.join(', ')}`)
  }

  return term
}

function validateBooleanOption(value, label) {
  assertBoolean(value, label)
  return value
}
