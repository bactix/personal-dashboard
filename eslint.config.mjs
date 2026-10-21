import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Architecture boundaries — see docs/ARCHITECTURE.md and AGENTS.md.
const noApp = {
  group: ["@/app/**"],
  message: "Features must not import from app/.",
};
// Another feature may be used only through its public entry: "@/features/<x>" (client-safe)
// or, from a server.ts, "@/features/<x>/server". Never deep paths, never cycles.
const noDeepFeatureImports = {
  group: ["@/features/*/*"],
  message:
    "Import another feature only via its public entry (@/features/<name>), or @/features/<name>/server from server.ts.",
};
const noServerEnvInClient = {
  group: ["@/lib/env"],
  message: "lib/env is server-only. Use it only from features/*/server.ts or route handlers.",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Feature code (client-safe by default).
    files: ["src/features/**/*.{ts,tsx}"],
    ignores: ["src/features/**/server.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [noApp, noDeepFeatureImports, noServerEnvInClient] },
      ],
    },
  },
  {
    // A feature's server module may read env, but still can't reach into other features.
    files: ["src/features/**/server.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            noApp,
            {
              group: ["@/features/*/*", "!@/features/*/server"],
              message: noDeepFeatureImports.message,
            },
          ],
        },
      ],
    },
  },
  {
    // Shared layers sit below features and must never depend on them.
    files: ["src/components/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/features/**"],
              message: "Shared code (components/lib/hooks) must not import from features/.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
