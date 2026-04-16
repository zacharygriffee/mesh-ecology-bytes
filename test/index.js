const { runContractTests } = require('./contracts')
const { runObjectModelTests } = require('./object-model')
const { runHyperswarmTransportTests } = require('./transport-hyperswarm')

async function main() {
  runContractTests()
  await runObjectModelTests()
  await runHyperswarmTransportTests()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
