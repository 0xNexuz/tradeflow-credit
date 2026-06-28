# TradeFlow Credit

Polygon-native invoice finance frontend for UAE import/export SMEs.

## What is real

The funding console does not simulate transactions. It requires:

- a MetaMask-compatible wallet
- Polygon Amoy testnet
- `VITE_TRADEFLOW_CONTRACT_ADDRESS` configured to a deployed contract address

When those requirements are met, the console sends an actual `eth_sendTransaction`
request from the connected wallet.

## Contract

The MVP contract lives at:

```text
contracts/TradeFlowCredit.sol
```

It records invoice submission memo bytes, stores the submitter address, and emits
`InvoiceSubmitted`. The fallback function is intentional: the frontend can send
its current encoded invoice memo directly to the contract address without a
browser ABI dependency.

## Polygon Amoy

Polygon Amoy is the current Polygon PoS testnet.

- Chain ID: `80002`
- Hex chain ID used by wallets: `0x13882`
- Native test token: `POL`
- Explorer: `https://amoy.polygonscan.com/`
- RPC: `https://rpc-amoy.polygon.technology/`

To deploy, use a wallet you control and fund it from an Amoy faucet. After
deployment, set the deployed address in Vercel:

```bash
VITE_TRADEFLOW_CONTRACT_ADDRESS=0x...
```

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Environment

```bash
VITE_TRADEFLOW_CONTRACT_ADDRESS=0x...
```
