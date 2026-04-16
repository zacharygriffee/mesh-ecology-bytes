class MeshBytesError extends Error {
  constructor(code, message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = 'MeshBytesError'
    this.code = code
  }
}

const ERROR_CODES = [
  'ERR_OPERATION_ABORTED',
  'ERR_OPERATION_TIMEOUT',
  'ERR_DESCRIPTOR_MISSING',
  'ERR_DESCRIPTOR_UNAVAILABLE',
  'ERR_INVALID_DESCRIPTOR',
  'ERR_DESCRIPTOR_HASH_MISMATCH',
  'ERR_INTEGRITY_MISMATCH',
  'ERR_MATERIALIZATION_WRITE_FAILED'
]

function createMeshBytesError(code, message, options) {
  return new MeshBytesError(code, message, options)
}

function isMeshBytesError(error, code) {
  if (!(error instanceof MeshBytesError)) {
    return false
  }

  if (code === undefined) {
    return true
  }

  return error.code === code
}

module.exports = {
  ERROR_CODES,
  MeshBytesError,
  createMeshBytesError,
  isMeshBytesError
}
