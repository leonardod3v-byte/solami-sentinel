import { create } from 'zustand'

export type ToastVariant = 'info' | 'success' | 'warning' | 'critical'

export interface Toast {
    id: string
    variant: ToastVariant
    title: string
    message?: string
    createdAt: number
}

interface ToastState {
    toasts: Toast[]
    push: (toast: Omit<Toast, 'id' | 'createdAt'>) => void
    dismiss: (id: string) => void
    clear: () => void
}

const MAX_TOASTS = 4
const AUTO_DISMISS_MS = 6_000

export const useToastStore = create<ToastState>((set, get) => ({
    toasts: [],

    push: (input) => {
        const id = crypto.randomUUID()
        const toast: Toast = { ...input, id, createdAt: Date.now() }

        set((s) => ({
            toasts: [toast, ...s.toasts].slice(0, MAX_TOASTS),
        }))

        // Auto-dismiss
        setTimeout(() => get().dismiss(id), AUTO_DISMISS_MS)
    },

    dismiss: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    clear: () => set({ toasts: [] }),
}))