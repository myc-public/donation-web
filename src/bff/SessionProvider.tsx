import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { getSession } from './client';
import { SessionContext, type SessionState } from './session';

/** Etat de connexion lu une fois au chargement (GET /bff/api/session). */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'chargement' });

  useEffect(() => {
    let actif = true;
    getSession()
      .then((session) => actif && setState({ status: 'pret', session }))
      .catch(() => actif && setState({ status: 'erreur' }));
    return () => {
      actif = false;
    };
  }, []);

  const expire = useCallback(() => setState({ status: 'pret', session: { authenticated: false } }), []);

  return <SessionContext.Provider value={{ state, expire }}>{children}</SessionContext.Provider>;
}
