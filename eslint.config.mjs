import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2015,
      sourceType: 'module',
    },
  },
  {
    ignores: [
      "dist/**",
      "lib/**",
      "node_modules/**",
    ],
  },
]
