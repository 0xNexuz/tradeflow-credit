import { readFileSync, writeFileSync } from 'node:fs'
import dotenv from 'dotenv'
import { ContractFactory, JsonRpcProvider, Wallet } from 'ethers'
import solc from 'solc'

dotenv.config({ path: '.env.deployer.local' })

const { DEPLOYER_PRIVATE_KEY, AMOY_RPC_URL = 'https://rpc-amoy.polygon.technology/' } =
  process.env

if (!DEPLOYER_PRIVATE_KEY) {
  throw new Error('Missing DEPLOYER_PRIVATE_KEY. Run npm run wallet:create first.')
}

const sourcePath = 'contracts/TradeFlowCredit.sol'
const source = readFileSync(sourcePath, 'utf8')

const input = {
  language: 'Solidity',
  sources: {
    [sourcePath]: { content: source },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object'],
      },
    },
  },
}

const output = JSON.parse(solc.compile(JSON.stringify(input)))
const errors = output.errors ?? []
const fatalErrors = errors.filter((error) => error.severity === 'error')

for (const error of errors) {
  console.error(error.formattedMessage)
}

if (fatalErrors.length > 0) {
  throw new Error('Contract compilation failed.')
}

const contract = output.contracts[sourcePath].TradeFlowCredit
const provider = new JsonRpcProvider(AMOY_RPC_URL)
const wallet = new Wallet(DEPLOYER_PRIVATE_KEY, provider)
const balance = await provider.getBalance(wallet.address)

console.log(`Deploying from: ${wallet.address}`)
console.log(`Balance: ${balance.toString()} wei`)

if (balance === 0n) {
  throw new Error('Deployer has no Amoy POL. Fund it from a faucet first.')
}

const factory = new ContractFactory(contract.abi, contract.evm.bytecode.object, wallet)
const deployment = await factory.deploy()

console.log(`Deployment tx: ${deployment.deploymentTransaction()?.hash}`)

await deployment.waitForDeployment()

const address = await deployment.getAddress()
const envContents = `VITE_TRADEFLOW_CONTRACT_ADDRESS=${address}\n`

writeFileSync('.env.local', envContents, 'utf8')

console.log(`TradeFlowCredit deployed: ${address}`)
console.log(`Explorer: https://amoy.polygonscan.com/address/${address}`)
console.log('Wrote .env.local for local frontend testing.')
