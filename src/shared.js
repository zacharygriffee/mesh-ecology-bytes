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

function normalizeHash(hash) {
  if (hash === undefined) return undefined

  if (typeof hash === 'string') {
    return {
      algorithm: 'sha256',
      value: hash.toLowerCase()
    }
  }

  assertObject(hash, 'hash')
  assertNonEmptyString(hash.algorithm, 'hash.algorithm')
  assertHex(hash.value, 'hash.value')

  return {
    algorithm: hash.algorithm,
    value: hash.value.toLowerCase()
  }
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
  normalizeHash,
  stripUndefined
}
