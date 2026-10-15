import { useRef } from 'react';

import { LOGOUT_URL, xsrfToken } from '../bff/client';

/**
 * Deconnexion par formulaire (navigation pleine page) : le BFF redirige vers Keycloak (end_session) puis revient sur /.
 * Un fetch suivrait la redirection vers Keycloak en CORS et echouerait. Le jeton CSRF est lu au moment de l'envoi.
 */
export function Deconnexion() {
  const csrf = useRef<HTMLInputElement>(null);

  return (
    <form
      method="post"
      action={LOGOUT_URL}
      onSubmit={() => {
        if (csrf.current) {
          csrf.current.value = xsrfToken() ?? '';
        }
      }}
    >
      <input ref={csrf} type="hidden" name="_csrf" defaultValue="" />
      <button type="submit">Se déconnecter</button>
    </form>
  );
}
