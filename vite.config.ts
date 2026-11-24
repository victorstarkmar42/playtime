import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'prompt', // new versions wait for the adult's "Actualizar" (see src/ui/pwa.ts)
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: './',
        name: 'Punto y Magia',
        short_name: 'Punto y Magia',
        description: 'Une puntos, colorea y aprende números en español e inglés.',
        lang: 'es-MX',
        theme_color: '#F2672E',
        background_color: '#F3F9FF',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2,png}'] },
    }),
  ],
  // Fixed ports so this app never collides with other local projects (Vite's 5173/4173 defaults).
  server: { port: 5390, strictPort: true },
  preview: { port: 4390, strictPort: true },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
