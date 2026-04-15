# mesh-ecology-bytes

`mesh-ecology-bytes` is a byte-level infrastructure layer for publishing opaque bytes, referencing them in a transport-neutral shape, and materializing them through a Hypercore substrate with Hyperswarm as the default transport adapter.

It does not define artifact meaning, authority, placement policy, workflow execution, deployment, or runtime semantics.

## Current Package Targets

Verified against the latest npm releases available on April 15, 2026:

- `hypercore@11.28.1`
- `hyperswarm@4.17.0`

## File Tree

```text
mesh-ecology-bytes/
  examples/
    publish-fetch.js
  src/
    descriptor/
      index.js
    materialization/
      index.js
    reference/
      index.js
    transport/
      hypercore/
        index.js
      hyperswarm/
        index.js
      index.js
    index.js
    shared.js
  test/
    smoke.js
  .gitignore
  package.json
  README.md
```

## Module Summary

### `src/descriptor`

Defines `ByteDescriptor` creation, normalization, JSON block encoding, JSON block decoding, and validation.

Rules enforced here:

- descriptor is safe to share
- no host paths
- no placement authority
- no secret-bearing extension fields
- materialization data stays in hint form only

### `src/reference`

Defines `ByteReference` creation and validation.

Initial references support:

- transport: `hypercore`
- key: Hypercore public key
- version: Hypercore length snapshot
- descriptor pointer: block `0`

### `src/materialization`

Defines:

- `MaterializationHints`
- `MaterializationRequest`

The request lives on the consumer side and does not mutate or redefine the published bytes.

### `src/transport/hyperswarm`

Provides the default transport adapter.

Responsibilities:

- join discovery on a Hypercore discovery key
- announce or lookup via Hyperswarm server/client modes
- attach Hypercore replication onto the duplex connection

This layer knows about transport discovery and peer connections, but not about descriptor meaning or placement.

### `src/transport/hypercore`

Provides the byte substrate implementation.

Responsibilities:

- create or open Hypercores
- publish one byte object per Hypercore
- store descriptor JSON in block `0`
- store byte chunks in blocks `1..n`
- fetch descriptor and data from local storage or over replication

## Shape Definitions

### `ByteDescriptor`

Current normalized shape:

```js
{
  schema: 'mesh-ecology-bytes/byte-descriptor@1',
  id: 'sha256:<hex>' | '<custom-id>',
  hash: {
    algorithm: 'sha256',
    value: '<hex>'
  },
  size: 1234,
  contentType: 'application/octet-stream',
  encoding: 'utf-8',
  framing: 'tar',
  mutability: 'immutable' | 'replaceable',
  role: 'runtime_blob',
  materializationHints: {
    preferredMode: 'stream' | 'cache' | 'mirror',
    visibility: 'operator' | 'public' | 'internal',
    placementClass: 'artifact_cache'
  }
}
```

Notes:

- `contentType`, `encoding`, `framing`, and `role` are hints only.
- `materializationHints` are intentionally non-authoritative.
- no placement path is stored.

### `ByteReference`

Current normalized shape:

```js
{
  schema: 'mesh-ecology-bytes/byte-reference@1',
  transport: 'hypercore',
  key: '<32-byte public key as hex>',
  version: 5,
  descriptor: {
    index: 0
  }
}
```

Notes:

- `version` is the Hypercore length snapshot for the published object.
- `descriptor.index` points to the descriptor block.
- the shape is transport-neutral at the top level, while the current concrete transport implementation is Hypercore.

### `MaterializationRequest`

Current normalized shape:

```js
{
  reference: <ByteReference>,
  targetClass: 'runtime_input',
  mode: 'stream' | 'cache' | 'mirror',
  filenameHint: 'bundle.tar'
}
```

Notes:

- this is consumer-side intent
- it does not alter the source publication
- `filenameHint` is validated as a filename hint, not a path

## Example

```js
const { createHypercoreByteStore } = require('mesh-ecology-bytes')

const publisher = createHypercoreByteStore({
  storage: '/tmp/mesh-bytes/publisher'
})

const consumer = createHypercoreByteStore({
  storage: '/tmp/mesh-bytes/consumer'
})

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

const reference = published.reference

const fetched = await consumer.fetch(reference, { as: 'buffer' })

console.log(reference)
console.log(fetched.bytes.toString())
```

Operational note:

- the publishing process must stay alive while serving over Hyperswarm
- this library does not choose where either storage directory lives

## Design Boundaries

Intentionally left out for later phases:

- mesh concern semantics
- artifact meaning
- authority and policy enforcement
- placement resolution and filesystem target selection
- workflow execution
- deployment and activation logic
- scheduler behavior
- Hyperbee cataloging
- Autobase or multiwriter replication
- higher-level indexing or search
- runtime control surfaces or UI

## Development

Run the local smoke test:

```sh
npm test
```
