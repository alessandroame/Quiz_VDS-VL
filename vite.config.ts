import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: process.env.BASE_PATH || (process.env.GITHUB_ACTIONS ? '/Quiz_VDS-VL/' : '/'),
  server: {
    port: 5173,
    strictPort: true
  },
  preview: {
    port: 5173,
    strictPort: true
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'robots.txt', 'data/questions.json', 'icons/*.png'],
      manifest: {
        name: 'VDS-VL Quiz Master',
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
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          db: ['dexie', 'dexie-react-hooks'],
          icons: ['lucide-react']
        }
      }
    }
  }
});
