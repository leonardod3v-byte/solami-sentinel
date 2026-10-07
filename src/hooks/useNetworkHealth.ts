import { useQuery } from '@tanstack/react-query'
import { fetchNetworkHealth } from '../services/solami.data'

export function useNetworkHealth() {
    return useQuery({
        queryKey: ['solami', 'network-health'],
        queryFn: fetchNetworkHealth,
        refetchInterval: 4_000,
        staleTime: 3_000,
        retry: 2,
    })
}