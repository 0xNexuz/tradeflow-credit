# TradeFlow Credit

Polygon-native invoice finance frontend for UAE import/export SMEs.

## What is real

The funding console does not simulate transactions. It requires:

- a MetaMask-compatible wallet
- Polygon Amoy testnet
- `VITE_TRADEFLOW_CONTRACT_ADDRESS` configured to a deployed contract address

When those requirements are met, the console sends an actual `eth_sendTransaction`
request from the connected wallet.

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
