import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

const RENDERER_SURFACE = ['@canvas/*', '@catalog/*', '@topbar/*', '@welcome/*', '@layout/*', '@state/*']
const PURE_DOMAIN_FORBIDDEN = [...RENDERER_SURFACE, '@adapters/*', '@contracts/*']

export default tseslint.config(
  { ignores: ['dist', 'out', 'node_modules', '*.config.*', 'electron/preload.cjs'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'warn'
    }
  },
  {
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: PURE_DOMAIN_FORBIDDEN }]
    }
  },
  {
    files: ['electron/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: RENDERER_SURFACE }]
    }
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/rules-of-hooks': 'off'
    }
  }
)
