// src/components/radar/PoolFeed.tsx

import { formatDistanceToNow } from 'date-fns'
import { useSentinelStore } from '../../store/sentinel.store'
import { useNow } from '../../hooks/useNow'
import { PanelSkeleton } from '../layout/Skeleton'
import type { AlertLevel, PoolEvent } from '../../services/solami.types'

const ALERT_BORDER: Record<AlertLevel, string> = {
    stable: 'border-l-[var(--color-neon-green)]',
    watch: 'border-l-[var(--color-neon-amber)]',
    critical: 'border-l-[var(--color-neon-red)]',
}

const ALERT_TEXT: Record<AlertLevel, string> = {
    stable: 'text-[var(--color-neon-green)]',
    watch: 'text-[var(--color-neon-amber)]',
    critical: 'text-[var(--color-neon-red)]',
}

function fmtUsd(n: number): string {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
    return `$${n.toFixed(0)}`
}

function PoolRow({ evt }: { evt: PoolEvent }) {
    const deltaPositive = evt.liquidityDeltaPct >= 0
    const deltaLabel = `${deltaPositive ? '+' : ''}${evt.liquidityDeltaPct.toFixed(1)}%`

    return (
        <li
            className={`border-l-2 ${ALERT_BORDER[evt.alertLevel]} px-4 py-2 font-mono text-xs transition-colors hover:bg-white/5`}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="truncate font-semibold text-text-primary">
                    {evt.tokenSymbol}
                </span>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-text-dim">
                    {evt.dex}
                </span>
            </div>

            <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-text-dim">
                    liq:{' '}
                    <span className="text-text-primary">
                        {fmtUsd(evt.currentLiquidityUsd)}
                    </span>{' '}
                    <span
                        className={
                            deltaPositive
                                ? 'text-neon-green'
                                : 'text-neon-red'
                        }
                    >
                        ({deltaLabel})
                    </span>
                </span>

                <span className="shrink-0 text-[10px] text-text-dim">
                    {formatDistanceToNow(evt.timestamp, { addSuffix: true })}
                </span>
            </div>

            {evt.alertLevel === 'critical' && (
                <div
                    className={`mt-1 text-[10px] uppercase tracking-widest ${ALERT_TEXT.critical}`}
                >
                    ⚠ liquidity drop detected
                </div>
            )}
        </li>
    )
}

export function PoolFeed() {
    // Fuerza re-render cada 5s para refrescar los "hace Xs"
    useNow()

    const feed = useSentinelStore((s) => s.poolFeed)
    const wsMode = useSentinelStore((s) => s.wsMode)

    return (
        <section className="terminal-panel flex h-full flex-col overflow-hidden">
            <header className="flex items-center justify-between border-b border-term-border px-4 py-2">
                <div className="flex items-center gap-3">
                    <h2 className="font-mono text-xs uppercase tracking-widest text-neon-cyan">
                        ▸ Liquidity Radar
                    </h2>
                    {wsMode === 'mock' ? (
                        <span className="rounded border border-neon-amber px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-neon-amber">
                            mock
                        </span>
                    ) : (
                        <span className="rounded border border-neon-green px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-neon-green">
                            blur live
                        </span>
                    )}
                </div>
                <span className="font-mono text-[10px] text-text-dim">
                    {feed.length} event{feed.length === 1 ? '' : 's'}
                </span>
            </header>

            <div className="flex-1 overflow-y-auto">
                {feed.length === 0 ? (
                    <PanelSkeleton rows={5} />
                ) : (
                    <ul className="divide-y divide-term-border">
                        {feed.map((evt) => (
                            <PoolRow key={evt.id} evt={evt} />
                        ))}
                    </ul>
                )}
            </div>
        </section>
    )
}