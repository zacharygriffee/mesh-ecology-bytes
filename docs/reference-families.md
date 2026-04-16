# Reference Families

## Base V1 Family

The base v1 reference family is `hypercore_immutable`.

Its posture is:

- one reference identifies one immutable object
- the default backing store is single-writer Hypercore
- index `0` is descriptor-only
- payload lives in blocks `1..n`

This base family is intentionally narrow.

It does not include:

- mutable-head semantics
- keyed lookup semantics
- path-based object addressing
- catalog semantics

## Deferred Future Families

If later storage families are added, they should likely be modeled as distinct families rather than as silent extensions of the base immutable reference.

Examples of future families that may warrant separate contracts:

- keyed object families
- path-based object families
- mutable collection or head-based families
- richer catalog-backed families

## Contract Guardrail

Future family expansion must not:

- change the meaning of the base immutable `ByteReference`
- overload index `0` in the base Hypercore family
- introduce mutable semantics into the base v1 contract by accident
