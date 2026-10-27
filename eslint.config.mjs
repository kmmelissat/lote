import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Fronteras entre capas. Dentro de una feature se importa con rutas relativas; hacia otra feature,
  // solo su repositorio y sus tipos, nunca su ui/ ni sus actions/.
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*"],
              message: "Una feature no depende de las rutas: app/ importa de features/, no al revés.",
            },
            {
              group: ["@/features/*/ui/*", "@/features/*/actions/*"],
              message: "No importes la ui/ ni las actions/ de otra feature. Dentro de la misma feature usá rutas relativas.",
            },
          ],
        },
      ],
    },
  },
  // domain/ son reglas puras: no conoce la base, la interfaz ni las features.
  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*", "@/features/*", "@/lib/*", "@/components/*"],
              message: "domain/ es lógica pura: no importa de la interfaz, la base ni las features.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
