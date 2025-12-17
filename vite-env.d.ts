// Manually define ImportMetaEnv to resolve missing vite/client types
interface ImportMetaEnv {
  [key: string]: any
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}