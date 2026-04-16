const { createHash } = require('crypto')
const { mkdtemp, rm } = require('fs/promises')
const { tmpdir } = require('os')
const path = require('path')

const { publishImmutableObject, readImmutableObject } = require('../src')

async function main() {
  const storage = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-local-object-'))
  const bytes = Buffer.from('mesh byte payload')

  try {
    const descriptor = {
      contentType: 'application/octet-stream',
      size: bytes.length,
      encoding: 'binary',
      materializationHints: {
        preferredMode: 'stream',
        visibility: 'internal',
        placementClass: 'runtime_input',
        filenameHint: 'payload.bin'
      },
      integrityHint: {
        algorithm: 'sha256',
        value: createHash('sha256').update(bytes).digest('hex')
      },
      role: 'runtime_blob'
    }

    const published = await publishImmutableObject({
      storage,
      bytes,
      descriptor
    })

    console.log('Reference:', published.reference)
    console.log('Publish lifecycle:', published.object.lifecycle)

    const readBack = await readImmutableObject({
      storage,
      reference: published.reference,
      as: 'buffer'
    })

    console.log('Read lifecycle:', readBack.lifecycle)
    console.log('Fetched bytes:', readBack.bytes.toString())
  } finally {
    await rm(storage, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
