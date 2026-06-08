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
proofRef: bytes-installable-bundle-public-seeder:1e55d9c8fb21a82c
proofHash: sha256:1e55d9c8fb21a82c96b3368192c1518878ad9a753aca16347f86efe010bc0f5f
readbackRef: bytes-installable-bundle-public-seeder-readback:823c140ea2824677
readbackHash: sha256:823c140ea28246778eb7c69172f4bc9289395ffbca920d5cab2cbd572beee4fd
byteReferenceKey: c44e86cac33312b0328f65cac3684e682235ebf8e6df3b96101647369f07a08e
topic: f968ba8f9d616ac5d5bad7537ca859e3e3f49c2e74a9bc4d9e29473e6b0dd416
downRef: bytes-installable-bundle-public-seeder-down:3d0de10f58264cdb
proofRung: hyperswarm_discovered_feed_backed
componentTarget: mesh-ecology-layer
```

Command:

```sh
npm run proof:installable-participation-bundle-public-seeder -- up \
  --packs-proof ../mesh-ecology-packs/proof-artifacts/layer-installable-participation-bundle-20260608T150000Z/proof.json \
  --archive ../mesh-ecology-packs/proof-artifacts/layer-installable-participation-bundle-20260608T150000Z/installable-participation-bundle.tar \
  --storage runtime/layer-installable-bundle-public-seeder-20260608T153000Z/storage \
  --output proof-artifacts/layer-installable-bundle-public-seeder-20260608T153000Z/proof.json \
  --readback-output proof-artifacts/layer-installable-bundle-public-seeder-20260608T153000Z/readback.json \
  --pid-file proof-artifacts/layer-installable-bundle-public-seeder-20260608T153000Z/pid.json \
  --public-hyperdht
```

Cleanup command:

```sh
npm run proof:installable-participation-bundle-public-seeder -- down \
  --pid-file proof-artifacts/layer-installable-bundle-public-seeder-20260608T153000Z/pid.json \
  --proof proof-artifacts/layer-installable-bundle-public-seeder-20260608T153000Z/proof.json \
  --output proof-artifacts/layer-installable-bundle-public-seeder-20260608T153000Z/down.json
```

Next posture: Conduit consumed this Bytes seeder proof read-only and emitted
Layer-bundle distribution reach/readback. Platform then used the live source for
public-swarm materialization and human-mediated Layer bundle activation. Bytes
should wait unless a future Platform or Conduit consumer needs stronger
retention/liveness evidence.

Boundary posture:

- Bytes public seeding is byte reach, not Packs verification truth.
- Bytes does not authorize Platform activation or dependency acquisition.
- Node modules copy and external registry fetches are not decentralized
  dependency proof.
