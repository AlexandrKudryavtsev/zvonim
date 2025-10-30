/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
    readonly VITE_WEBSOCKET_BASE_URL: string
    readonly VITE_TUNE_SERVERS: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
