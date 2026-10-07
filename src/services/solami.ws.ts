import ReconnectingWebSocket, { type Options } from 'reconnecting-websocket'
import { SOLAMI_CONFIG, shouldUseMock } from '../config/solami.config'
import type {
    BlurEvent,
    BlurLiquidityEvent,
    BlurMetadataEvent,
    BlurPoolCreateEvent,
    BlurTokenCreateEvent,
    PoolEvent,
    SlotTick,
    Subscription,
} from './solami.types'
import { mockPoolEvent, mockSlotTick, resetMockState } from './solami.mock'

type Listener<T> = (payload: T) => void

const MOCK_POOL_INTERVAL_MS = 2500
const MOCK_SLOT_INTERVAL_MS = 400

// Tipos de eventos que queremos del stream de Blur
const SUBSCRIBED_TYPES = ['pool_create', 'liquidity', 'token_create']

export class SolamiWsClient {
    private ws: ReconnectingWebSocket | null = null
    private reqId = 0

    private poolListeners = new Set<Listener<PoolEvent>>()
    private slotListeners = new Set<Listener<SlotTick>>()
    private rawListeners = new Set<Listener<BlurEvent>>()

    private mockPoolTimer: ReturnType<typeof setInterval> | null = null
    private mockSlotTimer: ReturnType<typeof setInterval> | null = null

    private running = false
    private mode: 'blur' | 'mock' = 'mock'
    private failCount = 0

    // Estado del feed: guardamos pools por mint para calcular delta
    private poolState = new Map<string, {
        initialLiquidityUsd: number
        currentLiquidityUsd: number
        tokenMint: string
        tokenSymbol: string
        poolAddress: string
        dex: string
    }>()

    // ---------- lifecycle ----------

    connect(): void {
        if (this.running) return
        this.running = true

        if (shouldUseMock()) {
            this.startMock()
            return
        }
        this.startBlur()
    }

    disconnect(): void {
        this.running = false
        this.stopMock()
        this.ws?.close()
        this.ws = null
        this.failCount = 0
    }

    // ---------- subscriptions ----------

    onPoolEvent(fn: Listener<PoolEvent>): Subscription {
        this.poolListeners.add(fn)
        return { id: ++this.reqId, unsubscribe: () => this.poolListeners.delete(fn) }
    }

    onSlot(fn: Listener<SlotTick>): Subscription {
        this.slotListeners.add(fn)
        return { id: ++this.reqId, unsubscribe: () => this.slotListeners.delete(fn) }
    }

    onRawBlurEvent(fn: Listener<BlurEvent>): Subscription {
        this.rawListeners.add(fn)
        return { id: ++this.reqId, unsubscribe: () => this.rawListeners.delete(fn) }
    }

    // ---------- status ----------

    isConnected(): boolean {
        if (this.mode === 'mock') return this.running
        return this.ws?.readyState === WebSocket.OPEN
    }

    getMode(): 'blur' | 'mock' {
        return this.mode
    }

    // ---------- real Blur WS ----------

    private startBlur(): void {
        this.mode = 'blur'
        this.failCount = 0

        const typeParam = SUBSCRIBED_TYPES.join(',')
        const url = `wss://ws.solami.dev/data/subscribe?chain=solana&api_key=${encodeURIComponent(
            SOLAMI_CONFIG.apiKey
        )}&type=${typeParam}`

        console.info('[solami.ws] connecting to Blur →', url.replace(SOLAMI_CONFIG.apiKey, '***'))

        const opts: Options = {
            maxRetries: 5,
            minReconnectionDelay: 1_000,
            maxReconnectionDelay: 8_000,
            reconnectionDelayGrowFactor: 1.5,
            connectionTimeout: 8_000,
        }

        this.ws = new ReconnectingWebSocket(url, [], opts)

        this.ws.addEventListener('open', () => {
            console.info('[solami.ws] Blur connected ✓')
            this.failCount = 0
        })

        this.ws.addEventListener('close', (ev) => {
            console.warn(`[solami.ws] Blur closed — code: ${ev.code}`)
            // Códigos específicos de Blur
            if (ev.code === 1008 || ev.code === 4002) {
                console.error('[solami.ws] Blur rejected — check key scopes (DataApi + streaming bandwidth)')
            }
        })

        this.ws.addEventListener('error', () => {
            this.failCount += 1
            console.error(`[solami.ws] Blur error (${this.failCount}/5)`)
            if (this.failCount >= 5) {
                console.warn('[solami.ws] 5 fallos → cayendo a MOCK')
                this.disconnect()
                this.startMock()
            }
        })

        this.ws.addEventListener('message', (ev) => this.handleBlurMessage(ev))
    }

