import js from '@eslint/js'

export default [
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
  js.configs.recommended,
]
