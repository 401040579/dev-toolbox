/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  /** Optional page-view counting; see README → Analytics. Unset means off. */
  readonly VITE_ANALYTICS_PROVIDER?: string;
  readonly VITE_ANALYTICS_GOATCOUNTER_SITE?: string;
  readonly VITE_ANALYTICS_ENDPOINT?: string;
}