    private handleBlurMessage(ev: MessageEvent): void {
        let data: BlurEvent
        try {
            data = JSON.parse(ev.data as string)
        } catch {
            return
        }

        // Emitir evento raw a quien lo escuche
        this.rawListeners.forEach((fn) => fn(data))

        switch (data.type) {
            case 'liquidity':
                this.handleLiquidity(data as BlurLiquidityEvent)
                break
            case 'pool_create':
                this.handlePoolCreate(data as BlurPoolCreateEvent)
                break
            case 'token_create':
                this.handleTokenCreate(data as BlurTokenCreateEvent)
                break
            case 'metadata':
                this.handleMetadata(data as BlurMetadataEvent)
                break
            default:
                // ignorar connected, candle, stats, etc.
                break
        }
    }

    private handleLiquidity(evt: BlurLiquidityEvent): void {
        const poolKey = evt.pool
        const liquidityUsd = parseBlurFloat(evt.base_usd) + parseBlurFloat(evt.quote_usd)

        let state = this.poolState.get(poolKey)

        if (!state) {
            // Primera vez que vemos este pool — lo registramos
            state = {
                initialLiquidityUsd: liquidityUsd,
                currentLiquidityUsd: liquidityUsd,
                tokenMint: evt.base_mint,
                tokenSymbol: shortMint(evt.base_mint),
                poolAddress: evt.pool,
                dex: formatDex(evt.dex),
            }
            this.poolState.set(poolKey, state)

            // Solo emitimos al feed si es un ADD (no queremos ruido de removes iniciales)
            if (evt.kind === 'add') {
                this.emitPoolEvent({
                    id: evt.signature,
                    signature: evt.signature,
                    tokenMint: evt.base_mint,
                    tokenSymbol: state.tokenSymbol,
                    dex: state.dex,
                    poolAddress: evt.pool,
                    initialLiquidityUsd: liquidityUsd,
                    currentLiquidityUsd: liquidityUsd,
                    liquidityDeltaPct: 0,
                    timestamp: evt.block_time * 1000,
                    alertLevel: 'stable',
                    kind: 'add',
                })
            }
            return
        }

        // Actualizar estado
        if (evt.kind === 'add') {
            state.currentLiquidityUsd += liquidityUsd
        } else {
            state.currentLiquidityUsd = Math.max(0, state.currentLiquidityUsd - liquidityUsd)
        }

        const deltaPct =
            ((state.currentLiquidityUsd - state.initialLiquidityUsd) / state.initialLiquidityUsd) * 100

        let alertLevel: PoolEvent['alertLevel'] = 'stable'
        if (deltaPct < -30) alertLevel = 'critical'
        else if (deltaPct < -10) alertLevel = 'watch'

        this.emitPoolEvent({
            id: evt.signature,
            signature: evt.signature,
            tokenMint: state.tokenMint,
            tokenSymbol: state.tokenSymbol,
            dex: state.dex,
            poolAddress: state.poolAddress,
            initialLiquidityUsd: state.initialLiquidityUsd,
            currentLiquidityUsd: state.currentLiquidityUsd,
            liquidityDeltaPct: deltaPct,
            timestamp: evt.block_time * 1000,
            alertLevel,
            kind: evt.kind,
        })
    }

