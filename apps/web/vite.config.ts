import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Enregistrement manuel via `virtual:pwa-register` dans `main.tsx`.
      injectRegister: null,
      registerType: 'autoUpdate',
      // Le manifeste est servi statiquement depuis `public/manifest.json`.
      manifest: false,
      includeAssets: ['favicon.svg', 'logo-wordmark.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
        navigateFallback: '/index.html',
        // Les routes d'API ne doivent jamais recevoir la coquille HTML.
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // Recherche/lecture : réseau d'abord, repli sur le cache hors ligne.
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'verso-api',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
