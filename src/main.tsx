import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import { App } from './App';
import { SessionProvider } from './bff/SessionProvider';
import './styles.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Element #root absent de index.html');
}

createRoot(root).render(
  <StrictMode>
    <SessionProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SessionProvider>
  </StrictMode>,
);
