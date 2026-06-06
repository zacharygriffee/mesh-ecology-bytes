# Integration Seams

## Purpose

Phase 7 defines how consumers use `mesh-ecology-bytes` without expanding the repo into platform or pack logic.

## Byte Layer Owns

- immutable byte publication
- immutable byte references
- retrieval and replication
- byte-level materialization forms
- lifecycle and readiness reporting
- retention posture reporting

## Platform Owns

- destination and path choice
- overwrite rules
- filesystem ownership expectations
- cleanup policy
- activation or deployment meaning

## Packs Own

- artifact meaning
- package taxonomy
- release semantics
- any higher-level mapping between artifacts and byte references

## Platform-Facing Envelope

The validated platform-facing envelope may contain:

- `reference`
- `descriptor`
- `lifecycle`
- `retention`
- `plan`
- `destination`
- `bytesWritten`

It must not contain:

- deployment state
- activation state
- cleanup schedule
- concern semantics

## Pack-Facing Binding

The validated pack-facing binding may contain:

- `reference`
- `descriptor`

It must not contain:

- artifact taxonomy
- package policy
- release workflow data

## Conduit Corestore Readback Proof

Bytes may emit `mesh-ecology-bytes/corestore-readback-proof@1` for Conduit to
consume as read-only distribution posture evidence.

The proof contains:

- a Bytes-owned Corestore/Hypercore readback fixture
- a Conduit-compatible immutable byte reference projection
- the expected payload hash
- readback evidence from Bytes
- optional Bytes-owned Corestore availability evidence
- retained proof metadata

The proof must not contain raw payload bytes, host placement, activation,
deployment state, canon claims, acceptance claims, or any claim that Conduit
published, fetched, pinned, stored, or materialized bytes.

Generate a local proof artifact with:

```sh
npm run proof:conduit-corestore-readback -- --out /tmp/bytes-corestore-proof.json
npm run proof:conduit-corestore-availability-readback -- --out /tmp/bytes-corestore-availability-proof.json
npm run proof:conduit-corestore-replicated-readback -- --out /tmp/bytes-corestore-replicated-proof.json
npm run proof:conduit-corestore-retained-readback -- --out /tmp/bytes-corestore-retained-proof.json
```

Conduit may route and receipt the reference/posture over `blob.stream`,
`observe.stream`, and capability-gated `control.stream`, but Bytes remains the
owner of byte publication and readback mechanics.

The availability proof emits `mesh-ecology-bytes/corestore-availability-evidence@1`
from Bytes. It proves local Corestore descriptor/payload block readback posture
for the fixture reference and expected hash. It does not claim family canon,
acceptance, public network availability, device-boundary availability, or any
Conduit publish/fetch/pin/store/materialization operation.

The replicated proof uses `readbackTopology:
"local_two_store_hyperswarm_testnet_readback"` to show Bytes-owned publication
from one local store, local Hyperswarm testnet fetch into a separate local
store, and consumer-store readback after fetch. This is local transport evidence
only; it is not a public swarm availability claim and not a device-boundary
proof.

The retained proof uses `readbackTopology: "retained_store_process_readback"` to
show Bytes-owned proof-window seed posture. Bytes closes the publisher store,
then a separate Node process reopens and reads the store. This proves retained
store readback for the proof window only; it must not be read as indefinite
seeding, canon authority, or acceptance.

## Phase 121 Adjacent Review Fixture

Bytes may consume the Edge Phase 120 Bytes adjacent review packet as a copied static fixture at:

- `test/fixtures/edge/phase-120-bytes-adjacent-review-packet-fixture.json`

This fixture is review input only. It is not a bytes schema, command, TODO, runtime request, or acceptance signal.

Bytes emits review evidence with:

- `schema: "mesh-ecology-bytes/adjacent-review-evidence@1"`
- `artifactKind: "bytes_owned_adjacent_review_evidence"`
- `phase: 121`

The Phase 121 evidence preserves Edge packet refs, checklist IDs, guardrail IDs, expected response shape refs, and the stop/go result as inert correlation refs.

The Phase 121 helper must not call Edge, fetch the fixture at runtime, publish bytes, store bytes, pin bytes, replicate bytes, fetch bytes, run discovery, schedule work, or publish to the mesh.

Packet presence alone must not create adjacent acceptance.
