// Controle apres build (DF3) : la CSP fixe interdit tout script ou style en ligne. Echec du build sinon.
import { readdirSync, readFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const erreurs = [];

for (const balise of html.match(/<script\b[^>]*>/gi) ?? []) {
  if (!/\bsrc=/.test(balise)) erreurs.push(`script en ligne : ${balise}`);
}
if (/<style\b/i.test(html)) erreurs.push('balise <style> en ligne');
if (/\sstyle=/i.test(html)) erreurs.push('attribut style= en ligne');
if (/\son[a-z]+=/i.test(html)) erreurs.push('gestionnaire d evenement en ligne (on...=)');

// Fichiers a empreinte uniquement dans assets/ (mis en cache un an par nginx)
for (const fichier of readdirSync('dist/assets')) {
  if (!/-[A-Za-z0-9_-]{8,}\.(js|css)$/.test(fichier)) erreurs.push(`fichier sans empreinte : assets/${fichier}`);
}

if (erreurs.length > 0) {
  console.error(`dist non conforme a la CSP :\n- ${erreurs.join('\n- ')}`);
  process.exit(1);
}
console.log('dist conforme : aucun script ni style en ligne, fichiers a empreinte');
