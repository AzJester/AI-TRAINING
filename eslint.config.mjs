import eslint from "@eslint/js";
import react from "@eslint-react/eslint-plugin";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      ".vinext/**",
      ".wrangler/**",
      "build/**",
      "dist/**",
      "node_modules/**",
      "out/**",
      "next-env.d.ts",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [
      "*.{js,mjs}",
      "build/**/*.{js,mjs,ts}",
      "scripts/**/*.{js,mjs,ts}",
      "tests/**/*.{js,mjs,ts}",
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    ...react.configs["recommended-typescript"],
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      ...react.configs["recommended-typescript"].rules,
      "@eslint-react/no-array-index-key": "off",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