    private handlePoolCreate(evt: BlurPoolCreateEvent): void {
        const liquidityUsd = parseBlurFloat((evt as any).initial_liquidity_usd) || 0

        this.emitPoolEvent({
            id: evt.signature,
            signature: evt.signature,
            tokenMint: evt.base_mint,
            tokenSymbol: shortMint(evt.base_mint),
            dex: formatDex(evt.dex),
            poolAddress: evt.pool,
            initialLiquidityUsd: liquidityUsd,
            currentLiquidityUsd: liquidityUsd,
            liquidityDeltaPct: 0,
            timestamp: evt.block_time * 1000,
            alertLevel: 'stable',
            kind: 'create',
        })

        this.poolState.set(evt.pool, {
            initialLiquidityUsd: liquidityUsd,
            currentLiquidityUsd: liquidityUsd,
            tokenMint: evt.base_mint,
            tokenSymbol: shortMint(evt.base_mint),
            poolAddress: evt.pool,
            dex: formatDex(evt.dex),
        })
    }

    private handleTokenCreate(evt: BlurTokenCreateEvent): void {
        // Guardamos metadata básica si viene en el evento
        const mint = evt.mint as string
        if (!mint) return

        this.emitPoolEvent({
            id: evt.signature || mint,
            signature: evt.signature || '',
            tokenMint: mint,
            tokenSymbol: (evt.symbol as string) || shortMint(mint),
            tokenName: evt.name as string,
            dex: 'new',
            poolAddress: '',
            initialLiquidityUsd: 0,
            currentLiquidityUsd: 0,
            liquidityDeltaPct: 0,
            timestamp: (evt.block_time || Date.now() / 1000) * 1000,
            alertLevel: 'stable',
            kind: 'create',
        })
    }

    private handleMetadata(evt: BlurMetadataEvent): void {
        // Actualizar símbolo en eventos previos si tenemos el mint
        for (const [, state] of this.poolState.entries()) {
            if (state.tokenMint === evt.mint) {
                state.tokenSymbol = evt.symbol || state.tokenSymbol
            }
        }
    }

    private emitPoolEvent(evt: PoolEvent): void {
        this.poolListeners.forEach((fn) => fn(evt))
    }

    // ---------- mock ----------

    private startMock(): void {
        this.mode = 'mock'
        resetMockState()
        console.info('[solami.ws] MOCK MODE enabled')

        this.mockSlotTimer = setInterval(() => {
            const tick = mockSlotTick()
            this.slotListeners.forEach((fn) => fn(tick))
        }, MOCK_SLOT_INTERVAL_MS)

        this.mockPoolTimer = setInterval(() => {
            const evt = mockPoolEvent()
            this.poolListeners.forEach((fn) => fn(evt))
        }, MOCK_POOL_INTERVAL_MS)
    }

    private stopMock(): void {
        if (this.mockSlotTimer) {
            clearInterval(this.mockSlotTimer)
            this.mockSlotTimer = null
        }
        if (this.mockPoolTimer) {
            clearInterval(this.mockPoolTimer)
            this.mockPoolTimer = null
        }
    }
}

// ---------- helpers ----------

/**
 * Los decimales de Blur vienen como string ("14.925992591835303").
 * Los parseamos a number con fallback seguro.
 */
function parseBlurFloat(v: string | number | null | undefined): number {
    if (v == null) return 0
    if (typeof v === 'number') return v
    const parsed = parseFloat(v)
    return Number.isFinite(parsed) ? parsed : 0
}

function shortMint(mint: string): string {
    if (!mint) return '???'
    return `${mint.slice(0, 4)}…${mint.slice(-3)}`
}

function formatDex(dex: string): string {
    return dex
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
}

export const solamiWs = new SolamiWsClient()