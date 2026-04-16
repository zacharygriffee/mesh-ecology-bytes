# Contracts

## V1 Contract Scope

V1 defines the contract for immutable byte publication, immutable byte reference, transport-backed retrieval, and consumer-driven materialization.

The v1 contract does not define:

- artifact or package meaning
- authority or policy
- placement resolution
- workflow or runtime behavior
- keyed or mutable store semantics

## ByteDescriptor

`ByteDescriptor` describes one immutable byte object.

Contract posture:

- belongs to exactly one immutable object
- is stored at index `0` for the default Hypercore family
- must be safe to share
- must remain transport-oriented and materialization-oriented

### Required Contract Fields

- `contentType`
- `size`
- `encoding` or `framing`
- `materializationHints`

`materializationHints` is required, but it may be an empty object.

### Optional Contract Fields

- `integrityHint`
- `role`
- `logicalId`

Field posture:

- `integrityHint` is advisory integrity metadata only
- `role` is an open string and hint only
- `logicalId` is optional and non-authoritative

### Explicit Exclusions

`ByteDescriptor` must not contain:

- secrets
- host-local paths
- authority or policy data
- mesh concern semantics
- deployment or execution semantics

## ByteReference

`ByteReference` points to one immutable byte object.

V1 uses a minimal immutable Hypercore reference family.

### Required Contract Fields

- `family: "hypercore_immutable"`
- `key`

### Optional Contract Fields

- `descriptorHash`
- `integrityHint`

### Explicit Decisions

- there is no `version` field in v1
- there are no mutable-head semantics in the base reference
- one reference points to one immutable object only

Field posture:

- `descriptorHash` is an optional advisory check for the descriptor block
- `integrityHint` is optional advisory integrity metadata
- neither field changes object identity

## MaterializationHints

`MaterializationHints` are producer-side hints and travel with the descriptor.

Contract posture:

- advisory only
- safe to share
- non-authoritative
- do not choose final placement
- do not force consumer behavior

Examples of hint fields:

- `preferredMode`
- `placementClass`
- `visibility`
- `filenameHint`

## MaterializationRequest

`MaterializationRequest` is consumer-side and local to the consumer.

Contract posture:

- describes how this consumer wants the bytes
- may override hints locally
- does not change the underlying immutable object
- does not redefine publication semantics

Examples of request fields:

- `mode`
- `targetClass`
- `filenameOverride`

### Hints vs Requests Rule

- bytes validates both shapes
- bytes does not arbitrate conflicts between them
- hints do not force behavior
- requests do not mutate the underlying object

## Completion And Readiness Semantics

V1 uses a minimal immutable-object lifecycle vocabulary:

- `fetched`: replication has started
- `complete`: all blocks for the immutable object are present
- `materialized`: bytes have been written or placed locally
- `ready`: materialization completed and validation succeeded

Rules:

- readiness is consumer-facing
- readiness does not imply deployment, activation, usage, or execution
- bytes may expose these states, but bytes does not define runtime behavior beyond them

## Transport Contract

Default v1 transport posture:

- Hypercore is the byte substrate
- Hyperswarm is the default transport and discovery layer
- transport attaches duplex replication to the byte substrate
- transport must not redefine object identity

The transport layer is adapter-shaped:

- the default implementation may use Hyperswarm
- future adapters may exist later
- byte semantics must not be hardcoded to Hyperswarm specifics

Current implementation note:

- the object model supports local Hypercore object publication and local readback
- minimal Hyperswarm-backed replication is implemented for the immutable Hypercore family
- transport remains separate from object identity, layout, and reference semantics

## Partial Fetch Contract

In v1, partial fetch means:

- the immutable object is not yet fully replicated locally, or
- the immutable object is not yet fully materialized to the consumer’s requested form

It does not mean:

- byte-range querying
- arbitrary slice contracts
- mutable progressive reads across changing content

## Phase 2 Support Surface

The current object-model implementation is intentionally minimal:

- publish accepts `Buffer` and `Uint8Array`
- descriptor is serialized deterministically into block `0`
- payload is chunked into blocks `1..n`
- local reads support `buffer` or `stream` output
- completeness and readiness are evaluated at the immutable object level

## Phase 3 Support Surface

The current transport implementation is intentionally minimal:

- a publisher may announce and serve one immutable Hypercore object over Hyperswarm
- a consumer may fetch one immutable Hypercore object over Hyperswarm into local Hypercore storage
- fetched bytes still resolve through the same `ByteReference`
- transport does not introduce mutable-head or version semantics

## Future Reference Families

Future keyed, path-based, or mutable backing stores may exist later.

If they are added:

- they should become distinct reference families
- they must not silently change the meaning of the base immutable `ByteReference`
- they must not overload index `0` in the base Hypercore family
