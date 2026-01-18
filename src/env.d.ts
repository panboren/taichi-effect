/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_BASE_PATH: string
  readonly VITE_PORT: string
  readonly VITE_OPEN: string
  readonly VITE_API_URL: string
  readonly VITE_OUT_DIR: string
  readonly VITE_SOURCEMAP: string
  readonly VITE_DROP_CONSOLE: string
  readonly VITE_DROP_DEBUGGER: string
  readonly VITE_APP_TENANT_ENABLE: string
  readonly VITE_APP_CAPTCHA_ENABLE: string
  readonly VITE_APP_API_ENCRYPT_ENABLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
