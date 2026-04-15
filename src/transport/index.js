const {
  DEFAULT_CHUNK_SIZE,
  HypercoreByteStore,
  createHypercoreByteStore
} = require('./hypercore')
const { HyperswarmTransport, createHyperswarmTransport } = require('./hyperswarm')

module.exports = {
  DEFAULT_CHUNK_SIZE,
  HypercoreByteStore,
  HyperswarmTransport,
  createHypercoreByteStore,
  createHyperswarmTransport
}
