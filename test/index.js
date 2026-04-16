const { runContractTests } = require('./contracts')
const { runObjectModelTests } = require('./object-model')

async function main() {
  runContractTests()
  await runObjectModelTests()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
