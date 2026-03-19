import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // Enforce explicit return types on exported functions (CLAUDE.md requirement)
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      // No any — use unknown and narrow
      '@typescript-eslint/no-explicit-any': 'error',
      // No non-null assertions without justification
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // React hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // React 19 — no need to import React for JSX
      'react/react-in-jsx-scope': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    // Relax some rules in story and test files
    files: ['**/*.stories.tsx', '**/*.test.tsx', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'storybook-static/**'],
  },
);
