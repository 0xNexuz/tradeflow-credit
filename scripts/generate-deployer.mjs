import { existsSync, writeFileSync } from 'node:fs'
import { Wallet } from 'ethers'

const envPath = '.env.deployer.local'

if (existsSync(envPath)) {
  throw new Error(`${envPath} already exists. Move it first if you want a new deployer.`)
}

const wallet = Wallet.createRandom()

const contents = [
  '# Local testnet deployer. Do not commit this file.',
  `DEPLOYER_ADDRESS=${wallet.address}`,
  `DEPLOYER_PRIVATE_KEY=${wallet.privateKey}`,
  'AMOY_RPC_URL=https://rpc-amoy.polygon.technology/',
  '',
].join('\n')

writeFileSync(envPath, contents, { encoding: 'utf8', flag: 'wx' })

console.log('Temporary Amoy deployer generated.')
console.log(`Address to fund: ${wallet.address}`)
console.log(`Private key saved locally in ${envPath}`)
