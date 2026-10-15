// Client du BFF (web-bff) : meme origine, cookie de session HttpOnly gere par le navigateur, jamais de token ici.
// Mutations : jeton CSRF du cookie XSRF-TOKEN renvoye dans l'en-tete X-XSRF-TOKEN (le BFF verifie aussi l'Origin).

export const LOGIN_URL = '/bff/oauth2/authorization/keycloak';
export const LOGOUT_URL = '/bff/logout';

export type Session =
  | { authenticated: true; givenName: string | null; familyName: string | null; email: string | null }
  | { authenticated: false };

export interface Donor {
  firstName: string;
  lastName: string;
  email: string;
  country: string | null;
}

export interface DonorCreate {
  lastName: string;
  firstName: string;
  dateOfBirth?: string;
  country?: string;
}

/** Erreur du BFF : 401 = reconnexion, 502 / 503 = service indisponible, 400 = saisie refusee. */
export class BffError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`BFF : statut ${status}`);
    this.name = 'BffError';
    this.status = status;
  }
}

/** Jeton CSRF pose par le BFF dans le cookie lisible XSRF-TOKEN. */
export function xsrfToken(): string | undefined {
  const cookie = document.cookie.split('; ').find((c) => c.startsWith('XSRF-TOKEN='));
  return cookie ? decodeURIComponent(cookie.substring('XSRF-TOKEN='.length)) : undefined;
}

async function request(method: 'GET' | 'POST', path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const init: RequestInit = { method, credentials: 'same-origin', headers, cache: 'no-store' };
  if (method !== 'GET') {
    const token = xsrfToken();
    if (token) {
      headers['X-XSRF-TOKEN'] = token;
    }
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  return fetch(path, init);
}

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new BffError(response.status);
  }
  return (await response.json()) as T;
}

export async function getSession(): Promise<Session> {
  return json<Session>(await request('GET', '/bff/api/session'));
}

/** Profil du donateur connecte ; null = pas encore de profil (404 : afficher le formulaire, DB10). */
export async function getMyProfile(): Promise<Donor | null> {
  const response = await request('GET', '/bff/api/donors/me');
  if (response.status === 404) {
    return null;
  }
  return json<Donor>(response);
}

/** Creation du profil ; 409 = deja cree (double clic, autre onglet) : succes, on relit le profil. */
export async function registerProfile(donor: DonorCreate): Promise<Donor> {
  const response = await request('POST', '/bff/api/donors/me', donor);
  if (response.status === 409) {
    const existing = await getMyProfile();
    if (existing) {
      return existing;
    }
  }
  return json<Donor>(response);
}
