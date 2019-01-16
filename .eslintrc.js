module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/essential',
    '@vue/standard'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'curly': [2, 'multi-or-nest'],
    // 'brace-style': [2, '1tbs'],
    'no-trailing-spaces': [2]
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}