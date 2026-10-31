// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier');

module.exports = tseslint.config(
  { ignores: ['dist/', 'android/', '.angular/', 'test-results/', 'e2e/screenshots/'] },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      ...angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['playwright.config.ts', 'capacitor.config.ts'] },
        tsconfigRootDir: __dirname,
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-standalone': 'error',
      // Records in the local copy can predate fields added by later migrations, so guards on them stay.
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      complexity: ['error', 8],
      'max-depth': ['error', 3],
      'max-params': ['error', 3],
      'max-lines-per-function': ['error', { max: 30, skipBlankLines: true, skipComments: true }],
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
      'no-console': 'error',
      'no-nested-ternary': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['**/*.spec.ts', 'e2e/**/*.ts'],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
  prettier,
);
