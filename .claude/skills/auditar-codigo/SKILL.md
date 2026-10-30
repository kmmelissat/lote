---
name: auditar-codigo
description: Audita buenas prácticas de código en Lote (Next.js App Router) — DRY, modularidad, arquitectura por features, fronteras entre capas, Server/Client Components, componentes grandes, tipos y pruebas. Úsala cuando se pida auditar, revisar calidad, buscar duplicación o evaluar la arquitectura de una feature, carpeta o rama. Solo lee; no modifica código.
---

# Auditar código (Lote / Next.js)

Auditoría **de solo lectura**. Entrega un informe priorizado; no edites archivos salvo que la usuaria lo pida después.

## 0. Antes de empezar

1. Lee `AGENTS.md`: esta versión de Next.js tiene cambios incompatibles. Ante dudas sobre una API o convención, consulta `node_modules/next/dist/docs/` en vez de asumir.
2. Lee la sección "Estructura" de `README.md` y, si el alcance toca UI, `BRANDING.md`.
3. Define el **alcance**: lo que la usuaria indicó (feature, carpeta, rama). Si no indicó nada, usa `git diff main...HEAD` más el estado sin commitear; si está vacío, pregunta. No audites todo el repo de golpe.
4. Corre las comprobaciones mecánicas en el alcance y guarda el resultado en el informe:
   - `npx tsc --noEmit`
   - `npm run lint`
   - `npx vitest run` (las pruebas con IA real se saltan solas sin `RUN_LIVE_AI=1`)

## 1. Reglas de arquitectura del proyecto

Son las que `README.md` declara; una violación es hallazgo **alto**.

- `src/app/` solo contiene rutas delgadas: leer params, llamar a un repositorio/feature, renderizar. Sin lógica de negocio ni consultas SQL/Supabase directas.
- `src/features/<tema>/` agrupa `repositorio.ts`, `ui/`, `actions/` y lógica propia del tema.
- Entre features solo se importa `repositorio.ts`, tipos y lógica; **nunca** `ui/` ni `actions/` de otra feature. Búscalo: `grep -rn "features/[a-z-]*/\(ui\|actions\)" src --include=*.ts --include=*.tsx` y compara contra la feature del archivo que importa.
- `src/domain/` son funciones puras (dinero, estados, ganancia) con pruebas y **sin imports** fuera de `domain`. Sin `fetch`, Supabase, `next/*` ni React.
- Los números (dinero, ganancia, totales) los calcula el código de `domain`, nunca la IA ni el componente.
- Textos de interfaz en español salvadoreño viven en `src/lib/textos`; strings sueltos repetidos o hardcodeados en JSX son hallazgo.
- Código compartido entre features va a `src/components/` o `src/lib/`, no se copia.

## 2. Qué buscar

### DRY
- Bloques casi idénticos (≥ ~8 líneas) en 2+ archivos: formularios, tarjetas, listas vacías, estados de carga/error, formateo de moneda/fecha, validaciones zod repetidas.
- Constantes mágicas duplicadas (estados, rutas, colores, límites). Debe haber una sola fuente.
- Utilidades reimplementadas que ya existen en `src/lib/` o `src/domain/` (`formato`, `dinero`, `slug`, `uuid`…). Busca antes de decir "falta una utilidad".
- Antes de proponer extraer, aplica la regla de tres: con 2 usos solo es hallazgo si la lógica es de negocio o es probable que divergan por error; no inventes abstracciones para código que solo se parece.

### Modularidad
- Componentes o archivos > ~250 líneas, o que mezclan 3+ responsabilidades (datos, estado, formulario, presentación).
- Funciones con > ~4 parámetros posicionales, flags booleanos que cambian el comportamiento, anidamiento > 3 niveles.
- `index.ts` barril que arrastra módulos de servidor a un bundle de cliente, o dependencias circulares entre módulos.
- Props drilling a 3+ niveles; props que son objetos enteros cuando solo se usan 1–2 campos.

