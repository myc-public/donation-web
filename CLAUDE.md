# donation-web

Front React statique (nginx) de l'espace donateur ; tout appel passe par le BFF `web-bff` sur la meme origine.
Lire d'abord [README.md](README.md). Regles communes du socle : `platform-handbook`.

## Commandes

- Node 24 (`.nvmrc`) ; `npm ci`, `npm run dev` (port 5173, `/bff` relaye vers 8090).
- Avant un commit : `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` (controle CSP).

## Regles propres a ce depot

- Aucun secret, token ni configuration par environnement dans le front.
- Interdits (ESLint) : `localStorage`, `sessionStorage`, `indexedDB`, `innerHTML`, `dangerouslySetInnerHTML`,
  `eval` ; ne jamais desactiver une de ces regles.
- Aucun script ni style en ligne : la CSP nginx est fixe, sans `'unsafe-inline'`.
- Mutations : `credentials: 'same-origin'` et en-tete `X-XSRF-TOKEN`.
- Nouvelle dependance : version publiee depuis plus de deux semaines, `npm run audit` vert.
- Decisions DF1-DF4 (ADR 0026 de `platform-handbook`) : tout ecart passe par une nouvelle ADR.
