import { useEffect } from 'react'
import { solamiWs } from '../services/solami.ws'
import { useSentinelStore } from '../store/sentinel.store'
import { useToastStore } from '../store/toast.store'

export function useSolamiWs(): void {
    useEffect(() => {
        solamiWs.connect()

        const poolSub = solamiWs.onPoolEvent((evt) => {
            const store = useSentinelStore.getState()
            const existing = store.poolFeed.find((p) => p.id === evt.id)

            store.upsertPoolEvent(evt)

            // Toast cuando un pool pasa a critical (solo en la transición)
            if (
                evt.alertLevel === 'critical' &&
                (!existing || existing.alertLevel !== 'critical')
            ) {
                useToastStore.getState().push({
                    variant: 'critical',
                    title: 'Liquidity drop',
                    message: `${evt.tokenSymbol} on ${evt.dex} · ${evt.liquidityDeltaPct.toFixed(1)}%`,
                })
            }
        })

        const slotSub = solamiWs.onSlot((tick) => {
            useSentinelStore.getState().setLatestSlot(tick.slot)
        })

        const statusInterval = setInterval(() => {
            const connected = solamiWs.isConnected()
            const mode = solamiWs.getMode()
            const current = useSentinelStore.getState()

            if (current.wsConnected !== connected || current.wsMode !== mode) {
                useSentinelStore.getState().setWsStatus(connected, mode)
            }
        }, 1_000)

        return () => {
            poolSub.unsubscribe()
            slotSub.unsubscribe()
            clearInterval(statusInterval)
        }
    }, [])
}