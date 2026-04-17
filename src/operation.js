import { createMeshBytesError } from './errors.js'
import { assertInteger } from './shared.js'

export function createOperationScope(options = {}) {
  const signal = options.signal
  const timeoutMs = normalizeTimeoutMs(options.timeoutMs)
  const deadline = timeoutMs === undefined ? null : Date.now() + timeoutMs

  function throwIfAborted(label = 'operation') {
    if (signal && signal.aborted) {
      throw createAbortError(label)
    }
  }

  async function waitFor(promise, label = 'operation', callbacks = {}) {
    throwIfAborted(label)

    const remainingMs = getRemainingMs(deadline, timeoutMs, label)

    return new Promise((resolve, reject) => {
      let settled = false
      let timeoutId = null

      const cleanup = () => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId)
        }

        if (signal) {
          signal.removeEventListener('abort', onAbort)
        }
      }

      const settleResolve = (value) => {
        if (settled) return
        settled = true
        cleanup()
        resolve(value)
      }

      const settleReject = (error) => {
        if (settled) return
        settled = true
        cleanup()
        reject(error)
      }

      const onAbort = () => {
        if (callbacks.onAbort) {
          callbacks.onAbort()
        }

        settleReject(createAbortError(label))
      }

      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true })
      }

      if (remainingMs !== null) {
        timeoutId = setTimeout(() => {
          if (callbacks.onTimeout) {
            callbacks.onTimeout()
          }

          settleReject(createTimeoutError(label, timeoutMs))
        }, remainingMs)
      }

      Promise.resolve(promise).then(settleResolve, settleReject)
    })
  }

  function bindStream(stream, label = 'operation', callbacks = {}) {
    throwIfAborted(label)

    if (!signal && timeoutMs === undefined) {
      return stream
    }

    const remainingMs = getRemainingMs(deadline, timeoutMs, label)
    let timeoutId = null

    const cleanup = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }

      if (signal) {
        signal.removeEventListener('abort', onAbort)
      }
    }

    const fail = (error, callback) => {
      if (callback) {
        callback()
      }

      cleanup()

      if (!stream.destroyed) {
        stream.destroy(error)
      }
    }

    const onAbort = () => {
      fail(createAbortError(label), callbacks.onAbort)
    }

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true })
    }

    if (remainingMs !== null) {
      timeoutId = setTimeout(() => {
        fail(createTimeoutError(label, timeoutMs), callbacks.onTimeout)
      }, remainingMs)
    }

    stream.once('close', cleanup)
    stream.once('end', cleanup)
    stream.once('error', cleanup)

    return stream
  }

  return {
    signal,
    timeoutMs,
    bindStream,
    throwIfAborted,
    waitFor
  }
}

function createAbortError(label) {
  return createMeshBytesError('ERR_OPERATION_ABORTED', `${label} was aborted`)
}

function createTimeoutError(label, timeoutMs) {
  return createMeshBytesError('ERR_OPERATION_TIMEOUT', `${label} timed out after ${timeoutMs}ms`)
}

function getRemainingMs(deadline, timeoutMs, label) {
  if (deadline === null) {
    return null
  }

  const remainingMs = deadline - Date.now()

  if (remainingMs <= 0) {
    throw createTimeoutError(label, timeoutMs)
  }

  return remainingMs
}

function normalizeTimeoutMs(timeoutMs) {
  if (timeoutMs === undefined) {
    return undefined
  }

  assertInteger(timeoutMs, 'timeoutMs', { min: 1 })
  return timeoutMs
}
