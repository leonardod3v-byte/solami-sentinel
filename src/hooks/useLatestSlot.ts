import { useQuery } from '@tanstack/react-query'
import { getSolamiConnection } from '../services/solami.rpc'

export function useLatestSlot() {
    return useQuery({
        queryKey: ['solami', 'slot'],
        queryFn: () => getSolamiConnection().getSlot('confirmed'),
        refetchInterval: 4_000,
        staleTime: 3_000,
    })
}