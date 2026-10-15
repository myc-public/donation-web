import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  // Cookies du navigateur simule (XSRF-TOKEN) remis a zero entre les tests
  document.cookie.split('; ').forEach((c) => {
    const nom = c.split('=')[0];
    if (nom) document.cookie = `${nom}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
});
