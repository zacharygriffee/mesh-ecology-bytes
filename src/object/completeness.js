import { createHash } from 'node:crypto'

import { READINESS_STATES } from '../materialization/index.js'

export async function assessObjectLifecycle(core, descriptor, options = {}) {
  const fetched = Boolean(options.fetched)
  const complete = fetched && await hasAllBlocks(core)
  const materialized = Boolean(options.materialized)
  const integrityValid = materialized
    ? validateMaterializedBytes(descriptor, options.materializedBytes)
    : false
  const ready = complete && materialized && integrityValid

  return {
    fetched,
    complete,
    materialized,
    ready,
    state: selectReadinessState({ fetched, complete, materialized, ready })
  }
}

export async function hasAllBlocks(core) {
  if (!core || typeof core.length !== 'number' || core.length < 1) {
    return false
  }

  return core.has(0, core.length)
}

export function validateMaterializedBytes(descriptor, bytes) {
  if (!Buffer.isBuffer(bytes)) {
    throw new TypeError('materialized bytes must be a Buffer')
  }

  if (bytes.length !== descriptor.size) {
    return false
  }

  if (!descriptor.integrityHint) {
    return true
  }

  const digest = createHash(descriptor.integrityHint.algorithm).update(bytes).digest('hex')
  return digest === descriptor.integrityHint.value
}

export function selectReadinessState(status) {
  if (status.ready) return READINESS_STATES[3]
  if (status.materialized) return READINESS_STATES[2]
  if (status.complete) return READINESS_STATES[1]
  if (status.fetched) return READINESS_STATES[0]
  return null
}
