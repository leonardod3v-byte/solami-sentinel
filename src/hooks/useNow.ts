import { useEffect, useState } from 'react'

/**
 * Devuelve Date.now() actualizado cada `intervalMs`.
 * Úsalo para forzar re-render en componentes que muestran
 * timestamps relativos ("hace 2s") que si no quedarían congelados.
 *
 * ⚠️ Usar con moderación: cada componente que use este hook
 * re-renderiza cada intervalMs. Mantenlo alto (> 5000ms).
 */
export function useNow(intervalMs = 5_000): number {
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), intervalMs)
        return () => clearInterval(id)
    }, [intervalMs])

    return now
}