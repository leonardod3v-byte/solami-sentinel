import React, { useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  NightlyWalletAdapter,
} from '@solana/wallet-adapter-wallets'

import '@solana/wallet-adapter-react-ui/styles.css'
import './styles/globals.css'

import { SOLAMI_CONFIG } from './config/solami.config'
import { useSolamiWs } from './hooks/useSolamiWs'
import { useNetworkHealth } from './hooks/useNetworkHealth'
import { useLatestSlot } from './hooks/useLatestSlot'
import { useSentinelStore } from './store/sentinel.store'
import { StatusLed } from './components/layout/StatusLed'
import { Footer } from './components/layout/Footer'
import { PoolFeed } from './components/radar/PoolFeed'
import { NetworkPanel } from './components/network/NetworkPanel'
import { WalletPanel } from './components/wallet/WalletPanel'

// ---------- React Query ----------

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// ---------- Dashboard ----------

function DashboardShell() {
  // Conecta el singleton WS al store. Una sola vez.
  useSolamiWs()

  // Estado del feed
  const wsConnected = useSentinelStore((s) => s.wsConnected)
  const wsMode = useSentinelStore((s) => s.wsMode)
  const { data: latestSlot = 0 } = useLatestSlot()

  // Estado real del RPC (para el LED)
  const { isSuccess: rpcOk, isError: rpcError } = useNetworkHealth()

  const rpcLedColor = rpcError ? 'red' : 'cyan'

  return (
    <div className="grid-bg flex min-h-screen w-full flex-col">
      {/* ---------- HEADER ---------- */}
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-term-border bg-term-bg/90 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-4">
          <h1 className="font-mono text-lg font-bold tracking-widest">
            <span className="text-neon-cyan">SOLAMI</span>{' '}
            <span className="text-text-primary">SENTINEL</span>
          </h1>
          <span className="hidden rounded border border-term-border px-2 py-0.5 font-mono text-[10px] text-text-dim sm:inline-block">
            v0.1 · MAINNET
          </span>
          <span className="hidden font-mono text-[10px] text-text-dim md:inline-block">
            slot #{latestSlot.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <StatusLed
            active={wsConnected}
            label={wsMode === 'mock' ? 'WS (mock)' : 'WS/Blur'}
            color={wsMode === 'mock' ? 'amber' : 'green'}
          />
          <StatusLed active={rpcOk} label="RPC" color={rpcLedColor} />
          <WalletMultiButton
            style={{
              background: 'transparent',
              border: '1px solid var(--color-term-border)',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              height: '32px',
              padding: '0 12px',
              borderRadius: '4px',
            }}
          />
        </div>
      </header>

      {/* ---------- MAIN ---------- */}
      <main className="w-full flex-1 overflow-hidden">
        <div className="grid h-[calc(100vh-160px)] w-full grid-cols-1 gap-3 p-3 lg:grid-cols-12">
          <div className="lg:col-span-5 h-full overflow-hidden">
            <PoolFeed />
          </div>
          <div className="lg:col-span-4 h-full overflow-hidden">
            <NetworkPanel />
          </div>
          <div className="lg:col-span-3 h-full overflow-hidden">
            <WalletPanel />
          </div>
        </div>
      </main>

      {/* ---------- FOOTER ---------- */}
      <Footer />
    </div>
  )
}

// ---------- Root con providers ----------

function Root() {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new NightlyWalletAdapter()],
    []
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={SOLAMI_CONFIG.rpcUrl}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <DashboardShell />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  )
}

// ---------- Mount ----------

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)