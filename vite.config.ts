import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/ascend-test/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'ASCEND — Pilotage patrimonial',
        short_name: 'ASCEND',
        description: 'Suivi du patrimoine, des revenus et des dépenses',
        start_url: '/ascend-test/',
        scope: '/ascend-test/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0e14',
        theme_color: '#0a0e14',
        lang: 'fr',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
