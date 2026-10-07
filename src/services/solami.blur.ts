import { SOLAMI_CONFIG } from '../config/solami.config'
import type { TokenBalance, WalletSnapshot } from './solami.types'

const DATA_BASE = 'https://api.solami.dev'

/**
 * Wrapper para fetch a Blur REST.
 * Auth: header Authorization Bearer <apiKey>.
 * Chain: siempre ?chain=solana.
 */
async function blurFetch<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    const searchParams = new URLSearchParams({
        chain: 'solana',
        ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    })
    const url = `${DATA_BASE}${path}?${searchParams.toString()}`

    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(SOLAMI_CONFIG.apiKey ? { Authorization: `Bearer ${SOLAMI_CONFIG.apiKey}` } : {}),
        },
    })

    if (!res.ok) {
        const errorBody = await res.text().catch(() => '')
        throw new Error(`Blur API ${res.status}: ${path} — ${errorBody.slice(0, 200)}`)
    }

    return res.json() as Promise<T>
}

// ---------- Token metadata ----------

export interface BlurTokenMetadata {
    chain: string
    address: string
    name: string
    symbol: string
    decimals: number
    uri: string | null
    supply: number
    image: string | null
    description: string | null
    socials: Record<string, string | null>
    is_metadata_mutable: boolean
}

export async function fetchTokenMetadata(mint: string): Promise<BlurTokenMetadata | null> {
    try {
        const result = await blurFetch<BlurTokenMetadata[]>('/data/token/metadata', { address: mint })
        return result[0] ?? null
    } catch (err) {
        console.warn('[solami.blur] fetchTokenMetadata failed:', err)
        return null
    }
}

// ---------- Wallet balance ----------

interface BlurWalletBalanceResponse {
    chain: string
    wallet: string
    sol: {
        amount: string
        decimals: number
        ui_amount: number
        value_usd: number | null
    }
    tokens: Array<{
        mint: string
        token_account: string
        amount: string
        program: string
        decimals: number
        ui_amount: number
        symbol?: string
        name?: string
        uri?: string
    }>
}

export async function fetchWalletSnapshot(address: string): Promise<WalletSnapshot> {
    try {
        const data = await blurFetch<BlurWalletBalanceResponse>('/data/wallet/balance', { address })

        const tokens: TokenBalance[] = data.tokens
            .filter((t) => t.ui_amount > 0)
            .sort((a, b) => b.ui_amount - a.ui_amount)
            .slice(0, 20)
            .map((t) => ({
                mint: t.mint,
                symbol: t.symbol ?? 'SPL',
                name: t.name,
                amount: t.ui_amount,
                decimals: t.decimals,
            }))

        // Enriquecer con metadata los primeros 5 (para no saturar)
        const topTokens = await Promise.all(
            tokens.slice(0, 5).map(async (t) => {
                if (t.symbol !== 'SPL') return t
                const meta = await fetchTokenMetadata(t.mint)
                return meta
                    ? { ...t, symbol: meta.symbol, name: meta.name, imageUrl: meta.image ?? undefined }
                    : t
            })
        )

        const enrichedTokens = [...topTokens, ...tokens.slice(5)]

        return {
            sol: data.sol.ui_amount,
            solUsd: data.sol.value_usd ?? 0,
            tokens: enrichedTokens,
            recentSignatures: [], // TODO: usar getSignaturesForAddress como fallback
            source: 'solami-blur',
        }
    } catch (err) {
        console.warn('[solami.blur] fetchWalletSnapshot failed, using RPC fallback:', err)
        throw err // deja que el caller haga fallback
    }
}

// ---------- Wallet history (si Blur lo expone) ----------

export interface BlurTransaction {
    signature: string
    slot: number
    block_time: number
    err: unknown | null
    memo: string | null
}

export async function fetchWalletHistory(
    _address: string,
    _limit = 10
): Promise<BlurTransaction[]> {
    return []
}