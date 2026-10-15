import { createContext, useContext } from 'react';

import type { Session } from './client';

export type SessionState = { status: 'chargement' } | { status: 'erreur' } | { status: 'pret'; session: Session };

export interface SessionContextValue {
  state: SessionState;
  /** Session perdue (401 du BFF) : repasse en anonyme sans recharger la page. */
  expire: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession hors de SessionProvider');
  }
  return value;
}
