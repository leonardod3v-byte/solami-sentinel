export function fmtUsd(n: number): string {
    if (!Number.isFinite(n)) return '$0'
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
    return `$${n.toFixed(2)}`
}

export function fmtSol(n: number): string {
    if (!Number.isFinite(n)) return '0 SOL'
    if (n === 0) return '0 SOL'
    if (n < 0.001) return `${n.toExponential(2)} SOL`
    return `${n.toFixed(4)} SOL`
}

export function fmtNumber(n: number): string {
    return n.toLocaleString('en-US')
}

export function fmtCompact(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return n.toFixed(0)
}

export function shortSig(sig: string): string {
    if (sig.length <= 12) return sig
    return `${sig.slice(0, 6)}…${sig.slice(-6)}`
}

export function shortAddress(addr: string): string {
    if (addr.length <= 10) return addr
    return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}