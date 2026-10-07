import type { DexName, PoolEvent, SlotTick } from './solami.types'

const DEXES: DexName[] = [
    'raydium',
    'raydium_clmm',
    'orca_whirlpool',
    'meteora_dlmm',
    'meteora_pools',
    'pumpswap',
]

const SYMBOLS = [
    'BONK',
    'WIF',
    'JUP',
    'PYTH',
    'JTO',
    'MEW',
    'POPCAT',
    'SLERF',
    'MYRO',
    'BOME',
    'WEN',
    'SAMO',
    'TREMP',
    'MICHI',
    'GME',
]

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

// ---------- helpers ----------

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1))
const pick = <T,>(arr: readonly T[]): T => arr[randInt(0, arr.length - 1)]

function randomBase58(length: number): string {
    let out = ''
    for (let i = 0; i < length; i++) {
        out += BASE58[randInt(0, BASE58.length - 1)]
    }
    return out
}

// ---------- state ----------

/** Pools "vivos" que iremos actualizando con drift de liquidez */
const livePools = new Map<string, PoolEvent>()

const MAX_LIVE_POOLS = 12

// ---------- pool events ----------

/**
 * Genera el siguiente evento del feed.
 * 65% updates de pools existentes, 35% creación de pool nuevo.
 * Si hay menos de 4 pools vivos, fuerza creación.
 */
export function mockPoolEvent(): PoolEvent {
    const shouldCreate =
        livePools.size < 4 ||
        (livePools.size < MAX_LIVE_POOLS && Math.random() < 0.35)

    if (shouldCreate) {
        return createMockPool()
    }
    return driftMockPool()
}

function createMockPool(): PoolEvent {
    const initial = rand(5_000, 400_000)
    const symbol = pick(SYMBOLS)
    const dex = pick(DEXES)

    const evt: PoolEvent = {
        id: crypto.randomUUID(),
        signature: randomBase58(88),
        tokenMint: randomBase58(43),
        tokenSymbol: symbol,
        dex,
        poolAddress: randomBase58(43),
        initialLiquidityUsd: initial,
        currentLiquidityUsd: initial,
        liquidityDeltaPct: 0,
        timestamp: Date.now(),
        alertLevel: 'stable',
        kind: 'create',
    }

    livePools.set(evt.id, evt)
    return evt
}

function driftMockPool(): PoolEvent {
    const pools = [...livePools.values()]
    const pool = pick(pools)

    // Sesgo hacia abajo: -40 a +20 (más probable ver caídas)
    const driftPct = rand(-40, 20)
    const newLiquidity = Math.max(
        500,
        pool.currentLiquidityUsd * (1 + driftPct / 100)
    )

    const deltaPct =
        ((newLiquidity - pool.initialLiquidityUsd) / pool.initialLiquidityUsd) * 100

    let alertLevel: PoolEvent['alertLevel'] = 'stable'
    if (deltaPct < -30) alertLevel = 'critical'
    else if (deltaPct < -10) alertLevel = 'watch'

    const updated: PoolEvent = {
        ...pool,
        currentLiquidityUsd: newLiquidity,
        liquidityDeltaPct: deltaPct,
        timestamp: Date.now(),
        alertLevel,
        kind: driftPct > 0 ? 'add' : 'remove',
    }

    livePools.set(pool.id, updated)

    // Garbage collect: elimina pools muertos para no crecer infinito
    if (livePools.size > MAX_LIVE_POOLS) {
        const oldest = [...livePools.values()].sort(
            (a, b) => a.timestamp - b.timestamp
        )[0]
        livePools.delete(oldest.id)
    }

    return updated
}

// ---------- slot ticks ----------

let mockSlot = 280_000_000 + randInt(0, 1_000_000)

export function mockSlotTick(): SlotTick {
    // ~2.5 slots/segundo = 400ms
    mockSlot += 1
    return { slot: mockSlot, timestamp: Date.now() }
}

// ---------- reset (útil para tests / hot reload) ----------

export function resetMockState() {
    livePools.clear()
    mockSlot = 280_000_000 + randInt(0, 1_000_000)
}