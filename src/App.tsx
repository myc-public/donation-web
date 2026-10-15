import { Link, Route, Routes } from 'react-router';

import { useSession } from './bff/session';
import { Deconnexion } from './components/Deconnexion';
import { Accueil } from './pages/Accueil';
import { Profil } from './pages/Profil';

function PageIntrouvable() {
  return (
    <section>
      <h1>Page introuvable</h1>
      <Link to="/">Retour à l'accueil</Link>
    </section>
  );
}

export function App() {
  const { state } = useSession();
  const connecte = state.status === 'pret' && state.session.authenticated;

  return (
    <>
      <header>
        <Link to="/">Espace donateur</Link>
        {connecte && (
          <nav>
            <Link to="/profil">Mon profil</Link>
            <Deconnexion />
          </nav>
        )}
      </header>
      <main>
        {state.status === 'chargement' && <p>Chargement…</p>}
        {state.status === 'erreur' && (
          <p role="alert">Le service est momentanément indisponible. Merci de réessayer.</p>
        )}
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="*" element={<PageIntrouvable />} />
        </Routes>
      </main>
    </>
  );
}
