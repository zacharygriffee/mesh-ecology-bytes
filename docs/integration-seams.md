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
