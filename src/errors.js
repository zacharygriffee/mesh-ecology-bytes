export class MeshBytesError extends Error {
  constructor(code, message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = 'MeshBytesError'
    this.code = code
  }
}

export const ERROR_CODES = [
  'ERR_OPERATION_ABORTED',
  'ERR_OPERATION_TIMEOUT',
  'ERR_DESCRIPTOR_MISSING',
  'ERR_DESCRIPTOR_UNAVAILABLE',
  'ERR_INVALID_DESCRIPTOR',
  'ERR_DESCRIPTOR_HASH_MISMATCH',
  'ERR_INTEGRITY_MISMATCH',
  'ERR_MATERIALIZATION_WRITE_FAILED'
]

export function createMeshBytesError(code, message, options) {
  return new MeshBytesError(code, message, options)
}

export function isMeshBytesError(error, code) {
  if (!(error instanceof MeshBytesError)) {
    return false
  }

  if (code === undefined) {
    return true
  }

  return error.code === code
}
