const HEX_PATTERN = /^[0-9a-f]+$/i

export function assertObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`)
  }
}

export function assertAllowedKeys(value, label, allowedKeys) {
  assertObject(value, label)

  const allowed = new Set(allowedKeys)

  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new TypeError(`${label} must not include unsupported field: ${key}`)
    }
  }
}

export function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${label} must be a non-empty string`)
  }
}

export function assertBoolean(value, label) {
  if (typeof value !== 'boolean') {
    throw new TypeError(`${label} must be a boolean`)
  }
}

export function assertOptionalString(value, label) {
  if (value === undefined) return
  assertNonEmptyString(value, label)
}

export function assertInteger(value, label, { min = Number.MIN_SAFE_INTEGER } = {}) {
  if (!Number.isInteger(value) || value < min) {
    throw new TypeError(`${label} must be an integer >= ${min}`)
  }
}

export function assertEnum(value, label, allowedValues) {
  if (!allowedValues.has(value)) {
    throw new TypeError(`${label} must be one of: ${[...allowedValues].join(', ')}`)
  }
}

export function assertHex(value, label, expectedLength) {
  assertNonEmptyString(value, label)

  if (!HEX_PATTERN.test(value)) {
    throw new TypeError(`${label} must be a hex string`)
  }

  if (expectedLength !== undefined && value.length !== expectedLength) {
    throw new TypeError(`${label} must be ${expectedLength} hex characters`)
  }
}

export function normalizeIntegrityHint(hint, label = 'integrityHint') {
  if (hint === undefined) return undefined

  if (typeof hint === 'string') {
    return {
      algorithm: 'sha256',
      value: hint.toLowerCase()
    }
  }

  assertObject(hint, label)
  assertNonEmptyString(hint.algorithm, `${label}.algorithm`)
  assertHex(hint.value, `${label}.value`)

  return {
    algorithm: hint.algorithm,
    value: hint.value.toLowerCase()
  }
}

export function normalizeHash(hash) {
  return normalizeIntegrityHint(hash, 'hash')
}

export function stripUndefined(input) {
  const output = {}

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) output[key] = value
  }

  return output
}
