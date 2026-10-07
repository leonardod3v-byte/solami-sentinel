import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { fetchWalletSnapshot } from '../services/solami.data'

export function useWalletInspector() {
    const { publicKey, connected } = useWallet()
    const address = publicKey?.toBase58() ?? null

    return useQuery({
        queryKey: ['solami', 'wallet-snapshot', address],
        queryFn: () => fetchWalletSnapshot(address!),
        enabled: connected && Boolean(address),
        refetchInterval: 15_000,
        staleTime: 10_000,
        retry: 1,
    })
}