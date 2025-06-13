import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    ignores: [
      'dist',
      'vite.config.ts'
    ],
    rules: {
      'comma-dangle': 0,
      'curly': 0,
      'eqeqeq': 0,
      'indent': [1, 2, { 'SwitchCase': 1 }],
      'key-spacing': 1,
      'multiline-ternary': 0,
      'no-bitwise': 0,
      'no-multiple-empty-lines': 0,
      'no-shadow': 0,
      'no-unexpected-multiline': 0,
      'no-unused-vars': 0,
      'no-trailing-spaces': 0,
      'object-curly-spacing': [1, 'always'],
      'padded-blocks': 0,
      'promise/param-names': 0,
      'quote-props': 0,
      'quotes': [0, 'single', 'avoid-escape'],
      'semi': [1, 'always'],

      // Node
      'n/no-callback-literal': 0,

      // Typescript
      '@typescript-eslint/comma-dangle': 0,
      '@typescript-eslint/consistent-type-assertions': 0,
      '@typescript-eslint/dot-notation': 0,
      '@typescript-eslint/explicit-function-return-type': 0,
      '@typescript-eslint/promise-function-async': 0,
      '@typescript-eslint/naming-convention': 0,
      '@typescript-eslint/no-dynamic-delete': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-floating-promises': 0,
      '@typescript-eslint/no-misused-promises': 0,
      '@typescript-eslint/no-non-null-assertion': 0,
      '@typescript-eslint/no-throw-literal': 0,
      '@typescript-eslint/no-unused-vars': [1, { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      '@typescript-eslint/prefer-nullish-coalescing': 0,
      '@typescript-eslint/restrict-template-expressions': 0,
      '@/space-before-function-paren': [
        'error',
        { anonymous: 'always', 'named': 'never', 'asyncArrow': 'always' }
      ],
      '@typescript-eslint/strict-boolean-expressions': 0,
      '@typescript-eslint/triple-slash-reference': 0
    }
  })
