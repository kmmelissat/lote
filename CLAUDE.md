@AGENTS.md
@README.md

## Leer poco

- El mapa del proyecto está en la sección "Estructura" del README: andá directo a la feature (`src/features/<tema>/`) en vez de explorar carpetas.
- **Cómo está la base hoy:** `docs/esquema_actual.sql` tiene la última versión de cada tabla, función y política. Buscá con grep `-- función <nombre>` o `-- tabla <nombre>` y leé solo ese tramo; no recorras `supabase/*.sql`. Si agregás o cambiás un `.sql`, corré `pnpm esquema`.
- `src/lib/supabase/database.types.ts` (~2 400 líneas, generado): buscá la tabla o función con grep y leé solo ese tramo.
- `docs/app.md` es la fuente de verdad pero es largo: buscá la sección (§) que necesitás y leé solo esa. Los demás `docs/*.md`, solo si la tarea los toca (`BRANDING.md` para pantallas).
- Archivos grandes (`SistemaDeDiseno.tsx`, `motor.test.ts`, `src/lib/textos/productos.ts`): leé por rangos.
- No abras los lockfiles ni `tsconfig.tsbuildinfo`.
- Verificá con el alcance más chico que sirva: `npx vitest run <carpeta> --reporter=dot`, `npx eslint <archivos>`. La suite entera y `next build`, solo al cerrar una tarea grande.
