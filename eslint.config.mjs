import coreWebVitals from "eslint-config-next/core-web-vitals"

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "project-context/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
  ...coreWebVitals,
  {
    rules: {
      // El código legacy v0 se corrige por capas (ADR 0001, deuda D1); estos avisos
      // no bloquean el ciclo pero permanecen visibles. El código nuevo no los genera.
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react/no-unescaped-entities": "warn",
      "@next/next/no-img-element": "warn",
    },
  },
]

export default eslintConfig
