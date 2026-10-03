import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { audioDownloadManager } from './services/audioDownloadManager';
import { APP_NAME, getBuildInfo, BUILD_INFO_UPDATED_EVENT } from './utils/buildInfo';

// In development mode, unregister any stale service workers to prevent cache interception
if (import.meta.env.DEV && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('[ServiceWorker] Unregistered stale service worker in DEV mode:', registration);
    }
  });
}

// Log build info to browser console for verification and cache invalidation diagnosis
const logBuildInfo = (info: ReturnType<typeof getBuildInfo>, isLiveUpdate = false) => {
  const prefix = isLiveUpdate ? `[${APP_NAME} Dev Live]` : `[${APP_NAME}]`;
  const badgeBg = isLiveUpdate ? '#059669' : '#0284c7';
  console.log(
    `%c${prefix}%c v${info.version} (Build #${info.buildNumber} • ${info.commitHash}) - Built: ${info.buildTime}`,
    `background: ${badgeBg}; color: #ffffff; font-weight: bold; padding: 2px 6px; border-radius: 4px;`,
    'color: #38bdf8; font-weight: bold; margin-left: 4px;'
  );
  console.log(`[VDS-VL Build ID] ${info.buildId}`);
};

const initialBuildInfo = getBuildInfo();

if (typeof window !== 'undefined') {
  window.__APP_BUILD_INFO__ = initialBuildInfo;
  (window as any).audioDownloadManager = audioDownloadManager;

  if (import.meta.env.DEV) {
    window.addEventListener(BUILD_INFO_UPDATED_EVENT, (e: any) => {
      if (e.detail) {
        logBuildInfo(e.detail, true);
      }
    });
  } else {
    logBuildInfo(initialBuildInfo, false);
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
