import { useNetworkHealth } from '../../hooks/useNetworkHealth'
import { fmtCompact, fmtNumber } from '../../lib/format'
import { PriorityFeeCard } from './PriorityFeeCard'
import { PanelSkeleton } from '../layout/Skeleton'

const CONGESTION_COLOR: Record<string, string> = {
    low: 'var(--color-neon-green)',
    medium: 'var(--color-neon-cyan)',
    high: 'var(--color-neon-amber)',
    extreme: 'var(--color-neon-red)',
}

const CONGESTION_WIDTH: Record<string, string> = {
    low: '25%',
    medium: '50%',
    high: '75%',
    extreme: '100%',
}

export function NetworkPanel() {
    const { data, isLoading, isError } = useNetworkHealth()

    return (
        <section className="terminal-panel flex h-full flex-col overflow-hidden">
            <header className="flex items-center justify-between border-b border-term-border px-4 py-2">
                <h2 className="font-mono text-xs uppercase tracking-widest text-neon-cyan">
                    ▸ Network Health
                </h2>
                {data && (
                    <span className="font-mono text-[10px] text-text-dim">
                        tps: {fmtNumber(data.tps)}
                    </span>
                )}
            </header>

            <div className="flex-1 overflow-y-auto p-3">
                {isLoading && <PanelSkeleton rows={3} />}

                {isError && (
                    <div className="py-8 text-center font-mono text-xs text-neon-red">
                        rpc unavailable
                    </div>
                )}

                {data && (
                    <div className="flex flex-col gap-3">
                        {/* Congestión */}
                        <div>
                            <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
                                <span className="text-text-dim">congestion</span>
                                <span style={{ color: CONGESTION_COLOR[data.congestion] }}>
                                    {data.congestion}
                                </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-term-border">
                                <div
                                    className="h-full transition-all duration-500"
                                    style={{
                                        width: CONGESTION_WIDTH[data.congestion],
                                        backgroundColor: CONGESTION_COLOR[data.congestion],
                                        boxShadow: `0 0 8px ${CONGESTION_COLOR[data.congestion]}`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Priority Fees Grid */}
                        <div>
                            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-text-dim">
                                priority fee calculator
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <PriorityFeeCard
                                    tier="Low"
                                    microLamports={data.priorityFees.low}
                                    accent="var(--color-neon-cyan)"
                                    hint="~p25"
                                />
                                <PriorityFeeCard
                                    tier="Medium"
                                    microLamports={data.priorityFees.medium}
                                    accent="var(--color-neon-green)"
                                    hint="~p50"
                                />
                                <PriorityFeeCard
                                    tier="High"
                                    microLamports={data.priorityFees.high}
                                    accent="var(--color-neon-amber)"
                                    hint="~p75"
                                />
                                <PriorityFeeCard
                                    tier="Turbo"
                                    microLamports={data.priorityFees.turbo}
                                    accent="var(--color-neon-red)"
                                    hint="~p95 · 1.5x"
                                />
                            </div>
                        </div>

                        {/* Métricas inferiores */}
                        <div className="grid grid-cols-2 gap-3 border-t border-term-border pt-3 font-mono text-[10px]">
                            <div>
                                <div className="text-text-dim">slot time</div>
                                <div className="text-text-primary">
                                    {data.avgSlotTimeMs} ms
                                </div>
                            </div>
                            <div>
                                <div className="text-text-dim">slots / sec</div>
                                <div className="text-text-primary">
                                    {data.slotsPerSecond.toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <div className="text-text-dim">tps</div>
                                <div className="text-text-primary">
                                    {fmtCompact(data.tps)}
                                </div>
                            </div>
                            <div>
                                <div className="text-text-dim">slot</div>
                                <div className="text-text-primary">
                                    {fmtNumber(data.slot)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}