module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-restricted-imports': 'off',
    '@typescript-eslint/no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['**/adapters/**', '**/http/**', '@aws-sdk/*', '@aws-lambda-powertools/*'],
          message: 'Domain layer cannot import from adapters, http, or AWS SDK.',
        },
      ],
    }],
  },
  overrides: [
    {
      files: ['src/domain/**/*.ts'],
      rules: {
        // Hexagonal: domain must not import infrastructure
        '@typescript-eslint/no-restricted-imports': ['error', {
          patterns: [
            { group: ['**/adapters/**'], message: 'Domain cannot import adapters.' },
            { group: ['**/http/**'], message: 'Domain cannot import http layer.' },
            { group: ['@aws-sdk/*'], message: 'Domain cannot import AWS SDK directly.' },
            { group: ['@aws-lambda-powertools/*'], message: 'Domain cannot import Powertools directly.' },
            { group: ['hono', 'hono/*'], message: 'Domain cannot import Hono.' },
          ],
        }],
      },
    },
    {
      files: ['**/*.test.ts', '**/*.integration.test.ts'],
      rules: {
        '@typescript-eslint/no-restricted-imports': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', '.aws-sam/', 'coverage/'],
};
