import { useToastStore, type ToastVariant } from '../../store/toast.store'

const VARIANT_STYLES: Record<
    ToastVariant,
    { border: string; text: string; icon: string }
> = {
    info: {
        border: 'border-l-[var(--color-neon-cyan)]',
        text: 'text-[var(--color-neon-cyan)]',
        icon: 'ℹ',
    },
    success: {
        border: 'border-l-[var(--color-neon-green)]',
        text: 'text-[var(--color-neon-green)]',
        icon: '✓',
    },
    warning: {
        border: 'border-l-[var(--color-neon-amber)]',
        text: 'text-[var(--color-neon-amber)]',
        icon: '⚠',
    },
    critical: {
        border: 'border-l-[var(--color-neon-red)]',
        text: 'text-[var(--color-neon-red)]',
        icon: '🚨',
    },
}

export function Toaster() {
    const toasts = useToastStore((s) => s.toasts)
    const dismiss = useToastStore((s) => s.dismiss)

    if (toasts.length === 0) return null

    return (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-90 max-w-[calc(100vw-2rem)] flex-col gap-2">
            {toasts.map((t) => {
                const styles = VARIANT_STYLES[t.variant]
                return (
                    <button
                        key={t.id}
                        onClick={() => dismiss(t.id)}
                        className={`pointer-events-auto border border-term-border border-l-2 ${styles.border} bg-term-panel/95 px-3 py-2 text-left shadow-lg backdrop-blur transition-all hover:bg-term-panel`}
                    >
                        <div className="flex items-start gap-2">
                            <span className={`font-mono text-sm ${styles.text}`}>{styles.icon}</span>
                            <div className="flex-1 min-w-0">
                                <div className={`font-mono text-[11px] font-bold uppercase tracking-wider ${styles.text}`}>
                                    {t.title}
                                </div>
                                {t.message && (
                                    <div className="mt-0.5 font-mono text-[10px] text-text-dim">
                                        {t.message}
                                    </div>
                                )}
                            </div>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}