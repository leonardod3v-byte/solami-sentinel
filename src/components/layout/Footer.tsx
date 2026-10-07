interface FooterLink {
    label: string
    href: string
    accent?: 'cyan' | 'green' | 'amber'
}

const LINK_GROUPS: { title: string; links: FooterLink[] }[] = [
    {
        title: 'event',
        links: [
            {
                label: 'Crypto World\u2019s Fair',
                href: 'https://solami.dev',
                accent: 'cyan',
            },
            { label: 'Solami Sidetrack', href: 'https://solami.dev', accent: 'cyan' },
        ],
    },
    {
        title: 'resources',
        links: [
            { label: 'Solami Docs', href: 'https://solami.dev/docs' },
            { label: 'Solana Docs', href: 'https://solana.com/docs' },
            { label: 'web3.js', href: 'https://github.com/solana-foundation/solana-web3.js' },
            { label: 'Wallet Adapter', href: 'https://github.com/anza-xyz/wallet-adapter' },
        ],
    },
    {
        title: 'explorers',
        links: [
            { label: 'Solscan', href: 'https://solscan.io' },
            { label: 'Solana Explorer', href: 'https://explorer.solana.com' },
            { label: 'Birdeye', href: 'https://birdeye.so' },
            { label: 'DexScreener', href: 'https://dexscreener.com/solana' },
        ],
    },
    {
        title: 'dex',
        links: [
            { label: 'Raydium', href: 'https://raydium.io' },
            { label: 'Meteora', href: 'https://meteora.ag' },
            { label: 'Orca', href: 'https://orca.so' },
            { label: 'Jupiter', href: 'https://jup.ag' },
        ],
    },
]

const ACCENT_VAR: Record<NonNullable<FooterLink['accent']>, string> = {
    cyan: 'var(--color-neon-cyan)',
    green: 'var(--color-neon-green)',
    amber: 'var(--color-neon-amber)',
}

export function Footer() {
    const year = new Date().getFullYear()

    return (
        <footer className="border-t border-term-border bg-term-panel/60 px-6 py-6">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {LINK_GROUPS.map((group) => (
                    <div key={group.title}>
                        <h3 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-text-dim">
                            {group.title}
                        </h3>
                        <ul className="flex flex-col gap-1">
                            {group.links.map((link) => (
                                <li key={link.href + link.label}>
                                    <a
                                        href={link.href}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        className="font-mono text-[11px] text-text-primary transition-colors hover:text-neon-cyan"
                                        style={
                                            link.accent
                                                ? { color: ACCENT_VAR[link.accent] }
                                                : undefined
                                        }
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex flex-col items-start justify-between gap-2 border-t border-term-border pt-4 font-mono text-[10px] text-text-dim md:flex-row md:items-center">
                <span>
                    <span className="text-neon-cyan">SOLAMI</span>{' '}
                    SENTINEL · v0.1 · {year}
                </span>
                <span>
                    built for the Crypto World&apos;s Fair hackathon · powered by{' '}
                    <span className="text-neon-green">Solami</span>
                </span>
            </div>
        </footer>
    )
}