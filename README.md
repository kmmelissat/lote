# Lote

Asistente para emprendedores que venden por redes sociales (Instagram, Facebook, WhatsApp) en El Salvador. Cada producto tiene su ficha con cantidad, estado, costo real y ganancia; los pedidos cubren apartado, cobro con abonos, envío y entrega. Se maneja desde un chat (en el panel y, con Meta, por WhatsApp), y hay una vitrina pública con enlace que se actualiza sola.

Es un proyecto del curso Diseño de Productos y Servicios (ciclo 3), no un producto para lanzar.

## Documentos

- [FEATURES.md](FEATURES.md): qué hace la app hoy, por tipo de persona (quien vende, quien compra, Marketplace, admin).
- [app.md](app.md): especificación del producto. Es la fuente de verdad.
- [PROGRESO.md](PROGRESO.md): estado de la construcción, decisiones y lo que sigue. Empezar por acá para retomar.
- [BRANDING.md](BRANDING.md): colores, formas, monitos y voz. Leer antes de tocar una pantalla.
- [AGENTS.md](AGENTS.md): aviso sobre la versión de Next.js (tiene cambios; leer `node_modules/next/dist/docs/` antes de escribir código).

## Stack

Next.js 16, React 19, TypeScript, Tailwind 4, Supabase (base de datos, autenticación y fotos), OpenAI (asistente y lectura de fotos), WhatsApp Cloud API de Meta (avisos) y Vitest.

## Cómo correrlo

```bash
npm install
npm run dev
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

El SQL vive en [supabase/](supabase/) y se corre a mano en el SQL Editor de Supabase, **una sola vez cada archivo y en este orden**: `schema`, `productos`, `reponer`, `fotos`, `importar`, `pedidos`, `cobros`, `envios`, `vitrina`, `asistente`, `gastos`, `asistente_gasto`, `rendimiento`, `unidades`, `seguimiento`, `variantes`, `equipo`, `avisos`, `avisos_eventos`, `avisos_tiempo`. `cron.sql` es opcional (vence apartados con `pg_cron`). El estado de cuáles ya se corrieron está en PROGRESO.md.

## Verificación

```bash
npx tsc --noEmit
npx eslint src
npx vitest run
npx next build
```

Las pruebas contra la IA real se saltan salvo con `RUN_LIVE_AI=1`. Después de `next build`, reiniciar `npm run dev`.

## Estructura

Organizado por funcionalidad. `src/app/` solo tiene rutas delgadas.

- `src/features/<tema>/`: todo lo de un tema (`repositorio.ts`, `ui/`, `actions/`). Temas: `products`, `orders`, `payments`, `shipping`, `profit`, `catalog`, `customers`, `import`, `export`, `assistant`, `ai`, `auth`, `team`, `tracking`, `whatsapp`, `home`.
- `src/domain/`: reglas de dinero y estados, funciones puras con pruebas. No importa de nada fuera de sí mismo.
- `src/components/` y `src/lib/`: piezas compartidas; los textos en español salvadoreño están en `src/lib/textos.ts`.
- `supabase/*.sql`: esquema y funciones.

ESLint hace cumplir las fronteras: entre features solo se importa `repositorio.ts`, tipos y lógica, nunca `ui/` ni `actions/`.

## Despliegue

Vercel. [vercel.json](vercel.json) llama a `/api/cron/avisos` una vez al día (el plan Hobby no permite más); exige `Authorization: Bearer <CRON_SECRET>`.
