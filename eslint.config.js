import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier/recommended';

export default [
  ...tseslint.configs.recommended,
  prettierPlugin,
];
