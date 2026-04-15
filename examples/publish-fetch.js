const { mkdtemp, rm } = require('fs/promises')
const { tmpdir } = require('os')
const path = require('path')

const { createHypercoreByteStore } = require('../src')

async function main() {
  const publisherDir = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-publisher-'))
  const consumerDir = await mkdtemp(path.join(tmpdir(), 'mesh-bytes-consumer-'))

  const publisher = createHypercoreByteStore({ storage: publisherDir })
  const consumer = createHypercoreByteStore({ storage: consumerDir })

  try {
    const published = await publisher.publish(Buffer.from('mesh byte payload'), {
      descriptor: {
        contentType: 'application/octet-stream',
        role: 'runtime_blob',
        materializationHints: {
          preferredMode: 'stream',
          visibility: 'internal',
          placementClass: 'runtime_input'
        }
      }
    })

    console.log('Reference:', published.reference)
    console.log('Descriptor:', published.descriptor)

    const fetched = await consumer.fetch(published.reference, { as: 'buffer' })
    console.log('Fetched bytes:', fetched.bytes.toString())
  } finally {
    await Promise.allSettled([publisher.close(), consumer.close()])
    await Promise.allSettled([
      rm(publisherDir, { recursive: true, force: true }),
      rm(consumerDir, { recursive: true, force: true })
    ])
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
