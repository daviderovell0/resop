module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: ['prettier', 'airbnb-base'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'prettier/prettier': 'error',
    'comma-dangle': 'off',
    'no-console': 'off',
    'class-methods-use-this': 'off',
    'no-throw-literal': 'off',
    'implicit-arrow-linebreak': 'off',
    'object-curly-newline': 'off',
    'linebreak-style': 'off',
    'import/first': 'off',
    'import/extensions': 'off',
    'operator-linebreak': 'off',
  },
};
