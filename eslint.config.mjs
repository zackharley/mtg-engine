// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import jestPlugin from 'eslint-plugin-jest';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/',
      '*.d.ts',
      '*.config.ts',
      '*.config.js',
      '*.config.mjs',
      'jest.config.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      jest: jestPlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
      },
      globals: {
        ...jestPlugin.environments.globals.globals,
      },
    },
    rules: {
      // Clean Code & Functional Programming Principles
      'prefer-const': 'error',
      'no-var': 'error',
      'no-param-reassign': 'error',

      // TypeScript-specific rules aligned with strict mode
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',

      // Code quality & composability
      complexity: ['warn', 10],
      'max-lines-per-function': [
        'warn',
        {
          max: 50,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      'max-depth': ['warn', 4],
      'max-params': ['warn', 4],

      // Functional programming preferences
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',
      'prefer-spread': 'warn',
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'ForInStatement',
          message:
            'Prefer array methods (map, filter, reduce) over for-in loops',
        },
        {
          selector: 'ForOfStatement',
          message:
            'Prefer array methods (map, filter, reduce) over for-of loops when possible',
        },
      ],

      // Error handling (aligned with readable error handling principle)
      'no-throw-literal': 'error',
      '@typescript-eslint/only-throw-error': 'error',

      // Jest-specific
      'jest/expect-expect': 'warn',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',

      // General code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      curly: ['error', 'all'],
    },
  },
  {
    files: [
      '**/*.test.ts',
      '**/__tests__/**/*.ts',
      '**/__integration-tests__/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'max-lines-per-function': 'off',
    },
  },
  {
    files: ['*.config.ts', '*.config.js', '*.config.mjs', 'jest.config.ts'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettierConfig,
);
