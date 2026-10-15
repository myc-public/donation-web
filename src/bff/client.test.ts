import { describe, expect, it } from 'vitest';

import { bffSimule } from '../test-utils';
import { BffError, getMyProfile, getSession, registerProfile } from './client';

const DONOR = { firstName: 'Marie', lastName: 'Curie', email: 'marie@example.org', country: 'MA' };

function entetes(init: RequestInit): Record<string, string> {
  return init.headers as Record<string, string>;
}

describe('client du BFF', () => {
  it('lecture : meme origine, sans cache, sans jeton CSRF', async () => {
    document.cookie = 'XSRF-TOKEN=jeton-1; path=/';
    const appels = bffSimule({ 'GET /bff/api/session': { status: 200, body: { authenticated: false } } });

    await expect(getSession()).resolves.toEqual({ authenticated: false });

    expect(appels[0]?.init.credentials).toBe('same-origin');
    expect(appels[0]?.init.cache).toBe('no-store');
    expect(entetes(appels[0]!.init)['X-XSRF-TOKEN']).toBeUndefined();
  });

  it('mutation : jeton CSRF du cookie dans X-XSRF-TOKEN, corps JSON', async () => {
    document.cookie = 'XSRF-TOKEN=jeton%2B2; path=/';
    const appels = bffSimule({ 'POST /bff/api/donors/me': { status: 201, body: DONOR } });

    await registerProfile({ lastName: 'Curie', firstName: 'Marie' });

    const init = appels[0]!.init;
    expect(init.credentials).toBe('same-origin');
    expect(entetes(init)['X-XSRF-TOKEN']).toBe('jeton+2');
    expect(entetes(init)['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body as string)).toEqual({ lastName: 'Curie', firstName: 'Marie' });
  });

  it('profil absent (404) : null, le front affiche le formulaire', async () => {
    bffSimule({ 'GET /bff/api/donors/me': { status: 404 } });
    await expect(getMyProfile()).resolves.toBeNull();
  });

  it('profil deja cree (409) : succes, le profil est relu', async () => {
    bffSimule({
      'POST /bff/api/donors/me': { status: 409 },
      'GET /bff/api/donors/me': { status: 200, body: DONOR },
    });
    await expect(registerProfile({ lastName: 'Curie', firstName: 'Marie' })).resolves.toEqual(DONOR);
  });

  it.each([401, 400, 502, 503])('statut %i : BffError avec le statut', async (status) => {
    bffSimule({ 'GET /bff/api/donors/me': { status } });
    await expect(getMyProfile()).rejects.toEqual(new BffError(status));
  });

  it('rien n est stocke dans le navigateur', async () => {
    bffSimule({
      'GET /bff/api/session': { status: 200, body: { authenticated: true, givenName: 'Marie' } },
      'GET /bff/api/donors/me': { status: 200, body: DONOR },
    });
    await getSession();
    await getMyProfile();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });
});
