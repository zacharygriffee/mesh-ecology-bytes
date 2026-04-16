# Decision Log

## 2026-04-15

### Immutable Byte Object Posture

Status: locked

- v1 byte objects are immutable
- a base `ByteReference` identifies one immutable byte object
- new data means a new byte object, a new Hypercore, and a new reference
- mutable-head semantics are not part of the base v1 reference contract

### ByteDescriptor Shape

Status: locked

- required fields are `contentType`, `size`, `encoding` or `framing`, and `materializationHints`
- optional fields are `integrityHint`, `role`, and `logicalId`
- the descriptor describes one immutable object only
- the descriptor must remain safe to share

### ByteReference Shape

Status: locked

- the base v1 family is `hypercore_immutable`
- required fields are `family` and `key`
- optional fields are `descriptorHash` and `integrityHint`
- v1 does not include a `version` field
- the base reference points to one immutable object only

### Hypercore Default Storage Posture

Status: locked

- single-writer Hypercore is the v1 default substrate
- index `0` is reserved for the `ByteDescriptor`
- blocks `1..n` hold payload
- Hyperswarm is the default transport and discovery layer
- transport remains adapter-shaped

### Index 0 Descriptor-Only Posture

Status: locked

- index `0` contains the safe immutable `ByteDescriptor`
- index `0` must not be overloaded with mutable manifest semantics
- index `0` must not be overloaded with head or version semantics
- richer manifest or catalog behavior, if needed later, belongs to a higher or different reference family

### Partial Fetch Definition

Status: locked

- partial fetch means incomplete replication or incomplete materialization of one immutable object
- partial fetch does not yet include arbitrary byte-range semantics
- partial fetch does not yet include mutable progressive read semantics

### Materialization Boundary And Readiness

Status: locked

- `MaterializationHints` travel with the descriptor and remain advisory
- `MaterializationRequest` is consumer-local and may override hints
- bytes validates shape but does not arbitrate conflicts
- lifecycle vocabulary is `fetched`, `complete`, `materialized`, `ready`

### Retention And Lifecycle Posture

Status: locked

- retention posture is local to the consumer and does not change object identity
- `pinned` means the local immutable copy should be retained
- `ephemeral` means the local immutable copy is not pinned
- `stale` means the local consumer considers the immutable object superseded, but the reference remains valid
- `prunable` is a local eligibility signal for unpinned copies, not a pruning policy

### Consumer Integration Seams

Status: locked

- bytes owns byte-level publication, retrieval, materialization forms, lifecycle, and retention posture
- platform consumers own placement, overwrite policy, cleanup policy, and activation meaning
- pack consumers may attach artifact meaning outside this repo, but bytes does not define that meaning
- seam helpers validate only byte-layer envelopes and reject unsupported platform or pack fields

### Future Keyed Or Mutable Stores

Status: acknowledged and deferred

- Hyperbee or Hyperdrive style stores may be relevant later
- if introduced, they should likely become distinct reference families
- they must not redefine the v1 immutable `ByteReference`
