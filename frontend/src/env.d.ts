/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    // 필요하면 추가:
    // readonly VITE_USE_MOCK?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}