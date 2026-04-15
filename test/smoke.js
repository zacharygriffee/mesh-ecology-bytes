const assert = require('assert/strict')
const { mkdtemp, rm } = require('fs/promises')
const { tmpdir } = require('os')
const path = require('path')

const {
  createByteReference,
  createHypercoreByteStore,
  createMaterializationHints,
  createMaterializationRequest
} = require('../src')

async function main() {
  const storageDir = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-smoke-'))
  const payload = Buffer.from('hello mesh bytes')

  try {
    const store = createHypercoreByteStore({
      storage: storageDir,
      transport: null
    })

    const hints = createMaterializationHints({
      preferredMode: 'cache',
      visibility: 'internal',
      placementClass: 'artifact_cache'
    })

    const published = await store.publish(payload, {
      descriptor: {
        contentType: 'application/octet-stream',
        role: 'runtime_blob',
        materializationHints: hints
      }
    })

    assert.equal(published.descriptor.size, payload.length)
    assert.equal(published.reference.transport, 'hypercore')
    assert.equal(published.reference.descriptor.index, 0)
    await store.close()

    const request = createMaterializationRequest({
      reference: createByteReference(published.reference),
      mode: 'cache',
      filenameHint: 'runtime.blob'
    })

    assert.equal(request.mode, 'cache')

    const fetcher = createHypercoreByteStore({
      storage: storageDir,
      transport: null
    })

    const fetched = await fetcher.fetch(published.reference, {
      as: 'buffer',
      waitForNetwork: false
    })

    assert.equal(fetched.bytes.toString(), payload.toString())
    assert.equal(fetched.descriptor.role, 'runtime_blob')
    await fetcher.close()
  } finally {
    await rm(storageDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
