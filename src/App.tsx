import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BanknoteArrowUp,
  Blocks,
  Check,
  CircleAlert,
  CircleDollarSign,
  FileCheck2,
  Landmark,
  LockKeyhole,
  Network,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Upload,
  Wallet,
} from 'lucide-react'
import './App.css'

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

const AMOY_CHAIN_ID = '0x13882'
const CONTRACT_ADDRESS = import.meta.env.VITE_TRADEFLOW_CONTRACT_ADDRESS as
  | string
  | undefined

const marketStats = [
  ['USD 2.5T', 'global trade finance gap, ADB 2025'],
  ['41%', 'SME trade finance applications rejected'],
  ['USD 3.3B', 'estimated UAE unmet demand'],
  ['15.5M', 'Jebel Ali annual TEUs handled'],
]

const sources = [
  {
    label: 'ADB Global Trade Finance Gap Survey 2025',
    href: 'https://www.tralac.org/documents/news/7229-adb-global-trade-finance-gap-survey-december-2025.html',
  },
  {
    label: 'GTR report on ADB 2025 SME rejection rate',
    href: 'https://www.gtreview.com/news/global/trade-finance-gap-stabilises-at-us2-5tn/',
  },
  {
    label: 'DP World 2024 Jebel Ali cargo volumes',
    href: 'https://www.dpworld.com/en/news/dp-world-records-highest-cargo-volumes-at-jebel-ali-port-since-2015',
  },
]

const features = [
  {
    icon: ReceiptText,
    title: 'Tokenized receivables',
    body: 'Invoices become financeable Polygon records with debtor, due date, value, and repayment terms attached.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified trade context',
    body: 'KYC, invoice hashes, bill of lading references, and counterparty attestations are separated from the public record.',
  },
  {
    icon: CircleDollarSign,
    title: 'Stablecoin lender pools',
    body: 'Capital providers fund accepted invoices in USDC with transparent principal, yield, and settlement logic.',
  },
  {
    icon: FileCheck2,
    title: 'Smart letters of credit',
    body: 'Milestones release capital only after agreed proofs are submitted and signed by the required parties.',
  },
]

const workflow = [
  'Upload invoice metadata and off-chain document hashes',
  'Request credit terms from verified stablecoin lenders',
  'Sign funding agreement and submit the Polygon transaction',
  'Repay from export proceeds with auditable settlement history',
]

const useCases = [
  'Importers bridging cash tied up between shipment and resale',
  'Exporters financing receivables from approved overseas buyers',
  'Trade lenders underwriting SMEs with repeatable on-chain evidence',
]

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function encodeInvoiceMemo(amount: string, debtor: string, dueDate: string) {
  const memo = `TradeFlow invoice request | amount=${amount} | debtor=${debtor} | due=${dueDate}`
  return `0x${Array.from(new TextEncoder().encode(memo))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')}`
}

