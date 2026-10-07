interface SkeletonProps {
    className?: string
    /** Ancho arbitrario (ej. "60%", "120px") */
    width?: string
    /** Alto arbitrario (ej. "1rem", "20px") */
    height?: string
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse rounded bg-term-border/60 ${className}`}
            style={{ width, height }}
        />
    )
}

/**
 * Bloque completo de skeleton para un panel entero.
 * Reproduce el layout típico de un panel del dashboard.
 */
export function PanelSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div className="flex flex-col gap-3 p-4">
            <Skeleton width="40%" height="12px" />
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 border-l-2 border-l-term-border pl-3">
                    <Skeleton width={`${50 + Math.random() * 30}%`} height="10px" />
                    <Skeleton width={`${30 + Math.random() * 20}%`} height="8px" />
                </div>
            ))}
        </div>
    )
}