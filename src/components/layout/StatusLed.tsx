type LedColor = 'green' | 'red' | 'amber' | 'cyan'

interface StatusLedProps {
    active: boolean
    label: string
    /** Color cuando `active` es true. Cuando false, siempre rojo. */
    color?: LedColor
    /** Muestra el pulso solo si está activo. Default true. */
    pulse?: boolean
}

const COLOR_VAR: Record<LedColor, string> = {
    green: 'var(--color-neon-green)',
    red: 'var(--color-neon-red)',
    amber: 'var(--color-neon-amber)',
    cyan: 'var(--color-neon-cyan)',
}

export function StatusLed({
    active,
    label,
    color = 'green',
    pulse = true,
}: StatusLedProps) {
    const rgbVar = active ? COLOR_VAR[color] : 'var(--color-neon-red)'

    return (
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
            <span
                className={`inline-block h-2 w-2 rounded-full ${active && pulse ? 'animate-pulse' : ''
                    }`}
                style={{
                    backgroundColor: rgbVar,
                    boxShadow: `0 0 6px ${rgbVar}`,
                }}
            />
            <span className="text-text-dim">{label}</span>
        </div>
    )
}