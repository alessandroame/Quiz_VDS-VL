import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync, existsSync, statSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

const commitHash = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
})();

const commitCount = (() => {
  try {
    return execSync('git rev-list --count HEAD').toString().trim();
  } catch {
    return '0';
  }
})();

const buildTime = new Date().toISOString();

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_BUILD_ID__: JSON.stringify(`Build #${commitCount} (${commitHash}) - ${buildTime}`),
    __APP_BUILD_NUMBER__: JSON.stringify(commitCount),
    __APP_COMMIT_HASH__: JSON.stringify(commitHash),
    __APP_BUILD_TIME__: JSON.stringify(buildTime),
  },
  base: process.env.BASE_PATH || (process.env.GITHUB_ACTIONS ? '/Quiz_VDS-VL/' : '/'),
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      timeout: 60000
    }
  },
  preview: {
    port: 5173,
    strictPort: true
  },
  plugins: [
    {
      name: 'relaxed-hmr-reconnect',
      transform(code, id) {
        if (id.includes('vite/dist/client/client.mjs') || id.includes('@vite/client')) {
          const targetStart = 'async function waitForSuccessfulPing(socketUrl, ms = 1e3) {';
          const targetEnd = 'function wait(ms) {';
          const startIndex = code.indexOf(targetStart);
          const endIndex = code.indexOf(targetEnd, startIndex);
          if (startIndex !== -1 && endIndex !== -1) {
            const replacement = `async function waitForSuccessfulPing(socketUrl, initialMs = 3000) {
  async function ping() {
    const socket = new WebSocket(socketUrl, "vite-ping");
    return new Promise((resolve) => {
      function onOpen() {
        resolve(true);
        close();
      }
      function onError() {
        resolve(false);
        close();
      }
      function close() {
        socket.removeEventListener("open", onOpen);
        socket.removeEventListener("error", onError);
        socket.close();
      }
      socket.addEventListener("open", onOpen);
      socket.addEventListener("error", onError);
    });
  }
  if (await ping()) {
    return;
  }
  let currentDelay = initialMs;
  const maxDelay = 15000;
  await wait(currentDelay);
  while (true) {
    if (document.visibilityState === "visible") {
      if (await ping()) {
        break;
      }
      currentDelay = Math.min(Math.round(currentDelay * 1.5), maxDelay);
      await wait(currentDelay);
    } else {
      await waitForWindowShow();
    }
  }
}\n\n`;
            let res = code.slice(0, startIndex) + replacement + code.slice(endIndex);
            res = res.replace(
              'Polling for restart...',
              'Polling for restart (relaxed exponential backoff: 3s -> 15s)...'
            );
            return res;
          }
        }
      }
    },
    {
      name: 'serve-audit-reports',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/audit-reports/')) {
            const relPath = decodeURIComponent(req.url.replace(/^\/audit-reports\//, '').split('?')[0]);
            const filePath = path.join(__dirname, 'audit_reports', relPath);
            if (existsSync(filePath) && statSync(filePath).isFile()) {
              if (filePath.endsWith('.html')) res.setHeader('Content-Type', 'text/html; charset=utf-8');
              else if (filePath.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
              else if (filePath.endsWith('.json')) res.setHeader('Content-Type', 'application/json');
              return res.end(readFileSync(filePath));
            }
          }
          next();
        });
      }
    },
    {
      name: 'watch-git-commits',
      configureServer(server) {
        const gitDir = path.resolve(__dirname, '.git');
        if (existsSync(gitDir)) {
          server.watcher.add(path.join(gitDir, 'HEAD'));
          server.watcher.add(path.join(gitDir, 'refs', 'heads'));
          let debounceTimer: NodeJS.Timeout | null = null;
          server.watcher.on('change', (filePath) => {
            if (filePath.includes('.git')) {
              if (debounceTimer) clearTimeout(debounceTimer);
              debounceTimer = setTimeout(() => {
                server.restart();
              }, 1000);
            }
          });
        }
      }
    },
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'Quiz VDS-VL',
        short_name: 'VDS Quiz',
        description: 'Simulatore e studio per esame attestato VDS-VL Volo Libero AeCI',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/audio/manifest.json'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'vds-audio-manifest',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 2,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 giorni
              }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.json'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'vds-data-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 anno
              }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/audio/giuseppe/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'vds-audio-giuseppe',
              expiration: {
                maxEntries: 3000,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              rangeRequests: true
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/audio/elsa/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'vds-audio-elsa',
              expiration: {
                maxEntries: 3000,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              rangeRequests: true
            }
          }
        ]
      }
    })
  ],
  build: {
    emptyOutDir: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('posthog-js')) return 'telemetry';
            if (id.includes('lucide-react')) return 'icons';
            return 'vendor';
          }
          if (id.includes('questions.json')) {
            return 'quiz-dataset';
          }
        }
      }
    }
  }
});
