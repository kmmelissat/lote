<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Docs de Next sin gastar de más

`node_modules/next/dist/docs/` pesa 4.4 MB (474 archivos). Consultalo cuando uses una API, convención o archivo especial de Next que no veas ya usado en el repo: buscá con grep el término (por ejemplo `proxy`, `typedRoutes`, `cacheComponents`) y leé solo el archivo que aparezca. Para cambios de lógica, textos o estilos no hace falta abrirlo; el código del repo ya muestra cómo se usa Next acá.

Para saber cómo está la base de datos, leé `docs/esquema_actual.sql` (se regenera con `pnpm esquema`) en vez de recorrer `supabase/*.sql`.
