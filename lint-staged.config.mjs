/** @type {import('lint-staged').Config} */
const config = {
  "*.{ts,tsx}": ["prettier --write", "eslint --fix"],
  "*.{js,mjs,cjs}": ["prettier --write", "eslint --fix"],
  "*.{json,css,md}": ["prettier --write"],
};

export default config;
