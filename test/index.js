import { runContractTests } from './contracts.js'
import { runIntegrationSeamTests } from './integration-seams.js'
import { runMaterializationRuntimeTests } from './materialization-runtime.js'
import { runObjectModelTests } from './object-model.js'
import { runOperationalHardeningTests } from './operational-hardening.js'
import { runRetentionTests } from './retention.js'
import { runHyperswarmTransportTests } from './transport-hyperswarm.js'

async function main() {
  runContractTests()
  runIntegrationSeamTests()
  await runObjectModelTests()
  await runMaterializationRuntimeTests()
  await runOperationalHardeningTests()
  await runRetentionTests()
  await runHyperswarmTransportTests()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
