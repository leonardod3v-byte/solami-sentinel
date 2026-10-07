/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SOLAMI_API_KEY: string
    readonly VITE_SOLAMI_RPC_URL: string
    readonly VITE_SOLAMI_WS_URL: string
    readonly VITE_SOLAMI_DATA_URL: string
    readonly VITE_USE_MOCK: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}