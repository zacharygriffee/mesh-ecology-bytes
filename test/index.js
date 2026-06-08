import { runContractTests } from './contracts.js'
import { runConduitCorestoreReadbackTests } from './conduit-corestore-readback.js'
import { runIntegrationSeamTests } from './integration-seams.js'
import { runMaterializationRuntimeTests } from './materialization-runtime.js'
import { runObjectModelTests } from './object-model.js'
import { runOperationalHardeningTests } from './operational-hardening.js'
import { runPhase121AdjacentReviewEvidenceTests } from './phase-121-adjacent-review-evidence.js'
import { runParticipationDistributablePublicPathwayTests } from './participation-distributable-public-pathway.js'
import { runParticipationDistributablePublicSeederTests } from './participation-distributable-public-seeder.js'
import { runParticipationDistributableRetainedTests } from './participation-distributable-retained.js'
import { runRetentionTests } from './retention.js'
import { runHyperswarmTransportTests } from './transport-hyperswarm.js'
import { runInstallableParticipationBundlePublicSeederTests } from './installable-participation-bundle-public-seeder.js'

async function main() {
  runContractTests()
  runIntegrationSeamTests()
  runPhase121AdjacentReviewEvidenceTests()
  await runObjectModelTests()
  await runMaterializationRuntimeTests()
  await runOperationalHardeningTests()
  await runRetentionTests()
  await runHyperswarmTransportTests()
  await runConduitCorestoreReadbackTests()
  await runParticipationDistributableRetainedTests()
  await runParticipationDistributablePublicPathwayTests()
  await runParticipationDistributablePublicSeederTests()
  await runInstallableParticipationBundlePublicSeederTests()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
