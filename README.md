# donation-web

Espace donateur (lot K6a) : front React statique, servi par nginx. Aucun secret, aucun token, aucune configuration par
environnement : la connexion, la session et les appels a l'API passent par le BFF partage
[`web-bff`](https://github.com/myc-public/web-bff), sur la meme origine (`/bff/**`).

Flux : Navigateur -> APISIX externe + WAF -> `/` **donation-web** (nginx) ; `/bff/**` -> web-bff -> APISIX interne ->
donation-api. Decisions : ADR K6 DF1 a DF4 et DB1 a DB11 (ADR 0026 de `platform-handbook` : https://github.com/myc-public/platform-handbook/blob/develop/adr/README.md).
Tests de securite : `inner-donation-api/postman/PLAN-DE-TEST-E2E.md` section 5.

## Pages

| Route | Contenu |
|---|---|
| `/` | anonyme : bouton de connexion (navigation vers `/bff/oauth2/authorization/keycloak`) ; connecte : accueil |
| `/profil` | profil du donateur ; sans profil (404) : formulaire pre-rempli par la session, creation (201, ou 409 = deja cree) |
| autre | page introuvable |

Deconnexion : formulaire `POST /bff/logout` avec le champ `_csrf` (navigation pleine page vers Keycloak, puis retour).

## Garde-fous de securite

- ESLint : `localStorage`, `sessionStorage`, `indexedDB`, `innerHTML`, `dangerouslySetInnerHTML`, `eval` interdits.
- Mutations : `credentials: 'same-origin'` et en-tete `X-XSRF-TOKEN` (cookie `XSRF-TOKEN` pose par le BFF).
- Build : `scripts/check-dist.mjs` fait echouer `npm run build` si `dist/index.html` contient un script ou un style en
  ligne (CSP fixe sans `'unsafe-inline'`).
- nginx : CSP bloquante, `index.html` jamais en cache, `/assets/*` en cache un an, GET/HEAD
  seulement, `/bff/*` jamais servi.

## Prerequis

- Node 24 LTS (`.nvmrc`, `engines` : `npm install` refuse une autre version).
- Pour le parcours complet : Keycloak local, API (8080), Redis + BFF (8090) demarres (voir le README de `web-bff`).

## Mode dev (Vite, http://localhost:5173)

```powershell
Set-Location D:\workspace\public\donation-web
npm ci
npm run dev
```

Vite relaie `/bff` vers le BFF (8090) en conservant l'en-tete Host : le navigateur et Keycloak ne voient que
`http://localhost:5173`, l'origine declaree dans le realm (comme en cible derriere APISIX externe).

## Scripts

| Script | Role |
|---|---|
| `npm run dev` | serveur de developpement, port 5173 |
| `npm run build` | build statique `dist/` puis controle CSP (`check-dist.mjs`) |
| `npm run typecheck` / `npm run lint` | TypeScript strict, ESLint (garde-fous de securite) |
| `npm test` | tests unitaires (Vitest, Testing Library, BFF simule) |
| `npm run test:e2e` | parcours navigateur reel (Playwright) : `E2E_BASE_URL`, `E2E_USER`, `E2E_PASSWORD` |
| `npm run audit` | vulnerabilites connues des dependances de production (seuil : high) |

## CI/CD et image

Job Jenkins `donation-web` ([`cicd/Jenkinsfile-ci`](cicd/Jenkinsfile-ci)) : `npm ci` par le proxy npm de Nexus, lint et
typecheck, tests, audit des dependances, SonarCloud, build, image (BuildConfig), puis mise a jour du tag dans
`gitops-platform` (`apps/donation-web/overlays/dev`), synchronise par Argo CD.

`cicd/openshift/Dockerfile` : nginx 1.26 UBI 9 (digest), contexte = racine du depot apres `npm run build`
(`.dockerignore` : `dist/` et `nginx/` seulement), UID arbitraire (groupe 0), port 8080, sonde `/healthz` jamais
routee publiquement. Logs d'acces JSON sur stdout.

```powershell
Set-Location D:\workspace\public\donation-web
npm run build
docker build -f cicd/openshift/Dockerfile -t donation-web:dev .
```
