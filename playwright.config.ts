import { defineConfig, devices } from '@playwright/test';

// Parcours navigateur reel : Keycloak, BFF, API et front deja demarres (mode dev : http://localhost:5173 ;
// mode pile : https://localhost:8443). Identifiants d'un utilisateur de test du realm par variables d'environnement.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:5173',
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
