import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { formatDistanceToNow } from 'date-fns'
import { useWalletInspector } from '../../hooks/useWalletInspector'
import { useNow } from '../../hooks/useNow'
import { fmtSol, fmtUsd, shortAddress, shortSig } from '../../lib/format'
import { PanelSkeleton } from '../layout/Skeleton'

export function WalletPanel() {
    // Fuerza re-render cada 5s para refrescar los "hace Xs"
    useNow()

    const { connected, publicKey } = useWallet()
    const { data, isLoading, isError } = useWalletInspector()

    return (
        <section className="terminal-panel flex h-full flex-col overflow-hidden">
            <header className="flex items-center justify-between border-b border-term-border px-4 py-2">
                <h2 className="font-mono text-xs uppercase tracking-widest text-neon-cyan">
                    ▸ Wallet Inspector
                </h2>
                {data?.source === 'solami-blur' && (
                    <span className="rounded border border-neon-green px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-neon-green">
                        blur
                    </span>
                )}
                {data?.source === 'rpc' && (
                    <span className="font-mono text-[9px] uppercase tracking-wider text-text-dim">
                        rpc
                    </span>
                )}
            </header>

            <div className="flex-1 overflow-y-auto p-4">
                {!connected && (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                        <div className="font-mono text-xs text-text-dim">
                            connect a wallet to inspect balances
                        </div>
                        <WalletMultiButton
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--color-neon-cyan)',
                                color: 'var(--color-neon-cyan)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '11px',
                                height: '32px',
                                padding: '0 12px',
                                borderRadius: '4px',
                            }}
                        />
                    </div>
                )}

                {connected && isLoading && <PanelSkeleton rows={4} />}

                {connected && isError && (
                    <div className="py-8 text-center font-mono text-xs text-neon-red">
                        failed to load wallet data
                    </div>
                )}

                {connected && data && (
                    <div className="flex flex-col gap-4">
                        {/* Address + SOL */}
                        <div>
                            <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-text-dim">
                                {publicKey && shortAddress(publicKey.toBase58())}
                            </div>
                            <div className="font-mono text-2xl font-bold text-text-primary">
                                {fmtSol(data.sol)}
                            </div>
                            {data.solUsd > 0 && (
                                <div className="font-mono text-[10px] text-neon-green">
                                    ≈ {fmtUsd(data.solUsd)}
                                </div>
                            )}
                        </div>

                        {/* Tokens */}
                        <div>
                            <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
                                <span className="text-text-dim">tokens</span>
                                <span className="text-text-dim">
                                    {data.tokens.length}
                                </span>
                            </div>
                            {data.tokens.length === 0 ? (
                                <div className="font-mono text-[10px] text-text-dim">
                                    no SPL tokens
                                </div>
                            ) : (
                                <ul className="flex flex-col gap-1">
                                    {data.tokens.slice(0, 8).map((tok) => (
                                        <li
                                            key={tok.mint}
                                            className="flex items-center justify-between gap-2 border-l-2 border-l-term-border pl-2 font-mono text-[11px]"
                                        >
                                            <span className="truncate text-text-primary">
                                                {tok.symbol !== 'SPL'
                                                    ? tok.symbol
                                                    : shortAddress(tok.mint)}
                                            </span>
                                            <span className="shrink-0 text-text-dim">
                                                {tok.amount.toLocaleString('en-US', {
                                                    maximumFractionDigits: 4,
                                                })}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Historial */}
                        <div>
                            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-text-dim">
                                recent activity
                            </div>
                            {data.recentSignatures.length === 0 ? (
                                <div className="font-mono text-[10px] text-text-dim">
                                    no transactions
                                </div>
                            ) : (
                                <ul className="flex flex-col gap-1">
                                    {data.recentSignatures.map((tx) => (
                                        <li
                                            key={tx.signature}
                                            className="flex items-center justify-between gap-2 border-l-2 pl-2 font-mono text-[11px]"
                                            style={{
                                                borderLeftColor:
                                                    tx.status === 'success'
                                                        ? 'var(--color-neon-green)'
                                                        : 'var(--color-neon-red)',
                                            }}
                                        >
                                            <a
                                                href={`https://solscan.io/tx/${tx.signature}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="truncate text-text-primary hover:text-neon-cyan"
                                            >
                                                {shortSig(tx.signature)}
                                            </a>
                                            <span className="shrink-0 text-[10px] text-text-dim">
                                                {tx.blockTime
                                                    ? formatDistanceToNow(tx.blockTime * 1000, {
                                                        addSuffix: true,
                                                    })
                                                    : '—'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}