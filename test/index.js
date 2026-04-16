const { runContractTests } = require('./contracts')
const { runMaterializationRuntimeTests } = require('./materialization-runtime')
const { runObjectModelTests } = require('./object-model')
const { runHyperswarmTransportTests } = require('./transport-hyperswarm')

async function main() {
  runContractTests()
  await runObjectModelTests()
  await runMaterializationRuntimeTests()
  await runHyperswarmTransportTests()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