function App() {
  const [account, setAccount] = useState('')
  const [chainId, setChainId] = useState('')
  const [amount, setAmount] = useState('25000')
  const [debtor, setDebtor] = useState('Jebel Ali distributor')
  const [dueDate, setDueDate] = useState('2026-09-30')
  const [txHash, setTxHash] = useState('')
  const [status, setStatus] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const chainReady = chainId === AMOY_CHAIN_ID
  const canSubmit = Boolean(account && chainReady && CONTRACT_ADDRESS)

  const readiness = useMemo(
    () => [
      {
        label: account ? `Wallet ${shortAddress(account)}` : 'Wallet not connected',
        ok: Boolean(account),
      },
      {
        label: chainReady ? 'Polygon Amoy active' : 'Switch to Polygon Amoy',
        ok: chainReady,
      },
      {
        label: CONTRACT_ADDRESS
          ? `Contract ${shortAddress(CONTRACT_ADDRESS)}`
          : 'Contract address not configured',
        ok: Boolean(CONTRACT_ADDRESS),
      },
    ],
    [account, chainReady],
  )

  async function connectWallet() {
    if (!window.ethereum) {
      setStatus('Install a MetaMask-compatible wallet to connect.')
      return
    }

    setIsBusy(true)
    setStatus('Opening wallet...')
    try {
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[]
      const activeChain = (await window.ethereum.request({
        method: 'eth_chainId',
      })) as string
      setAccount(accounts[0] ?? '')
      setChainId(activeChain)
      setStatus('Wallet connected.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Wallet connection was rejected.')
    } finally {
      setIsBusy(false)
    }
  }

  function disconnectWallet() {
    setAccount('')
    setChainId('')
    setTxHash('')
    setStatus('Wallet disconnected locally. To revoke site access, disconnect it inside your wallet.')
  }

  async function switchNetwork() {
    if (!window.ethereum) {
      setStatus('Install a MetaMask-compatible wallet first.')
      return
    }

    setIsBusy(true)
    setStatus('Requesting Polygon Amoy...')
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: AMOY_CHAIN_ID }],
      })
      setChainId(AMOY_CHAIN_ID)
      setStatus('Polygon Amoy is active.')
    } catch {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: AMOY_CHAIN_ID,
            chainName: 'Polygon Amoy',
            nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
            rpcUrls: ['https://rpc-amoy.polygon.technology/'],
            blockExplorerUrls: ['https://amoy.polygonscan.com/'],
          },
        ],
      })
      setChainId(AMOY_CHAIN_ID)
      setStatus('Polygon Amoy was added.')
    } finally {
      setIsBusy(false)
    }
  }

  async function submitInvoice() {
    if (!window.ethereum || !account || !CONTRACT_ADDRESS) {
      setStatus('Connect a wallet and configure VITE_TRADEFLOW_CONTRACT_ADDRESS first.')
      return
    }
    if (!chainReady) {
      setStatus('Switch to Polygon Amoy before submitting.')
      return
    }

    setIsBusy(true)
    setTxHash('')
    setStatus('Waiting for wallet signature...')
    try {
      const hash = (await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: account,
            to: CONTRACT_ADDRESS,
            value: '0x0',
            data: encodeInvoiceMemo(amount, debtor, dueDate),
          },
        ],
      })) as string
      setTxHash(hash)
      setStatus('Transaction submitted to Polygon Amoy.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Transaction was not submitted.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <main>
      <nav className="nav" aria-label="Primary">
        <a className="brand" href="#top" aria-label="TradeFlow Credit home">
          <img className="brandMark" src="/tradeflow-logo.svg" alt="" />
          TradeFlow Credit
        </a>
        <div className="navLinks">
          <a href="#product">Product</a>
          <a href="#rail">Rail</a>
          <a href="#submit">Submit</a>
        </div>
        <button
          className="iconButton"
          type="button"
          onClick={account ? disconnectWallet : connectWallet}
          disabled={isBusy}
          title={account ? 'Disconnect wallet locally' : 'Connect wallet'}
        >
          <Wallet size={18} />
          {account ? 'Disconnect' : 'Connect'}
        </button>
      </nav>

      <section className="hero section" id="top">
        <div className="heroBackdrop" aria-hidden="true">
          <div className="orbital orbitalOne" />
          <div className="orbital orbitalTwo" />
          <div className="ledgerPlane">
            {marketStats.map(([value, label]) => (
              <div className="ledgerTile" key={value}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="heroCopy">
          <p className="eyebrow">Polygon-native SME invoice finance</p>
          <h1>Finance UAE trade invoices without fake settlement.</h1>
          <p>
            TradeFlow Credit records receivables on Polygon for auditable stablecoin funding.
          </p>
          <div className="heroActions">
            <a className="primaryCta" href="#submit">
              Open funding console <ArrowRight size={18} />
            </a>
            <a className="ghostCta" href="#rail">
              Inspect the rail
            </a>
          </div>
        </div>
      </section>

      <section className="proofStrip" aria-label="Market proof">
        {marketStats.map(([value, label]) => (
          <div key={value}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section className="section split" id="product">
        <div>
          <p className="eyebrow">Why this wins the challenge</p>
          <h2>Infrastructure for the pain Polygon Labs named first.</h2>
        </div>
        <div className="featureGrid">
          {features.map(({ icon: Icon, title, body }) => (
            <article className="featureCard" key={title}>
              <Icon size={22} />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section consoleSection" id="submit">
        <div className="consoleIntro">
          <p className="eyebrow">Live transaction console</p>
          <h2>No simulated transactions. Wallet or nothing.</h2>
          <p>
            This panel submits an actual wallet transaction to the configured TradeFlow
            contract on Polygon Amoy. Without a wallet, correct network, and contract address,
            it blocks the action instead of pretending.
          </p>
          <div className="readinessList">
            {readiness.map((item) => (
              <span className={item.ok ? 'ready' : 'notReady'} key={item.label}>
                {item.ok ? <Check size={16} /> : <CircleAlert size={16} />}
                {item.label}
              </span>
            ))}
          </div>
        </div>
        <form className="fundingConsole" onSubmit={(event) => event.preventDefault()}>
          <label>
            Invoice value in USDC
            <input value={amount} onChange={(event) => setAmount(event.target.value)} />
          </label>
          <label>
            Debtor / buyer reference
            <input value={debtor} onChange={(event) => setDebtor(event.target.value)} />
          </label>
          <label>
            Due date
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </label>
          <div className="consoleButtons">
            <button
              type="button"
              onClick={account ? disconnectWallet : connectWallet}
              disabled={isBusy}
            >
              <Wallet size={17} />
              {account ? 'Disconnect wallet' : 'Connect wallet'}
            </button>
            <button type="button" onClick={switchNetwork} disabled={isBusy || !account}>
              <Network size={17} />
              Polygon Amoy
            </button>
            <button className="submitButton" type="button" onClick={submitInvoice} disabled={isBusy || !canSubmit}>
              <Upload size={17} />
              Submit on-chain
            </button>
          </div>
          <p className="statusLine">{status || 'Ready for a real wallet connection.'}</p>
          {txHash && (
            <a className="txLink" href={`https://amoy.polygonscan.com/tx/${txHash}`} target="_blank">
              View transaction <ArrowRight size={15} />
            </a>
          )}
        </form>
      </section>

      <section className="section rail" id="rail">
        <div className="railVisual" aria-hidden="true">
          {workflow.map((item, index) => (
            <div className="railNode" key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="eyebrow">Architecture</p>
          <h2>Off-chain proof, on-chain commitment.</h2>
          <p>
            Sensitive trade documents stay private. Their hashes, financing terms, approvals,
            and repayment obligations move through Polygon so every actor sees the same
            settlement truth.
          </p>
        </div>
      </section>

      <section className="section useCases">
        <div className="sideNote">01 / DIFC launch wedge</div>
        <div>
          <p className="eyebrow">Focused MVP</p>
          <h2>Start with import/export SMEs, then expand lender depth.</h2>
        </div>
        <div className="caseStack">
          {useCases.map((item) => (
            <article key={item}>
              <BadgeCheck size={20} />
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section security">
        <div className="securityCard">
          <LockKeyhole size={28} />
          <h2>Built for compliance-first stablecoin adoption.</h2>
          <p>
            The product positions UAE regulation as an advantage: verified participants,
            policy-aware transaction states, and auditable settlement events.
          </p>
        </div>
        <div className="securityList">
          <span><Landmark size={18} /> Institution-ready roles</span>
          <span><Blocks size={18} /> Polygon settlement records</span>
          <span><BanknoteArrowUp size={18} /> USDC funding path</span>
          <span><Sparkles size={18} /> Challenge-ready MVP scope</span>
        </div>
      </section>

      <section className="section sourcesSection">
        <div>
          <p className="eyebrow">Fact base</p>
          <h2>Numbers are sourced, not decoration.</h2>
        </div>
        <div className="sourceLinks">
          {sources.map((source) => (
            <a href={source.href} target="_blank" key={source.href}>
              {source.label} <ArrowRight size={15} />
            </a>
          ))}
        </div>
      </section>

      <section className="section finalCta">
        <p className="eyebrow">TradeFlow Credit</p>
        <h2>Turn receivables into a credible funding rail.</h2>
        <a className="primaryCta" href="#submit">
          Try the wallet console <ArrowRight size={18} />
        </a>
      </section>

      <footer className="siteFooter">
        <div>
          <a className="footerBrand" href="#top" aria-label="TradeFlow Credit home">
            <img className="brandMark" src="/tradeflow-logo.svg" alt="" />
            TradeFlow Credit
          </a>
          <p>Proof-backed trade finance. No phantom rails.</p>
        </div>
        <div className="footerLinks" aria-label="Footer links">
          <a href="https://github.com/0xNexuz/tradeflow-credit#readme" target="_blank">
            Docs <ArrowRight size={14} />
          </a>
          <a href="https://github.com/0xNexuz/tradeflow-credit" target="_blank">
            GitHub <ArrowRight size={14} />
          </a>
        </div>
      </footer>
    </main>
  )
}

export default App
