import js from '@eslint/js'

export default [
  { ignores: ['dist/**', 'dist-showcase/**', 'node_modules/**'] },
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        globalThis: 'readonly',
        URL: 'readonly',
        TextDecoder: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
  },
]
