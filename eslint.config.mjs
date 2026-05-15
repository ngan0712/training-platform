import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-plugin-tailwindcss is omitted: its worker-thread resolver cannot load the
  // Tailwind v4 CSS-only package at runtime (no tailwind.config.js). Class ordering
  // is handled instead by prettier-plugin-tailwindcss at format time.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
