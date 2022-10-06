module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
    parser: "@babel/eslint-parser"
  },
  extends: ['prettier', 'eslint:recommended', 'plugin:node/recommended'],
  plugins: ['html', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    semi: ['error', 'always'],
  },
};
