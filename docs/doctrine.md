# Doctrine

## Repo Identity

`mesh-ecology-bytes` is a byte transport and materialization provider layer.

It is responsible for:

- publishing byte objects
- returning stable byte references
- letting consumers fetch, stream, cache, or mirror bytes
- exposing safe descriptor metadata and materialization hints

It is not responsible for:

- defining artifact meaning
- defining authority or policy
- defining mesh concern semantics
- executing workflows
- deploying or activating artifacts
- acting as a runtime or scheduler
- choosing host-local filesystem paths

## Core Posture

- Hypercore is the default byte substrate.
- Hyperswarm is the default transport and discovery layer.
- Transport remains adapter-shaped and must not redefine byte semantics.
- Local placement is consumer-owned.
- Descriptor metadata must remain safe to share and must not contain secrets.

## Immutable Object Model

V1 byte objects are immutable.

- A published byte object represents one immutable payload.
- A base `ByteReference` in the `hypercore_immutable` family identifies one immutable byte object.
- If new data arises, the publisher creates a new byte object, a new Hypercore, and a new reference.
- V1 does not introduce mutable-head semantics into the base `ByteReference`.

## Storage Posture

For the default Hypercore-backed model:

- index `0` is reserved for the `ByteDescriptor`
- blocks `1..n` contain payload data

Index `0` is descriptor-only in v1.

- Do not overload index `0` with mutable head semantics.
- Do not overload index `0` with version negotiation semantics.
- Do not overload index `0` with catalog semantics.

If richer manifest or catalog behavior is needed later, it belongs in a higher or different reference family, not in the base immutable Hypercore reference contract.

## Descriptor And Request Boundary

- `ByteDescriptor` is publication-side metadata for one immutable object.
- `MaterializationHints` travel with the descriptor and remain advisory.
- `MaterializationRequest` is consumer-local and may override hints locally.
- Final placement and readiness interpretation remain consumer-owned.

## Partial Fetch Posture

In v1, partial fetch has a narrow meaning:

- partial fetch means incomplete replication or incomplete materialization of one immutable byte object

It does not yet mean:

- arbitrary byte-range APIs
- keyed or path-based slicing
- mutable-head reads
- generalized partial object semantics

## Deferred Expansion

Future Hyperbee or Hyperdrive support is acknowledged, but deferred.

- keyed or path-based stores may be introduced later
- mutable backing stores may be introduced later
- if added, they should likely become distinct reference families
- they must not change the meaning of the base immutable `ByteReference`
