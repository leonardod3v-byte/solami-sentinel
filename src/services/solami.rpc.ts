import { Connection, type Commitment } from '@solana/web3.js'
import {
    SOLAMI_CONFIG,
    withSolamiKey,
    isHeliusConfigured,
} from '../config/solami.config'

let connection: Connection | null = null
let usingFallback = false
let probeAttempted = false

function buildConnection(endpoint: string): Connection {
    return new Connection(endpoint, {
        commitment: SOLAMI_CONFIG.commitment as Commitment,
        confirmTransactionInitialTimeout: 60_000,
    })
}

/**
 * Devuelve la Connection activa:
 * - Primero intenta Solami RPC (con ?api_key= inyectado).
 * - Si el probe falla, cae a Helius RPC.
 * - Si Helius tampoco está configurado, se queda con Solami igual
 *   (para que el error salga explícito en consola).
 */
export function getSolamiConnection(): Connection {
    if (connection) return connection

    connection = buildConnection(withSolamiKey(SOLAMI_CONFIG.rpcUrl))

    if (!probeAttempted) {
        probeAttempted = true
        void probeAndFallback()
    }

    return connection
}

async function probeAndFallback(): Promise<void> {
    if (!connection) return
    try {
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('probe timeout')), 4_000)
        )
        await Promise.race([connection.getSlot(), timeout])
        console.info('[solami.rpc] Solami RPC healthy ✓')
    } catch (err) {
        if (!isHeliusConfigured()) {
            console.error('[solami.rpc] Solami RPC failed and no Helius fallback configured')
            return
        }
        console.warn('[solami.rpc] Solami RPC unreachable → falling back to Helius')
        usingFallback = true
        connection = buildConnection(SOLAMI_CONFIG.heliusRpcUrl)
    }
}

export function forceRpcFallback(): void {
    if (!isHeliusConfigured()) return
    usingFallback = true
    connection = buildConnection(SOLAMI_CONFIG.heliusRpcUrl)
}

export function isUsingRpcFallback(): boolean {
    return usingFallback
}

export function resetSolamiConnection(): void {
    connection = null
    usingFallback = false
    probeAttempted = false
}