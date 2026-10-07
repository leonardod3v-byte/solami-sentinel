import { Connection, PublicKey } from '@solana/web3.js'
import { SOLAMI_CONFIG, isHeliusConfigured } from '../config/solami.config'
import { getSolamiConnection } from './solami.rpc'
import {
    fetchWalletSnapshot as fetchWalletBlur,
    fetchWalletHistory,
} from './solami.blur'
import type {
    NetworkHealth,
    TokenBalance,
    WalletSnapshot,
    RecentSignature,
} from './solami.types'

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

// ---------- Network Health ----------

export async function fetchNetworkHealth(): Promise<NetworkHealth> {
    const conn = getSolamiConnection()

    let [samples, fees] = await Promise.all([
        conn.getRecentPerformanceSamples(10).catch(() => []),
        conn.getRecentPrioritizationFees().catch(() => []),
        conn.getSlot().catch(() => 0),
    ])

    const samplesHaveData = samples.some((s) => s.numTransactions > 0)
    if (!samplesHaveData && isHeliusConfigured()) {
        try {
            const heliusConn = new Connection(SOLAMI_CONFIG.heliusRpcUrl, 'confirmed')
            const [hSamples, hFees] = await Promise.all([
                heliusConn.getRecentPerformanceSamples(10),
                heliusConn.getRecentPrioritizationFees(),
            ])
            if (hSamples.some((s) => s.numTransactions > 0)) {
                samples = hSamples
            }
            if (hFees.length > 0 && fees.length === 0) {
                fees = hFees
            }
        } catch (err) {
            console.warn('[solami.data] Helius fallback for performance samples failed:', err)
        }
    }

    // ---------- Wallet Snapshot ----------

    export async function fetchWalletSnapshot(address: string): Promise<WalletSnapshot> {
        // Intentar Blur primero (datos enriquecidos: nombres, símbolos, logos)
        try {
            const blurSnapshot = await fetchWalletBlur(address)

            // Intentar agregar historial de transacciones de Blur
            const history = await fetchWalletHistory(address, 5)

            if (history.length > 0) {
                blurSnapshot.recentSignatures = history.map((tx) => ({
                    signature: tx.signature,
                    blockTime: tx.block_time,
                    status: tx.err ? 'failed' : 'success',
                    memo: tx.memo ?? undefined,
                }))
            } else {
                // Fallback a RPC para historial si Blur no trae txs
                const conn = getSolamiConnection()
                const pubkey = new PublicKey(address)
                const sigs = await conn
                    .getSignaturesForAddress(pubkey, { limit: 5 })
                    .catch(() => [])
                blurSnapshot.recentSignatures = sigs.map((s) => ({
                    signature: s.signature,
                    blockTime: s.blockTime ?? null,
                    status: s.err ? 'failed' : 'success',
                    memo: s.memo ?? undefined,
                }))
            }

            return blurSnapshot
        } catch (err) {
            console.warn('[solami.data] Blur failed, using RPC fallback:', err)

            // Fallback RPC puro
            const pubkey = new PublicKey(address)
            const conn = getSolamiConnection()

            const [lamports, sigs, parsedTokens] = await Promise.all([
                conn.getBalance(pubkey).catch(() => 0),
                conn.getSignaturesForAddress(pubkey, { limit: 5 }).catch(() => []),
                conn
                    .getParsedTokenAccountsByOwner(pubkey, { programId: TOKEN_PROGRAM_ID })
                    .catch(() => ({ value: [] as any[] })),
            ])

            const tokens: TokenBalance[] = parsedTokens.value
                .map((acc: any) => {
                    const info = acc.account.data?.parsed?.info
                    const amount = info?.tokenAmount
                    return {
                        mint: info?.mint as string,
                        symbol: 'SPL',
                        amount: Number(amount?.uiAmount ?? 0),
                        decimals: Number(amount?.decimals ?? 0),
                    }
                })
                .filter((t: TokenBalance) => t.amount > 0)
                .sort((a: TokenBalance, b: TokenBalance) => b.amount - a.amount)
                .slice(0, 20)

            const recentSignatures: RecentSignature[] = sigs.map((s: any) => ({
                signature: s.signature,
                blockTime: s.blockTime ?? null,
                status: s.err ? 'failed' : 'success',
                memo: s.memo ?? undefined,
            }))

            return {
                sol: lamports / 1e9,
                solUsd: 0,
                tokens,
                recentSignatures,
                source: 'rpc',
            }
        }
    }