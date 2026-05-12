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

## Adjacent Tool Interop Profile

Edge and other adjacent tools may use the bytes-owned interop profile as an explicit artifact seam.

The profile may describe only byte-layer capabilities:

- `bytePublication`
- `byteMaterialization`
- `referenceFamilies`
- `descriptorValidation`
- `materializationPosture`
- `retentionPosture`

The profile must not describe:

- artifact meaning
- deployment state
- platform placement
- authority or policy
- mesh concern semantics

## Adjacent Tool Requests

The validated adjacent-tool request may contain one operation:

- `publish_immutable_object`
- `materialize_byte_reference`
- `report_byte_status`

Publication requests contain:

- `descriptor`
- `bytes`

Materialization requests contain:

- `reference`
- `request`
- `destination` only when the consumer supplies a local destination for `cache` or `mirror`

Status requests contain:

- `reference`
- `includeDescriptor`

## Adjacent Tool Receipts

The validated adjacent-tool receipt may contain:

- `operation`
- `status`
- `reference`
- `descriptor`
- `lifecycle`
- `retention`
- `plan`
- `destination`
- `bytesWritten`
- `error`

Receipt statuses are:

- `complete`
- `ready`
- `failed`

Receipts remain byte-layer reports. They do not imply deployment, activation, platform ownership, release state, or artifact taxonomy.

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
