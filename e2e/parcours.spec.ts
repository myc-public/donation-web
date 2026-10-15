import { expect, test, type Response } from '@playwright/test';

// Parcours reel : navigateur -> front -> BFF -> Keycloak / API. Utilisateur de test du realm myc-customers
// (dev : donor.a@example.test, mot de passe TEST_USERS_PASSWORD de gitops-platform/local/keycloak/.env).
const UTILISATEUR = process.env['E2E_USER'] ?? 'donor.a@example.test';
const MOT_DE_PASSE = process.env['E2E_PASSWORD'];

// Un JWT (header base64url de {"alg"...) ou un champ de token dans une reponse du BFF = fuite vers le navigateur
const MOTIF_TOKEN = /eyJ[A-Za-z0-9_-]{10,}\.|access_token|refresh_token|id_token/;

test('connexion, profil, deconnexion : aucun token dans le navigateur', async ({ page, context }) => {
  test.skip(!MOT_DE_PASSE, 'E2E_PASSWORD absent');

  const fuites: string[] = [];
  page.on('response', async (response: Response) => {
    if (new URL(response.url()).pathname.startsWith('/bff/api/')) {
      const corps = await response.text().catch(() => '');
      if (MOTIF_TOKEN.test(corps)) fuites.push(response.url());
    }
  });

  // 1. Connexion : front -> BFF -> Keycloak (code + PKCE) -> BFF -> retour sur /
  await page.goto('/');
  await page.getByRole('link', { name: 'Se connecter' }).click();
  await page.locator('#username').fill(UTILISATEUR);
  await page.locator('#password').fill(MOT_DE_PASSE!);
  await page.locator('#kc-login').click();
  await expect(page.getByRole('heading', { name: /^Bonjour/ })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/');

  // 2. Session : cookie __Host-SESSION HttpOnly, aucun token dans les cookies envoyes au front et au BFF, ni en
  // stockage. Les cookies de Keycloak (KEYCLOAK_IDENTITY : session SSO, HttpOnly, chemin /realms/<realm>/) sont
  // exclus : propres a Keycloak, jamais envoyes au front ni au BFF. En echec, seuls les noms sont affiches.
  const origine = new URL(page.url()).origin;
  const cookies = await context.cookies([`${origine}/`, `${origine}/bff/api/session`]);
  const session = cookies.find((c) => c.name === '__Host-SESSION');
  expect(session?.httpOnly).toBe(true);
  expect(session?.path).toBe('/');
  expect(cookies.filter((c) => MOTIF_TOKEN.test(c.value)).map((c) => c.name)).toEqual([]);
  expect(await page.evaluate(() => window.localStorage.length + window.sessionStorage.length)).toBe(0);

  // 3. Profil (DB10) : existant, ou formulaire pre-rempli puis creation
  await page.getByRole('link', { name: 'Mon profil', exact: true }).click();
  const formulaire = page.getByRole('button', { name: 'Créer mon profil' });
  const email = page.getByText(UTILISATEUR, { exact: true });
  await expect(formulaire.or(email)).toBeVisible();
  if (await formulaire.isVisible()) {
    await page.getByLabel('Pays').fill('MA');
    await formulaire.click();
  }
  await expect(email).toBeVisible();

  // 4. Deconnexion : BFF -> Keycloak end_session -> retour sur / anonyme
  await page.getByRole('button', { name: 'Se déconnecter' }).click();
  await expect(page.getByRole('link', { name: 'Se connecter' })).toBeVisible();
  const apres = await page.request.get('/bff/api/session');
  expect(await apres.json()).toMatchObject({ authenticated: false });

  expect(fuites).toEqual([]);
});

test('mutation sans jeton CSRF refusee par le BFF', async ({ page }) => {
  await page.goto('/');
  const reponse = await page.request.post('/bff/api/donors/me', {
    headers: { Origin: new URL(page.url()).origin, 'Content-Type': 'application/json' },
    data: { lastName: 'X', firstName: 'Y' },
  });
  expect(reponse.status()).toBe(403);
});
