import js from "@eslint/js";
import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    ignores: ["dist", "node_modules"],
  },
  {
    files: ["src/**/*.{ts,tsx}", "*.{ts,tsx}", "**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        tsconfigRootDir: new URL(".", import.meta.url),
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        React: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/prefer-as-const": "off",
      "no-empty": "off",
      "no-irregular-whitespace": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
];
