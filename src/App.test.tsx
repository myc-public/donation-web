import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { bffSimule, rendu, SESSION_ANONYME, SESSION_CONNECTEE } from './test-utils';

const DONOR = { firstName: 'Marie', lastName: 'Curie', email: 'marie@example.org', country: 'MA' };

describe('accueil', () => {
  it('anonyme : lien de connexion vers le BFF (navigation pleine page)', async () => {
    bffSimule({ 'GET /bff/api/session': SESSION_ANONYME });
    rendu(<App />);

    const lien = await screen.findByRole('link', { name: 'Se connecter' });
    expect(lien).toHaveAttribute('href', '/bff/oauth2/authorization/keycloak');
    expect(screen.queryByRole('button', { name: 'Se déconnecter' })).not.toBeInTheDocument();
  });

  it('retour de connexion en echec : message', async () => {
    bffSimule({ 'GET /bff/api/session': SESSION_ANONYME });
    rendu(<App />, '/?connexion=echec');

    expect(await screen.findByRole('alert')).toHaveTextContent("La connexion n'a pas abouti");
  });

  it('BFF injoignable : message, pas de connexion proposee', async () => {
    bffSimule({ 'GET /bff/api/session': { status: 503 } });
    rendu(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('momentanément indisponible');
  });

  it('connecte : prenom, lien profil et deconnexion par formulaire POST avec jeton CSRF', async () => {
    document.cookie = 'XSRF-TOKEN=jeton-3; path=/';
    bffSimule({ 'GET /bff/api/session': SESSION_CONNECTEE });
    const { container } = rendu(<App />);

    expect(await screen.findByRole('heading', { name: 'Bonjour Marie' })).toBeInTheDocument();
    const formulaire = container.querySelector('form[action="/bff/logout"]') as HTMLFormElement;
    expect(formulaire.method).toBe('post');
    const csrf = formulaire.querySelector('input[name="_csrf"]') as HTMLInputElement;
    formulaire.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    expect(csrf.value).toBe('jeton-3');
  });
});

describe('profil (DB10)', () => {
  it('profil existant : affiche les 4 champs', async () => {
    bffSimule({ 'GET /bff/api/session': SESSION_CONNECTEE, 'GET /bff/api/donors/me': { status: 200, body: DONOR } });
    rendu(<App />, '/profil');

    expect(await screen.findByText('marie@example.org')).toBeInTheDocument();
    expect(screen.getByText('MA')).toBeInTheDocument();
  });

  it('pas de profil (404) : formulaire pre-rempli par la session, creation puis affichage', async () => {
    document.cookie = 'XSRF-TOKEN=jeton-4; path=/';
    const appels = bffSimule({
      'GET /bff/api/session': SESSION_CONNECTEE,
      'GET /bff/api/donors/me': { status: 404 },
      'POST /bff/api/donors/me': { status: 201, body: DONOR },
    });
    rendu(<App />, '/profil');

    expect(await screen.findByLabelText('Nom')).toHaveValue('Curie');
    expect(screen.getByLabelText('Prénom')).toHaveValue('Marie');
    await userEvent.type(screen.getByLabelText('Pays'), 'MA');
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon profil' }));

    expect(await screen.findByText('marie@example.org')).toBeInTheDocument();
    const post = appels.find((a) => a.init.method === 'POST');
    expect(JSON.parse(post!.init.body as string)).toEqual({ lastName: 'Curie', firstName: 'Marie', country: 'MA' });
  });

  it('saisie refusee (400) : message, formulaire conserve', async () => {
    bffSimule({
      'GET /bff/api/session': SESSION_CONNECTEE,
      'GET /bff/api/donors/me': { status: 404 },
      'POST /bff/api/donors/me': { status: 400 },
    });
    rendu(<App />, '/profil');

    await userEvent.click(await screen.findByRole('button', { name: 'Créer mon profil' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('invalides');
  });

  it('session expiree (401) : propose la reconnexion', async () => {
    bffSimule({ 'GET /bff/api/session': SESSION_CONNECTEE, 'GET /bff/api/donors/me': { status: 401 } });
    rendu(<App />, '/profil');

    await waitFor(() => expect(screen.getByText(/session a expiré/)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Se connecter' })).toHaveAttribute('href', '/bff/oauth2/authorization/keycloak');
  });

  it('route inconnue : page introuvable', async () => {
    bffSimule({ 'GET /bff/api/session': SESSION_ANONYME });
    rendu(<App />, '/nimporte');

    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
  });
});
