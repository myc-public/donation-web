import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';

import { SessionProvider } from './bff/SessionProvider';

export interface Appel {
  url: string;
  init: RequestInit;
}

/** BFF simule : reponses par "METHODE chemin" ; garde la trace des appels (URL, options fetch). */
export function bffSimule(reponses: Record<string, { status: number; body?: unknown }>): Appel[] {
  const appels: Appel[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      appels.push({ url, init });
      const cle = `${init.method ?? 'GET'} ${url}`;
      const reponse = reponses[cle];
      if (!reponse) {
        throw new Error(`appel inattendu : ${cle}`);
      }
      return new Response(reponse.body === undefined ? null : JSON.stringify(reponse.body), {
        status: reponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );
  return appels;
}

export const SESSION_CONNECTEE = {
  status: 200,
  body: { authenticated: true, givenName: 'Marie', familyName: 'Curie', email: 'marie@example.org' },
};

export const SESSION_ANONYME = { status: 200, body: { authenticated: false } };

export function rendu(element: ReactElement, url = '/') {
  return render(
    <SessionProvider>
      <MemoryRouter initialEntries={[url]}>{element}</MemoryRouter>
    </SessionProvider>,
  );
}
