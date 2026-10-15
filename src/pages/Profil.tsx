import { useEffect, useState, type FormEvent } from 'react';

import { BffError, getMyProfile, LOGIN_URL, registerProfile, type Donor } from '../bff/client';
import { useSession } from '../bff/session';

type Etat =
  | { etape: 'chargement' }
  | { etape: 'formulaire'; erreur?: string }
  | { etape: 'profil'; donor: Donor }
  | { etape: 'indisponible' };

function message(e: unknown): string {
  if (e instanceof BffError && e.status === 400) {
    return 'Certaines informations sont invalides.';
  }
  return 'Le service est momentanément indisponible. Merci de réessayer.';
}

/** DB10 : profil du donateur ; 404 -> formulaire pré-rempli par la session -> création. */
export function Profil() {
  const { state, expire } = useSession();
  const [etat, setEtat] = useState<Etat>({ etape: 'chargement' });
  const connecte = state.status === 'pret' && state.session.authenticated;

  useEffect(() => {
    if (!connecte) {
      return;
    }
    let actif = true;
    getMyProfile()
      .then((donor) => actif && setEtat(donor ? { etape: 'profil', donor } : { etape: 'formulaire' }))
      .catch((e: unknown) => {
        if (!actif) return;
        if (e instanceof BffError && e.status === 401) expire();
        else setEtat({ etape: 'indisponible' });
      });
    return () => {
      actif = false;
    };
  }, [connecte, expire]);

  if (state.status !== 'pret') {
    return null;
  }
  if (!state.session.authenticated) {
    return (
      <section>
        <h1>Mon profil</h1>
        <p>Votre session a expiré ou vous n'êtes pas connecté.</p>
        <a className="bouton" href={LOGIN_URL}>
          Se connecter
        </a>
      </section>
    );
  }
  const session = state.session;

  async function envoyer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const texte = (nom: string) => String(form.get(nom) ?? '').trim();
    const dateOfBirth = texte('dateOfBirth');
    const country = texte('country');
    try {
      const donor = await registerProfile({
        lastName: texte('lastName'),
        firstName: texte('firstName'),
        ...(dateOfBirth && { dateOfBirth }),
        ...(country && { country }),
      });
      setEtat({ etape: 'profil', donor });
    } catch (e) {
      if (e instanceof BffError && e.status === 401) expire();
      else setEtat({ etape: 'formulaire', erreur: message(e) });
    }
  }

  switch (etat.etape) {
    case 'chargement':
      return <p>Chargement du profil…</p>;
    case 'indisponible':
      return <p role="alert">{message(null)}</p>;
    case 'profil':
      return (
        <section>
          <h1>Mon profil</h1>
          <dl>
            <dt>Nom</dt>
            <dd>{etat.donor.lastName}</dd>
            <dt>Prénom</dt>
            <dd>{etat.donor.firstName}</dd>
            <dt>Email</dt>
            <dd>{etat.donor.email}</dd>
            <dt>Pays</dt>
            <dd>{etat.donor.country ?? '—'}</dd>
          </dl>
        </section>
      );
    case 'formulaire':
      return (
        <section>
          <h1>Créer mon profil de donateur</h1>
          {etat.erreur && <p role="alert">{etat.erreur}</p>}
          <form onSubmit={(e) => void envoyer(e)}>
            <label>
              Nom
              <input name="lastName" required maxLength={120} defaultValue={session.familyName ?? ''} />
            </label>
            <label>
              Prénom
              <input name="firstName" required maxLength={120} defaultValue={session.givenName ?? ''} />
            </label>
            <label>
              Date de naissance
              <input name="dateOfBirth" type="date" />
            </label>
            <label>
              Pays
              <input name="country" maxLength={80} />
            </label>
            <p>Email : {session.email}</p>
            <button type="submit">Créer mon profil</button>
          </form>
        </section>
      );
  }
}
