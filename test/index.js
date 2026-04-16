const { runContractTests } = require('./contracts')
const { runMaterializationRuntimeTests } = require('./materialization-runtime')
const { runObjectModelTests } = require('./object-model')
const { runRetentionTests } = require('./retention')
const { runHyperswarmTransportTests } = require('./transport-hyperswarm')

async function main() {
  runContractTests()
  await runObjectModelTests()
  await runMaterializationRuntimeTests()
  await runRetentionTests()
  await runHyperswarmTransportTests()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
