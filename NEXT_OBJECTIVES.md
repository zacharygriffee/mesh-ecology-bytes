# Next Objectives

Status: lane guide, not a fixed task list. Bytes owns byte/resource retention,
source availability, seeder evidence, readback, and cleanup. Bytes does not own
Packs verification truth, Platform activation, dependency acquisition
permission, production durability, or authority.

## Current Pressure: Layer Bundle Public Seeder Complete, Conduit Reach Next

Bytes retained and seeded the Packs target-aware tar-compatible installable
bundle for `mesh-ecology-layer` over default public HyperDHT/Hyperswarm for
the current real repo-family component chain.

Current proof:

```text
proofRef: bytes-installable-bundle-public-seeder:3407bc7c7ab1515f
proofHash: sha256:3407bc7c7ab1515f47e6452e5fc5e547a4b9c65de6ff7ca6b5baa556204b4e7c
readbackRef: bytes-installable-bundle-public-seeder-readback:50dd1ccab5fca37d
readbackHash: sha256:50dd1ccab5fca37dcb480ea80667e35e7c4a39cd303e7b6a7952278e576659d4
byteReferenceKey: 95969cebe584b9ac0a2f1f8d7a870875852afe74fee3ab0698d6c4388bf29894
topic: c50d3880c7c64aacc62608b5cd819bd2d42ec71b427b2d69808b85530bc1f1d6
downRef: bytes-installable-bundle-public-seeder-down:166f1136594b5e39
proofRung: hyperswarm_discovered_feed_backed
componentTarget: mesh-ecology-layer
```

Command:

```sh
npm run proof:installable-participation-bundle-public-seeder -- up \
  --packs-proof ../mesh-ecology-packs/proof-artifacts/layer-installable-participation-bundle-20260608T150000Z/proof.json \
  --archive ../mesh-ecology-packs/proof-artifacts/layer-installable-participation-bundle-20260608T150000Z/installable-participation-bundle.tar \
  --storage runtime/layer-installable-bundle-public-seeder-20260608T151000Z/storage \
  --output proof-artifacts/layer-installable-bundle-public-seeder-20260608T151000Z/proof.json \
  --readback-output proof-artifacts/layer-installable-bundle-public-seeder-20260608T151000Z/readback.json \
  --pid-file proof-artifacts/layer-installable-bundle-public-seeder-20260608T151000Z/pid.json \
  --public-hyperdht
```

Cleanup command:

```sh
npm run proof:installable-participation-bundle-public-seeder -- down \
  --pid-file proof-artifacts/layer-installable-bundle-public-seeder-20260608T151000Z/pid.json \
  --proof proof-artifacts/layer-installable-bundle-public-seeder-20260608T151000Z/proof.json \
  --output proof-artifacts/layer-installable-bundle-public-seeder-20260608T151000Z/down.json
```

Next posture: Conduit should consume this Bytes seeder proof read-only and emit
Layer-bundle distribution reach/readback without claiming Packs verification
truth, byte custody, Platform activation, workflow integration, RBC governance,
or authority.

Boundary posture:

- Bytes public seeding is byte reach, not Packs verification truth.
- Bytes does not authorize Platform activation or dependency acquisition.
- Node modules copy and external registry fetches are not decentralized
  dependency proof.
