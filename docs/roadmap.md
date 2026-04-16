# Roadmap

## Phase 1: Lock The Byte Language

Phase 1 is doctrinal and contractual.

Define and lock:

- `ByteDescriptor`
- `ByteReference`
- `MaterializationHints`
- `MaterializationRequest`
- index `0` posture
- out-of-scope boundaries

Phase 1 assumptions now locked:

- byte objects are immutable by default
- the base `ByteReference` family is `hypercore_immutable`
- the base `ByteReference` points to one immutable object
- index `0` is reserved for the `ByteDescriptor` only
- `ByteDescriptor` has a minimal locked v1 shape
- `MaterializationHints` and `MaterializationRequest` have a locked boundary
- immutable-object completion and readiness vocabulary is defined
- future keyed or mutable stores are deferred and should likely use distinct reference families

## Phase 2: Build The Core Hypercore Model

Phase 2 is implementation-heavy and must follow Phase 1 exactly.

Build:

- single-writer Hypercore as the default substrate
- descriptor at index `0`
- payload in blocks `1..n`
- descriptor validation against the locked v1 shape
- reference validation against the `hypercore_immutable` family shape
- basic publish and fetch lifecycle for immutable objects
- local publish and local readback before transport integration

Phase 2 must not introduce:

- mutable-head semantics
- Hyperbee or Hyperdrive support
- broader catalog behavior

## Phase 3: Add Hyperswarm Transport

Phase 3 is implementation-heavy.

Add:

- Hyperswarm as the default transport and discovery layer
- minimal replication connection flow
- publish and fetch over Hyperswarm
- preserve the same immutable object layout and reference semantics as the local model

Guardrail:

- keep Hypercore byte semantics and transport concerns cleanly separated

## Phase 4: Materialization Model

Phase 4 is mostly contractual.

Clarify:

- stream, cache, and mirror modes
- placement classes as hints only
- consumer-owned placement resolution
- minimal helper semantics for stream and explicit-destination file materialization

Guardrail:

- bytes does not choose host-local paths

## Phase 5: Local Consumer Helpers

Phase 5 is implementation-heavy.

Add:

- fetch as stream
- fetch as buffer
- mirror to local target
- cache locally
- readiness and completion behavior for immutable objects

## Phase 6: Retention And Lifecycle Posture

Phase 6 is doctrinal and contractual.

Clarify:

- pinned vs ephemeral posture
- stale or replaced posture
- pruning expectations
- immutable object lifecycle expectations

Guardrail:

- do not backdoor policy or authority into retention vocabulary

Current implementation note:

- local retention inspection is implemented for immutable objects
- retention posture is derived from local lifecycle plus consumer-supplied `pinned` and `stale` facts
- deletion, pruning schedules, and ownership rules remain outside the byte layer

## Phase 7: Consumer Integration Seams

Phase 7 is doctrinal and seam-defining.

Clarify:

- what bytes owns
- what consumers own
- platform-facing materialization seam
- pack-facing artifact-byte seam

Guardrail:

- bytes stays byte-level and does not absorb platform behavior

Current implementation note:

- consumer seam contracts are now documented explicitly
- minimal helpers validate platform-facing materialization envelopes and pack-facing byte bindings
- seam helpers reject unsupported policy, deployment, or artifact-specific fields

## Phase 8: Operational Hardening

Phase 8 is implementation-heavy.

Add:

- timeout and cancellation where appropriate
- connection failure handling
- partial fetch handling under the narrow immutable-object definition
- integrity and readiness checks
- replication and materialization tests

## Phase 9: Optional Richer Indexing

Phase 9 is optional and deferred unless real need appears.

Possible later work:

- lightweight catalog or index
- richer lookup surfaces

Guardrails:

- keep Hypercore-first default
- multiwriter remains deferred unless a real use case proves necessary

## Phase 10: Advanced Transport And Ecosystem Extensions

Phase 10 is optional and deferred.

Possible later work:

- alternate transport adapters
- direct socket mode
- richer materialization policies
- advanced indexing exploration

Guardrail:

- these are extensions, not redefinitions of the v1 immutable byte contract
