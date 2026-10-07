const env = import.meta.env

function readEnv(key: string, fallback?: string): string {
    const value = env[key] as string | undefined
    if (!value && !fallback) {
        console.warn(`[solami.config] Missing env var: ${key}`)
    }
    return value ?? fallback ?? ''
}

export const SOLAMI_CONFIG = {
    // --- Solami ---
    apiKey: readEnv('VITE_SOLAMI_API_KEY'),
    rpcUrl: readEnv('VITE_SOLAMI_RPC_URL', 'https://rpc.solami.dev/sol'),
    wsUrl: readEnv('VITE_SOLAMI_WS_URL', 'wss://ws.solami.dev/ws/sol'),

    // --- Helius (fallback) ---
    heliusRpcUrl: readEnv('VITE_HELIUS_RPC_URL'),
    heliusWsUrl: readEnv('VITE_HELIUS_WS_URL'),

    // --- Runtime ---
    useMock: env.VITE_USE_MOCK === 'true',
    commitment: 'confirmed' as const,
} as const

/**
 * Añade ?api_key=... a una URL de Solami.
 * Si no hay API key, devuelve la URL tal cual.
 * Si la URL ya tiene query params, usa & en vez de ?.
 */
export function withSolamiKey(url: string): string {
    if (!SOLAMI_CONFIG.apiKey) return url
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}api_key=${encodeURIComponent(SOLAMI_CONFIG.apiKey)}`
}

/**
 * Añade ?api_key=... a una URL de Helius.
 * Solo aplica si la URL de Helius está configurada y no la tiene ya.
 */
export function withHeliusKey(url: string): string {
    if (!SOLAMI_CONFIG.heliusRpcUrl) return url
    const key = extractApiKey(SOLAMI_CONFIG.heliusRpcUrl)
    if (!key || url.includes('api-key=')) return url
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}api-key=${encodeURIComponent(key)}`
}

/** Extrae el valor de ?api-key=... de una URL de Helius */
function extractApiKey(url: string): string | null {
    try {
        const u = new URL(url)
        return u.searchParams.get('api-key')
    } catch {
        return null
    }
}

/**
 * ¿Tenemos credenciales reales de Solami?
 * Si no, forzamos mock aunque el env diga lo contrario.
 */
export function shouldUseMock(): boolean {
    return SOLAMI_CONFIG.useMock || !SOLAMI_CONFIG.apiKey
}

export const isSolamiConfigured = (): boolean => Boolean(SOLAMI_CONFIG.apiKey)
export const isHeliusConfigured = (): boolean =>
    Boolean(SOLAMI_CONFIG.heliusRpcUrl)