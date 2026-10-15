import { Link, useSearchParams } from 'react-router';

import { LOGIN_URL } from '../bff/client';
import { useSession } from '../bff/session';

export function Accueil() {
  const { state } = useSession();
  const [params] = useSearchParams();

  if (state.status !== 'pret') {
    return null; // chargement ou erreur : affiches par le gabarit
  }
  if (!state.session.authenticated) {
    return (
      <section>
        <h1>Espace donateur</h1>
        {params.get('connexion') === 'echec' && (
          <p role="alert">La connexion n'a pas abouti. Merci de réessayer.</p>
        )}
        <p>Connectez-vous pour gérer votre profil de donateur.</p>
        {/* Navigation pleine page : le BFF redirige vers Keycloak (code + PKCE) */}
        <a className="bouton" href={LOGIN_URL}>
          Se connecter
        </a>
      </section>
    );
  }
  return (
    <section>
      <h1>Bonjour {state.session.givenName ?? ''}</h1>
      <p>
        <Link to="/profil">Voir mon profil de donateur</Link>
      </p>
    </section>
  );
}
