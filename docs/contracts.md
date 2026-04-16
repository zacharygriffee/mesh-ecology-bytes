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

### Mode Semantics

- `stream`: expose the immutable object as a consumer-facing readable byte stream
- `cache`: materialize the immutable object to a consumer-provided cache destination
- `mirror`: materialize the immutable object to a consumer-provided mirror destination

Rules:

- bytes does not choose the destination path for `cache` or `mirror`
- destination is runtime input supplied by the consumer outside the `MaterializationRequest`
- if no request mode is supplied, the current helper defaults to `stream`

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
- handing out a stream does not by itself imply `materialized` or `ready`
- local buffer or file materialization may reach `ready` once validation succeeds

## Retention And Lifecycle Posture

V1 uses a narrow local retention vocabulary for immutable objects:

- `pinned`: the consumer intends to retain the local copy
- `ephemeral`: the local copy is not pinned for retention
- `stale`: the consumer considers this immutable object superseded by another immutable object in local context
- `prunable`: the local copy is present and not pinned, so it is eligible for removal from the byte layer's perspective

Rules:

- these terms are local posture terms, not publication semantics
- `stale` does not invalidate the original `ByteReference`
- `pinned` and `ephemeral` do not change object identity
- `prunable` is an eligibility signal, not a pruning policy
- bytes may report retention posture, but bytes does not schedule pruning or define ownership rules

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

## Phase 4 Support Surface

The current materialization implementation is intentionally minimal:

- `stream` materialization returns a readable stream and preserves object lifecycle state
- `cache` and `mirror` materialization write to an explicit consumer-provided destination
- `filenameHint` and `filenameOverride` affect effective materialization plan metadata, not path selection

## Phase 6 Support Surface

The current retention implementation is intentionally minimal:

- retention posture is inspected locally from immutable-object lifecycle plus consumer-supplied `pinned` or `stale` facts
- `ephemeral` and `prunable` are derived posture fields
- the byte layer reports retention posture but does not prune, schedule, or arbitrate policy

## Consumer Integration Seams

Phase 7 defines narrow consumer-facing seams without broadening byte semantics.

### Platform-Facing Materialization Seam

The byte layer may expose the following platform-facing seam fields:

- `reference`
- `descriptor`
- `lifecycle`
- `retention`
- `plan`
- `destination`
- `bytesWritten`

Field posture:

- `destination` is only echoed when the consumer already supplied it
- `plan` contains byte-level materialization intent only
- `lifecycle` and `retention` report byte-layer state only

The byte layer does not define or accept as part of this seam:

- deployment state
- activation state
- overwrite policy
- filesystem ownership policy
- cleanup scheduling
- concern semantics

### Pack-Facing Artifact-Byte Seam

The byte layer may expose the following pack-facing seam fields:

- `reference`
- `descriptor` when already resolved

Field posture:

- packs may associate artifact meaning outside this repo
- the byte layer does not define artifact taxonomy, package lifecycle, or release semantics
- pack-level meaning must not be embedded into the byte-layer seam contract

## Phase 7 Support Surface

The current seam implementation is intentionally minimal:

- `createPlatformMaterializationSeam()` validates and normalizes the platform-facing byte result envelope
- `createPackByteBinding()` validates and normalizes the pack-facing byte binding envelope
- seam validators reject unsupported fields rather than teaching the byte layer platform or pack semantics

## Operational Hardening Contract

Operational controls remain byte-layer only:

- fetch, read, and materialization may accept `timeoutMs`
- fetch, read, and materialization may accept an abort `signal`
- timeout and abort do not redefine object identity or consumer ownership

Byte-layer operational failures use explicit byte-layer error codes:

- `ERR_OPERATION_ABORTED`
- `ERR_OPERATION_TIMEOUT`
- `ERR_DESCRIPTOR_MISSING`
- `ERR_DESCRIPTOR_UNAVAILABLE`
- `ERR_INVALID_DESCRIPTOR`
- `ERR_DESCRIPTOR_HASH_MISMATCH`
- `ERR_INTEGRITY_MISMATCH`
- `ERR_MATERIALIZATION_WRITE_FAILED`

Rules:

- partial fetch still means incomplete immutable replication or materialization only
- `ready` must not be reported after timeout, abort, descriptor failure, or integrity failure
- write failures remain byte-layer materialization failures and do not imply platform policy

## Phase 8 Support Surface

The current operational hardening implementation is intentionally minimal:

- local object reads honor optional timeout and abort controls
- Hyperswarm-backed fetch honors optional timeout and abort controls across discovery, update, and read
- explicit byte-layer error codes are exposed for common operational failures
- file materialization wraps destination write failures as byte-layer materialization errors

## Future Reference Families

Future keyed, path-based, or mutable backing stores may exist later.

If they are added:

- they should become distinct reference families
- they must not silently change the meaning of the base immutable `ByteReference`
- they must not overload index `0` in the base Hypercore family
