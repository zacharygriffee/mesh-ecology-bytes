const { createHash } = require('crypto')
const { PassThrough } = require('stream')

const Hypercore = require('hypercore')

const {
  createByteDescriptor,
  decodeByteDescriptor,
  encodeByteDescriptor
} = require('../../descriptor')
const { normalizeByteReference } = require('../../reference')
const { createHyperswarmTransport } = require('../hyperswarm')

const DEFAULT_CHUNK_SIZE = 64 * 1024

class HypercoreByteStore {
  constructor(options = {}) {
    if (!options.storage) {
      throw new TypeError('HypercoreByteStore requires a storage target')
    }

    this.storage = options.storage
    this.chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE
    this.transport = options.transport === undefined ? createHyperswarmTransport() : options.transport
    this._ownsTransport = options.transport === undefined
    this._managedCores = new Set()
    this._attachments = new Map()
    this._publishCore = null
    this._referenceCore = null
  }

  async publish(bytes, options = {}) {
    const buffer = toBuffer(bytes)
    const chunkSize = options.chunkSize || this.chunkSize
    const hashValue = createHash('sha256').update(buffer).digest('hex')
    const suppliedDescriptor = options.descriptor || {}

    if (suppliedDescriptor.size !== undefined && suppliedDescriptor.size !== buffer.length) {
      throw new Error('descriptor.size does not match the published byte length')
    }

    if (suppliedDescriptor.hash !== undefined) {
      const normalizedDescriptor = createByteDescriptor({
        id: suppliedDescriptor.id || `sha256:${hashValue}`,
        hash: suppliedDescriptor.hash,
        size: buffer.length
      })

      if (normalizedDescriptor.hash.value !== hashValue) {
        throw new Error('descriptor.hash does not match the published bytes')
      }
    }

    const descriptor = createByteDescriptor({
      ...suppliedDescriptor,
      id: suppliedDescriptor.id || `sha256:${hashValue}`,
      hash: suppliedDescriptor.hash || {
        algorithm: 'sha256',
        value: hashValue
      },
      size: buffer.length
    })

    const core = await this._openPublishCore({ overwrite: options.overwrite === true })

    if (core.length > 0) {
      throw new Error('publish() expects an empty Hypercore. Use a new storage target for each byte object.')
    }

    const blocks = [encodeByteDescriptor(descriptor), ...chunkBytes(buffer, chunkSize)]
    await core.append(blocks)
    await this._attachTransport(core, {
      server: options.server !== false,
      client: false,
      waitForAnnouncement: options.waitForAnnouncement !== false
    })

    return {
      descriptor,
      reference: normalizeByteReference({
        transport: 'hypercore',
        key: core.key.toString('hex'),
        version: core.length,
        descriptor: { index: 0 }
      })
    }
  }

  async getDescriptor(reference, options = {}) {
    const normalizedReference = normalizeByteReference(reference)
    const core = await this._openReferenceCore(normalizedReference)

    await this._primeReferenceCore(core, normalizedReference, options)

    return decodeByteDescriptor(await core.get(normalizedReference.descriptor.index, {
      wait: this.transport !== null
    }))
  }

  async fetch(reference, options = {}) {
    const normalizedReference = normalizeByteReference(reference)
    const mode = options.as || 'buffer'

    if (mode !== 'buffer' && mode !== 'stream') {
      throw new TypeError('fetch() only supports { as: "buffer" } or { as: "stream" }')
    }

    const core = await this._openReferenceCore(normalizedReference)
    const descriptor = await this._primeReferenceCore(core, normalizedReference, options)
    const end = normalizedReference.version || core.length

    if (end < 1) {
      throw new Error('Referenced Hypercore does not contain a descriptor block')
    }

    const stream = this._createDataStream(core, { start: 1, end })

    if (mode === 'stream') {
      return {
        descriptor,
        reference: normalizedReference,
        stream
      }
    }

    const bytes = await collectStream(stream)

    if (descriptor.size !== undefined && descriptor.size !== bytes.length) {
      throw new Error('Fetched bytes do not match descriptor.size')
    }

    return {
      descriptor,
      reference: normalizedReference,
      bytes
    }
  }

  async close() {
    for (const core of [...this._managedCores]) {
      await core.close()
      this._managedCores.delete(core)
    }

    if (this.transport && this._ownsTransport) {
      await this.transport.close()
    }
  }

  async _openPublishCore(options) {
    if (this._publishCore) return this._publishCore

    const core = new Hypercore(this.storage, {
      overwrite: options.overwrite,
      valueEncoding: 'binary'
    })

    await core.ready()
    this._publishCore = core
    this._managedCores.add(core)

    return core
  }

  async _openReferenceCore(reference) {
    if (this._referenceCore && this._referenceCore.key.toString('hex') === reference.key) {
      return this._referenceCore
    }

    const core = new Hypercore(this.storage, Buffer.from(reference.key, 'hex'), {
      valueEncoding: 'binary',
      writable: false
    })

    await core.ready()
    this._referenceCore = core
    this._managedCores.add(core)

    return core
  }

  async _primeReferenceCore(core, reference, options) {
    const waitForNetwork = this.transport !== null && options.waitForNetwork !== false

    if (this.transport) {
      const doneFindingPeers = core.findingPeers()

      try {
        await this._attachTransport(core, {
          server: false,
          client: true,
          waitForAnnouncement: false
        })

        if (waitForNetwork) {
          await this.transport.flush()
        }
      } finally {
        doneFindingPeers()
      }
    }

    await core.update({ wait: waitForNetwork })

    const requiredLength = reference.version || 1

    if (core.length < requiredLength) {
      throw new Error(
        `Reference length ${requiredLength} is not available. Current local length is ${core.length}.`
      )
    }

    return decodeByteDescriptor(await core.get(reference.descriptor.index, {
      wait: waitForNetwork
    }))
  }

  async _attachTransport(core, options) {
    if (!this.transport) return null

    const existingAttachment = this._attachments.get(core)

    if (existingAttachment) return existingAttachment

    const attachment = await this.transport.attachCore(core, options)
    this._attachments.set(core, attachment)
    return attachment
  }

  _createDataStream(core, { start, end }) {
    const output = new PassThrough()
    const source = core.createReadStream({
      start,
      end,
      wait: true,
      snapshot: true
    })

    ;(async () => {
      try {
        for await (const block of source) {
          output.write(block)
        }

        output.end()
      } catch (error) {
        output.destroy(error)
      }
    })()

    return output
  }
}

function createHypercoreByteStore(options) {
  return new HypercoreByteStore(options)
}

function toBuffer(value) {
  if (Buffer.isBuffer(value)) return value
  if (value instanceof Uint8Array) return Buffer.from(value)
  if (typeof value === 'string') return Buffer.from(value)

  throw new TypeError('Bytes must be a Buffer, Uint8Array, or string')
}

function chunkBytes(buffer, chunkSize) {
  if (!Number.isInteger(chunkSize) || chunkSize < 1) {
    throw new TypeError('chunkSize must be an integer >= 1')
  }

  const chunks = []

  for (let offset = 0; offset < buffer.length; offset += chunkSize) {
    chunks.push(buffer.subarray(offset, offset + chunkSize))
  }

  return chunks
}

async function collectStream(stream) {
  const chunks = []

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }

  return Buffer.concat(chunks)
}

module.exports = {
  DEFAULT_CHUNK_SIZE,
  HypercoreByteStore,
  createHypercoreByteStore
}