### Next.js (App Router)
- `"use client"` innecesario o demasiado alto en el árbol: debe ir en la hoja interactiva más pequeña. Un componente sin estado, efectos ni handlers no necesita ser cliente.
- Datos que se piden en un Client Component con `useEffect` + fetch cuando podrían venir de un Server Component.
- Módulos de servidor (Supabase service role, `openai`, secretos) importados desde código de cliente; faltan `import "server-only"` en módulos que deben ser solo de servidor. Verifica que ninguna variable secreta use el prefijo `NEXT_PUBLIC_`.
- Server Actions y Route Handlers (`actions/`, `app/api/`): validan la entrada (zod / `src/lib/entrada.ts`), comprueban sesión y pertenencia al negocio, y no confían en IDs que llegan del cliente. Esto es seguridad: hallazgo **alto** si falta.
- Consultas secuenciales independientes que deberían ir con `Promise.all`; consultas en bucle (N+1).
- Falta de `loading.tsx` / `error.tsx` / `not-found.tsx` / Suspense donde la ruta hace trabajo lento.
- Caché y revalidación: `revalidatePath`/`revalidateTag` tras mutaciones; páginas públicas (`/c`, `/p`, `/marketplace`) con metadata, `sitemap` y JSON-LD coherentes.
- `<img>` en vez de `next/image` sin motivo; fuentes o imágenes sin dimensiones (CLS).
- Claves `key` por índice en listas dinámicas; efectos con dependencias incompletas o que deberían ser derivados/handlers.

### TypeScript y datos
- `any`, `as` forzados, `!` no justificados, `@ts-ignore` / `@ts-expect-error` sin comentario.
- Tipos duplicados a mano que deberían salir de zod (`z.infer`) o de los tipos generados de Supabase.
- Errores tragados (`catch {}`), `console.log` olvidados, `TODO`/`FIXME` sin dueño.

### Pruebas
- Lógica en `domain/` o `repositorio.ts` sin `*.test.ts` al lado (el repo ya sigue esa convención).
- Pruebas que solo testean la implementación (mocks de todo) o que dependen de la IA real sin la guarda `RUN_LIVE_AI`.

### Marca y accesibilidad (solo si el alcance toca UI)
- Estilos que se salen de `BRANDING.md`; colores/espaciados hardcodeados en vez de tokens de Tailwind/`globals.css`.
- Botones/inputs sin etiqueta accesible, imágenes sin `alt`, objetivos táctiles < 44px (la app es mobile first, una mano).

## 3. Método

1. Mapea el alcance con `Glob`/`Grep` (tamaños con `wc -l`, imports con `grep`). Lee los archivos grandes o sospechosos completos; no juzgues por el nombre.
2. Para cada hallazgo **verifica** abriendo el código. Descarta lo que sea preferencia de estilo, ya lo cubra ESLint, o no tenga una consecuencia concreta (bug, costo de mantenimiento real, riesgo de seguridad).
3. Para duplicación, cita **todos** los lugares (`ruta:línea`) y di dónde debería vivir lo compartido según las reglas de la sección 1.
4. Si el alcance es grande (> ~30 archivos), reparte por feature en subagentes `Explore` en paralelo y reconcilia los resultados tú; verifica sus hallazgos antes de reportarlos.

## 4. Formato del informe (en español)

```
# Auditoría: <alcance>
Comprobaciones: tsc ✅/❌ · lint ✅/❌ · pruebas ✅/❌ (resumen de fallos)

## Resumen
2–4 líneas: estado general y los 2–3 problemas que más importan.

## Hallazgos
### 🔴 Alta — rompe una regla de arquitectura, seguridad o produce bugs
### 🟠 Media — duplicación o acoplamiento que ya cuesta mantener
### 🟡 Baja — limpieza, consistencia

Cada hallazgo:
- **Título corto** — `ruta:línea` (y demás ubicaciones)
  - Problema: qué pasa y por qué importa (una frase).
  - Sugerencia: cambio concreto y dónde ubicarlo.
  - Esfuerzo: S / M / L

## Lo que está bien
Máx. 3 puntos, solo si son reales y específicos.

## Orden sugerido
Lista numerada de qué arreglar primero (agrupa lo que se resuelve junto).
```

Reglas del informe: sin relleno ni elogios genéricos; cada hallazgo con ubicación exacta; si algo no se pudo verificar, dilo; si no hay hallazgos en una categoría, omítela. Termina ofreciendo aplicar los arreglos por orden de prioridad, **sin hacerlo** hasta que la usuaria confirme. Ella corre el SQL y hace sus propios commits: si un arreglo requiere cambios en `supabase/*.sql`, descríbelo pero no lo ejecutes.
