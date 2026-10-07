interface PriorityFeeCardProps {
    tier: 'Low' | 'Medium' | 'High' | 'Turbo'
    microLamports: number
    accent: string // css var
    hint: string
}

function fmtMicroLamports(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return `${n.toFixed(0)}`
}

export function PriorityFeeCard({
    tier,
    microLamports,
    accent,
    hint,
}: PriorityFeeCardProps) {
    return (
        <div className="terminal-panel flex flex-col gap-1 p-3">
            <div
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: accent }}
            >
                {tier}
            </div>
            <div className="font-mono text-lg font-bold text-[var(--color-text-primary)]">
                {fmtMicroLamports(microLamports)}
            </div>
            <div className="font-mono text-[9px] text-[var(--color-text-dim)]">
                µLamports · {hint}
            </div>
        </div>
    )
}