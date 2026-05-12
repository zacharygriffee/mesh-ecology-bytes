# TODO

## Adjacent Tool Interop Alignment

- [x] Define the bytes-owned profile of the shared descriptor/request/receipt seam for Edge and other consumers.
  - Treat "local layer" as operator-facing explicit artifact interop: Edge may observe, inspect, prepare, or request bounded byte publication/materialization without owning byte transport or artifact meaning.
  - Cover descriptor-only metadata for:
    - byte publication capability
    - byte materialization capability
    - supported reference families
    - retention/materialization posture
  - Define request/receipt shapes for:
    - publish immutable byte object
    - materialize byte reference locally
    - report byte/reference status
  - Consider other bytes local-layer surfacable capabilities:
    - descriptor validation results
    - reference-family capability descriptors
    - materialization readiness/status
    - retention posture reports
  - Preserve that bytes owns byte references, publication, transport, materialization, lifecycle, and retention posture only.
  - Do not let Edge or any consumer infer artifact meaning, deployment state, platform placement, authority, or mesh concern semantics from byte availability.
  - Accept when: Edge can ask for byte publication/materialization through explicit artifacts and consume byte receipts without absorbing byte transport semantics.

## Deferred Future Features

- Add optional lookup and catalog support later.
  - Keep it separate from the base `hypercore_immutable` object contract.
  - Do not let lookup redefine immutable object identity or `ByteReference`.
  - A lightweight local catalog/index is the likely first step if lookup becomes necessary.

- Explore future `Hyperbee` support as a distinct keyed storage/reference family.
  - This requires additional repo work to support key lookup semantics on top of storage.
  - It should not silently change the meaning of the current immutable Hypercore reference family.
  - Index `0` descriptor-only posture for the base Hypercore family must remain unchanged.

- Explore future `Hyperdrive` support as a distinct path-based storage/reference family.
  - This also requires additional repo work for path/key lookup semantics and different materialization expectations.
  - It should remain separate from the current one-object-per-Hypercore model.

- If richer storage families are added later:
  - define them as separate reference families
  - define their own lookup and materialization contracts
  - keep the v1 immutable Hypercore family stable
