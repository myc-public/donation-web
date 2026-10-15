import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Garde-fous de securite du front (DF4) : rien n'est stocke dans le navigateur, pas de HTML injecte, pas de code
// evalue. Les donnees du BFF restent dans l'etat React.
const securite = {
  'no-restricted-globals': [
    'error',
    { name: 'localStorage', message: 'Rien dans le navigateur : la session est cote BFF (DF4).' },
    { name: 'sessionStorage', message: 'Rien dans le navigateur : la session est cote BFF (DF4).' },
    { name: 'indexedDB', message: 'Rien dans le navigateur : la session est cote BFF (DF4).' },
  ],
  'no-restricted-properties': [
    'error',
    { object: 'window', property: 'localStorage', message: 'Rien dans le navigateur (DF4).' },
    { object: 'window', property: 'sessionStorage', message: 'Rien dans le navigateur (DF4).' },
    { object: 'window', property: 'indexedDB', message: 'Rien dans le navigateur (DF4).' },
  ],
  'no-restricted-syntax': [
    'error',
    {
      selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
      message: 'HTML injecte interdit (XSS).',
    },
    { selector: "MemberExpression[property.name='innerHTML']", message: 'innerHTML interdit (XSS).' },
  ],
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
};

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.strict],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      ...securite,
    },
  },
  {
    files: ['*.{js,mjs,mts,ts}', 'scripts/**', 'e2e/**'],
    languageOptions: { globals: globals.node },
  },
  {
    // Les tests lisent le stockage du navigateur pour verifier qu'il reste vide
    files: ['src/**/*.test.{ts,tsx}', 'e2e/**'],
    rules: {
      'no-restricted-properties': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
);
