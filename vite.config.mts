import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Mode dev : le navigateur ne voit qu'une origine (http://localhost:5173), comme en cible derriere APISIX externe.
// /bff est relaye vers le BFF lance par mvn (port 8090) avec l'en-tete Host d'origine : le BFF construit la redirect
// URI http://localhost:5173/bff/login/oauth2/code/keycloak declaree dans le realm.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/bff': {
        target: 'http://localhost:8090',
        changeOrigin: false,
        xfwd: true,
      },
    },
  },
  build: {
    // Aucun script ni style en ligne (CSP fixe sans 'unsafe-inline', DF3) : tout dans des fichiers a empreinte
    assetsInlineLimit: 0,
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
