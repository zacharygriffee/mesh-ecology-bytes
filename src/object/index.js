const { assessObjectLifecycle, hasAllBlocks, selectReadinessState, validateMaterializedBytes } = require('./completeness')
const {
  DEFAULT_PAYLOAD_CHUNK_SIZE,
  DESCRIPTOR_BLOCK_INDEX,
  PAYLOAD_START_BLOCK_INDEX,
  chunkPayload,
  createDescriptorHash,
  deserializeByteDescriptor,
  getPayloadBlockCount,
  getTotalBlockCount,
  serializeByteDescriptor
} = require('./layout')
const { RETENTION_TERMS, assessRetentionPosture, validateLifecycleSnapshot, validateRetentionTerm } = require('./retention')
const { publishImmutableObject } = require('./publish')
const { readImmutableObject } = require('./read')

module.exports = {
  DEFAULT_PAYLOAD_CHUNK_SIZE,
  DESCRIPTOR_BLOCK_INDEX,
  PAYLOAD_START_BLOCK_INDEX,
  RETENTION_TERMS,
  assessObjectLifecycle,
  assessRetentionPosture,
  chunkPayload,
  createDescriptorHash,
  deserializeByteDescriptor,
  getPayloadBlockCount,
  getTotalBlockCount,
  hasAllBlocks,
  publishImmutableObject,
  readImmutableObject,
  selectReadinessState,
  serializeByteDescriptor,
  validateLifecycleSnapshot,
  validateMaterializedBytes,
  validateRetentionTerm
}
