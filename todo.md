# TODO

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
