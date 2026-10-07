import { create } from 'zustand'
import type { PoolEvent } from '../services/solami.types'

const MAX_FEED_SIZE = 40

export type WsMode = 'blur' | 'mock'

interface SentinelState {
    // --- data ---
    poolFeed: PoolEvent[]
    latestSlot: number
    slotTicks: number[] // últimos N slots para sparkline

    // --- status ---
    wsConnected: boolean
    wsMode: WsMode

    // --- actions ---
    upsertPoolEvent: (evt: PoolEvent) => void
    clearFeed: () => void
    setLatestSlot: (slot: number) => void
    setWsStatus: (connected: boolean, mode: WsMode) => void
}

export const useSentinelStore = create<SentinelState>((set) => ({
    poolFeed: [],
    latestSlot: 0,
    slotTicks: [],

    wsConnected: false,
    wsMode: 'mock',

    upsertPoolEvent: (evt) =>
        set((state) => {
            const idx = state.poolFeed.findIndex((p) => p.id === evt.id)

            if (idx === -1) {
                // nuevo → al principio
                return {
                    poolFeed: [evt, ...state.poolFeed].slice(0, MAX_FEED_SIZE),
                }
            }

            // existente → reemplaza en su lugar (mantiene posición)
            const next = state.poolFeed.slice()
            next[idx] = evt
            return { poolFeed: next }
        }),

    clearFeed: () => set({ poolFeed: [] }),

    setLatestSlot: (slot) =>
        set((state) => ({
            latestSlot: slot,
            slotTicks: [...state.slotTicks, slot].slice(-30),
        })),

    setWsStatus: (connected, mode) =>
        set({ wsConnected: connected, wsMode: mode }),
}))