// This is a workaround for https://github.com/eslint/eslint/issues/3458
require('@rushstack/eslint-config/patch/modern-module-resolution')

// This is a workaround for https://github.com/eslint/eslint/issues/3458
module.exports = {
  extends: [
    // @see https://www.npmjs.com/package/@rushstack/eslint-config
    '@rushstack/eslint-config/profile/node',
    // '@rushstack/eslint-config/mixins/friendly-locals'
    // @see https://www.npmjs.com/package/@rushstack/eslint-plugin-packlets
    // @rushstack/eslint-plugin-packlets
  ],
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    // '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-parameter-properties': [
      'error',
      { allows: ['public readonly', 'protected readonly', 'private readonly'] },
    ],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        // Unused function arguments often indicate a mistake in JavaScript code.  However in TypeScript code,
        // the compiler catches most of those mistakes, and unused arguments are fairly common for type signatures
        // that are overriding a base class method or implementing an interface.
        args: 'none',
        varsIgnorePattern: '[iI]gnored',
        ignoreRestSiblings: true,
      },
    ],
  },
}
