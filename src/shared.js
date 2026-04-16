const HEX_PATTERN = /^[0-9a-f]+$/i

function assertObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`)
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${label} must be a non-empty string`)
  }
}

function assertOptionalString(value, label) {
  if (value === undefined) return
  assertNonEmptyString(value, label)
}

function assertInteger(value, label, { min = Number.MIN_SAFE_INTEGER } = {}) {
  if (!Number.isInteger(value) || value < min) {
    throw new TypeError(`${label} must be an integer >= ${min}`)
  }
}

function assertEnum(value, label, allowedValues) {
  if (!allowedValues.has(value)) {
    throw new TypeError(`${label} must be one of: ${[...allowedValues].join(', ')}`)
  }
}

function assertHex(value, label, expectedLength) {
  assertNonEmptyString(value, label)

  if (!HEX_PATTERN.test(value)) {
    throw new TypeError(`${label} must be a hex string`)
  }

  if (expectedLength !== undefined && value.length !== expectedLength) {
    throw new TypeError(`${label} must be ${expectedLength} hex characters`)
  }
}

function normalizeIntegrityHint(hint, label = 'integrityHint') {
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

function normalizeHash(hash) {
  return normalizeIntegrityHint(hash, 'hash')
}

function stripUndefined(input) {
  const output = {}

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) output[key] = value
  }

  return output
}

module.exports = {
  assertEnum,
  assertHex,
  assertInteger,
  assertNonEmptyString,
  assertObject,
  assertOptionalString,
  normalizeIntegrityHint,
  normalizeHash,
  stripUndefined
}
