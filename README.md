# Lote

Tu tienda en línea y tus cuentas claras, para emprendedores que venden por redes sociales (Instagram, Facebook, WhatsApp) en El Salvador. Afuera, una tienda con enlace (la vitrina) y el Marketplace, donde te compran, te apartan o solo ven tu catálogo. Adentro, cada producto con su ficha, costo real y ganancia; pedidos con cobro, abonos, envío y entrega; gastos y balance. Se maneja desde un chat (en el panel y, con Meta, por WhatsApp).

Es un proyecto del curso Diseño de Productos y Servicios (ciclo 3), no un producto para lanzar.

## Documentos

- [FEATURES.md](docs/FEATURES.md): qué hace la app hoy y el mapa del repo (cada sección, sus rutas y su código). **Empezar por acá para retomar.**
- [ARQUITECTURA.md](docs/ARQUITECTURA.md): cómo está armado por dentro: frontend, servidor, base de datos, APIs y SEO.
- [app.md](docs/app.md): especificación del producto. Es la fuente de verdad.
- [PROGRESO.md](docs/PROGRESO.md): bitácora de la construcción. Histórico, está desactualizado.
- [BRANDING.md](docs/BRANDING.md): colores, formas, monitos y voz. Leer antes de tocar una pantalla.
- [REDISENO.md](docs/REDISENO.md): rediseño del panel, componentes y estado por pantalla.
- [GESTION.md](docs/GESTION.md): el balance general (dinero, deudas e inventario).
- [AGENTS.md](AGENTS.md): aviso sobre la versión de Next.js (tiene cambios; leer `node_modules/next/dist/docs/` antes de escribir código).

## Stack

Next.js 16, React 19, TypeScript, Tailwind 4, Supabase (base de datos, autenticación y fotos), OpenAI (asistente y lectura de fotos), WhatsApp Cloud API de Meta (avisos) y Vitest.

## Cómo correrlo

```bash
pnpm install
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### Variables de entorno

Crear `.env.local` (no se sube a git):

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | El proyecto de Supabase |
| `HUELLA_SECRETO` | Hashea el IP al limitar intentos de apartar desde la vitrina |
| `OPENAI_API_KEY` | La IA del asistente. Opcional `ASISTENTE_MODELO` (por defecto `gpt-4.1-mini`). Sin ella el chat solo responde "ayuda" y "deshacer" |
| `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` | La tarea que envía los avisos. La clave de servicio nunca va al navegador |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | La API de Meta. Opcionales: `WHATSAPP_API_VERSION`, `WHATSAPP_IDIOMA` |
| `WHATSAPP_CANAL=consola` | Imprime los avisos en la consola del servidor en vez de mandarlos (para la demo) |

### Base de datos

El SQL vive en [supabase/](supabase/) y se corre a mano en el SQL Editor de Supabase, **una sola vez cada archivo y en orden**: varias funciones se vuelven a crear en archivos posteriores y la última gana. El orden completo y cuáles ya se corrieron están en [PROGRESO.md](docs/PROGRESO.md#sql-en-supabase). `cron.sql` es opcional (vence apartados con `pg_cron`).

Para ver cómo queda la base sin recorrer todos los archivos: `pnpm esquema` arma [docs/esquema_actual.sql](docs/esquema_actual.sql) con la última versión de cada tabla, función y política (solo para leer, no se corre). También avisa lo que está en la base y en ningún `.sql`.

## Verificación

```bash
npx tsc --noEmit
npx eslint src
npx vitest run
npx next build
```

Las pruebas contra la IA real se saltan salvo con `RUN_LIVE_AI=1`. Después de `next build`, reiniciar `pnpm dev`.

## Estructura

Organizado por funcionalidad. Todo se renderiza en el servidor; `"use client"` solo donde hay interacción.

- `src/app/`: las rutas de Next, delgadas. Piden los datos y arman la pantalla con lo que traen de las features.
- `src/features/<tema>/`: todo lo de un tema: `repositorio.ts` (la base), `ui/` (componentes), `actions/` (Server Actions) y su lógica con pruebas al lado (`*.test.ts`). Temas:
  - Vender: `products`, `orders`, `customers`, `payments`, `shipping`, `tracking`, `offers`, `promotions`, `counter` (el Mostrador), `import`, `export`.
  - Dinero: `gestion` (balance general), `profit` (ganancia y gastos).
  - La tienda afuera: `catalog` (vitrina y Marketplace), `reviews`, `store-settings`, `search`.
  - Lotito y avisos: `assistant`, `ai`, `whatsapp`.
  - El resto: `auth`, `team`, `home` (Inicio), `landing`, `ayuda`, `admin`, `design-system`.
- `src/domain/`: reglas de dinero, estados, fechas y texto. Funciones puras con pruebas; no importa de nada fuera de sí mismo.
- `src/components/`: piezas de interfaz compartidas: `ui/` (botones, tarjetas, campos) y `nav/` (el menú).
- `src/lib/`: lo compartido que no es interfaz: Supabase, formato de dinero y fechas, fotos, enlaces (`ruta.ts`) y los textos en español salvadoreño (`src/lib/textos/`, un archivo por pantalla).
- `src/proxy.ts`: qué rutas piden sesión. `src/test/`: el Supabase falso de las pruebas.
- `supabase/*.sql`: esquema y funciones.

ESLint hace cumplir las fronteras:

- Entre features solo se importa `repositorio.ts`, tipos y lógica, nunca `ui/` ni `actions/`.
- `components/` no importa de las features ni de las rutas. La excepción es `components/nav/`: el menú es la carcasa de la app y conoce las features (cerrar sesión, la búsqueda).
- `domain/` no importa de nada.

Otras reglas que revisa el compilador:

- **Enlaces tipados** (`typedRoutes`): cada `href` de `Link` y cada `router.push` se valida contra las páginas que existen. Una ruta armada con datos se guarda con `ruta()`, y una con parámetros con `conBusqueda()` (`src/lib/ruta.ts`); nunca con `as Route`, que acepta cualquier texto.
- **Secretos solo en el servidor**: los archivos que leen claves (`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `WHATSAPP_TOKEN`, `HUELLA_SECRETO`) importan `server-only`: si algo del navegador los importa, el build falla.

## Despliegue

Vercel. [vercel.json](vercel.json) llama a `/api/cron/avisos` una vez al día (el plan Hobby no permite más); exige `Authorization: Bearer <CRON_SECRET>`.
