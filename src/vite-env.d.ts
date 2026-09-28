/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __APP_BUILD_ID__: string;
declare const __APP_BUILD_NUMBER__: string;
declare const __APP_COMMIT_HASH__: string;
declare const __APP_BUILD_TIME__: string;

interface Window {
  __APP_BUILD_INFO__?: {
    version: string;
    buildNumber: string;
    commitHash: string;
    buildTime: string;
    buildId: string;
  };
}
