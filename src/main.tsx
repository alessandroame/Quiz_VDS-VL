import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { audioDownloadManager } from './services/audioDownloadManager';

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
const buildInfo = {
  version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0',
  buildNumber: typeof __APP_BUILD_NUMBER__ !== 'undefined' ? __APP_BUILD_NUMBER__ : '0',
  commitHash: typeof __APP_COMMIT_HASH__ !== 'undefined' ? __APP_COMMIT_HASH__ : 'dev',
  buildTime: typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : new Date().toISOString(),
  buildId: typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'dev',
};

if (typeof window !== 'undefined') {
  window.__APP_BUILD_INFO__ = buildInfo;
  (window as any).audioDownloadManager = audioDownloadManager;
}

console.log(
  `%c[VDS-VL Quiz Master]%c v${buildInfo.version} (Build #${buildInfo.buildNumber} • ${buildInfo.commitHash}) - Built: ${buildInfo.buildTime}`,
  'background: #0284c7; color: #ffffff; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
  'color: #38bdf8; font-weight: bold; margin-left: 4px;'
);
console.log(`[VDS-VL Build ID] ${buildInfo.buildId}`);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
