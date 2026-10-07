// ---------- DEXs soportados ----------
export type DexName =
    | 'raydium'
    | 'raydium_clmm'
    | 'orca_whirlpool'
    | 'meteora_dlmm'
    | 'meteora_pools'
    | 'pumpswap'
    | 'Unknown'

// ---------- Blur event types ----------
export type BlurEventType =
    | 'connected'
    | 'swap'
    | 'liquidity'
    | 'token_create'
    | 'pool_create'
    | 'transfer'
    | 'candle'
    | 'stats'
    | 'meme'
    | 'graduation'
    | 'surge'
    | 'radar'
    | 'trending'
    | 'metadata'

export interface BlurBaseEvent {
    type: BlurEventType
    signature?: string
    slot?: number
    block_time?: number
}

export interface BlurConnectedEvent {
    type: 'connected'
    region: string
    filter: {
        types: string[]
        mints: number
        pools: number
        traders: number
        dexes: string[]
        side: string | null
        min_base: number | null
        min_quote: number | null
        min_volume_usd: number | null
    }
}

export interface BlurLiquidityEvent extends BlurBaseEvent {
    type: 'liquidity'
    signature: string
    slot: number
    block_time: number
    tx_index: number
    ix_index: number
    inner_ix_index: number
    dex: DexName
    pool: string
    kind: 'add' | 'remove'
    provider: string
    base_mint: string
    quote_mint: string
    base_amount: number
    quote_amount: number
    base_decimals: number
    quote_decimals: number
    base_reserve: number
    quote_reserve: number
    base_usd: string      // ⚠️ string
    quote_usd: string     // ⚠️ string
    indexed_at: number
}

export interface BlurTokenCreateEvent extends BlurBaseEvent {
    type: 'token_create'
    signature: string
    slot: number
    block_time: number
    mint: string
    name?: string
    symbol?: string
    decimals?: number
    uri?: string
    creator?: string
    // otros campos que varían según DEX
    [key: string]: unknown
}

export interface BlurPoolCreateEvent extends BlurBaseEvent {
    type: 'pool_create'
    signature: string
    slot: number
    block_time: number
    dex: DexName
    pool: string
    base_mint: string
    quote_mint: string
    base_decimals?: number
    quote_decimals?: number
    initial_liquidity_usd?: string
    [key: string]: unknown
}

export interface BlurMetadataEvent {
    type: 'metadata'
    mint: string
    name?: string
    symbol?: string
    decimals?: number
    uri?: string | null
    image_url?: string
    logo_uri?: string
    description?: string
    socials?: Record<string, string | null>
    resolved_at?: number
    catchup?: boolean
}

export type BlurEvent =
    | BlurConnectedEvent
    | BlurLiquidityEvent
    | BlurTokenCreateEvent
    | BlurPoolCreateEvent
    | BlurMetadataEvent
    | (BlurBaseEvent & { type: BlurEventType;[key: string]: unknown })

// ---------- Evento normalizado para el feed del Radar ----------
export type AlertLevel = 'stable' | 'watch' | 'critical'

export interface PoolEvent {
    id: string
    signature: string
    tokenMint: string
    tokenSymbol: string
    tokenName?: string
    dex: string
    poolAddress: string
    initialLiquidityUsd: number
    currentLiquidityUsd: number
    liquidityDeltaPct: number
    timestamp: number
    alertLevel: AlertLevel
    kind?: 'create' | 'add' | 'remove'
    imageUrl?: string
}

// ---------- Slots ----------
export interface SlotTick {
    slot: number
    timestamp: number
}

// ---------- Subscriptions ----------
export interface Subscription {
    id: number
    unsubscribe: () => void
}

// ---------- Network Health ----------
export interface NetworkHealth {
    slot: number
    tps: number
    avgSlotTimeMs: number
    slotsPerSecond: number
    congestion: 'low' | 'medium' | 'high' | 'extreme'
    priorityFees: {
        low: number
        medium: number
        high: number
        turbo: number
    }
    updatedAt: number
}

// ---------- Wallet ----------
export interface TokenBalance {
    mint: string
    symbol: string
    name?: string
    amount: number
    decimals: number
    usd?: number
    imageUrl?: string
}

export interface RecentSignature {
    signature: string
    blockTime: number | null
    status: 'success' | 'failed'
    memo?: string
}

export interface WalletSnapshot {
    sol: number
    solUsd: number
    tokens: TokenBalance[]
    recentSignatures: RecentSignature[]
    source: 'solami-blur' | 'rpc'
}