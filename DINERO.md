# Dinero: de "Ganancia" a un balance del negocio

Nota de traspaso para otro agente. Léela completa antes de tocar código. El diseño ya está aprobado por la dueña del proyecto; lo que sigue es construirlo.

- **Prototipo visual (aprobado):** [docs/dinero-prototipo.html](docs/dinero-prototipo.html) (ábrelo en el navegador). También está publicado como artifact: https://claude.ai/artifact/2BfBjX1CFjc3BBFNURf6V6 (es privado de su cuenta; el archivo del repo es el que no se pierde). Los números del prototipo son de ejemplo.
- **Fecha de la decisión:** 31 oct 2026.

## Por qué

Hoy [Ganancia](src/app/(panel)/ganancia/page.tsx) responde "¿cómo me fue?", pero no ayuda a **cuadrar**. Para quien usa Lote como herramienta de orden (aunque no use la vitrina) faltan estas respuestas: ¿dónde está mi dinero?, ¿cuánto entró y salió, partida por partida?, ¿qué me deben?, ¿qué tengo parado en producto?

Frase de la dueña: "es como un balance". Eso guía el nombre y la estructura.

## Decisiones ya tomadas (no re-discutir)

1. **Solo dinero del negocio.** Nada de dinero personal, retiros ni "lo que me pagué". Ni como categoría de gasto.
2. **La sección se llama "Dinero"** (antes "Ganancia") y tiene tres pantallas: **Resumen**, **Movimientos** y **Cuadre**. Más los periodos que ya existen: Hoy, Semana, Mes, Mes pasado.
3. Se construye en este orden: Movimientos primero (es la base y no necesita cambios en la base de datos), después Resumen y Cuadre.
4. Se sigue el sistema de diseño del panel (ver "Cómo se ve").

## Las tres pantallas

### 1. Resumen (lo que ya hay, rediseñado)
- Cuatro `TarjetaDato`: **Ganancia** (con comparación contra el periodo anterior), **Vendido** (y cuántos pedidos), **Gastos** (y cuántas categorías), **Te deben** (y cuántas clientas).
- Tarjeta nueva **"Ya cubriste tus gastos"**: el punto de equilibrio. "Necesitabas vender $X para pagar lo que gastaste. Llevas $Y: pasaste esa línea el día D." Con una barra y una marca en $X. Si todavía no los cubre, dice cuánto falta.
  - Cálculo: margen = (vendido − costo de lo vendido) / vendido; ventas necesarias = gastos / margen. El día de cruce se saca acumulando ventas día por día. Va en `src/domain/` como función pura, con pruebas. Sin margen (cero ventas o costos sin cargar) no se muestra.
- Dos listas: **En qué gastaste** (por categoría, con barritas) y **Lo que más te deja** (ranking de productos; ya existe en `Ranking`).
- Se conserva: el aviso de productos vendidos sin costo, el enlace a exportar, el resumen semanal.

### 2. Movimientos (el libro)
Una sola lista, de la más reciente a la más antigua, con **todo lo que entró y salió**:
- **Entradas:** cada pago registrado (`pago`: monto, método, fecha, pedido). Un pago parcial se muestra como **"Abono (queda $X)"**; el pago que completa, como **"Venta"**.
- **Salidas:** cada `gasto`, con su categoría.
- Columnas: Fecha, Concepto (con subtítulo: "Venta", "Abono", "Gasto · Mercadería"), Método (chip), Monto (verde `+`, rojo `−`).
- Controles: búsqueda (clienta, producto, nota del gasto), chips **Todos / Entradas / Salidas**, chips de método **Efectivo / Transferencia / Billetera**, y el periodo.
- Pie de la tabla: **Entradas · Salidas · Neto** de lo que se está viendo (de todo el filtro, no solo de la página).
- Paginada en el servidor (30 por página), como [Pedidos](src/app/(panel)/pedidos/page.tsx). Búsqueda con `q` y estado en la URL.

> **Cuidado, dos formas de contar.** Resumen cuenta **ganancia** (una venta cuenta cuando el pedido se paga completo; ver `PROGRESO.md`). Movimientos cuenta **flujo de dinero** (lo que de verdad entró, aunque sea un abono). Es normal que no coincidan en un periodo. Dilo en la interfaz con una línea de apoyo, para que no parezca un error.

### 3. Cuadre (dónde está el dinero)
- **"Lo que vale tu negocio hoy":** suma de efectivo + transferencia (banco) + billetera + por cobrar + inventario a costo, con una barra segmentada por colores y la leyenda.
  - Por cobrar: `porCobrar()` (ya existe). Inventario a costo: ya se calcula en Ganancia (`valorInventario`, con unidades sin costo aparte).
- **Una tarjeta por método** (efectivo, transferencia, billetera):
  - "Debería haber $X" (calculado).
  - Un campo "Lo que contaste" y un botón para guardar el conteo.
  - Chip de resultado: **Cuadra** (teal suave), **Faltan/Sobran $N** (ámbar), **Sin contar** (gris).
- **Te deben:** clientas con saldo, la más antigua primero, con botón **Cobrar** que abre WhatsApp con el mensaje armado. Ya existe el patrón en [ListaClientes.tsx](src/features/customers/ui/ListaClientes.tsx) (`enlaceWhatsApp` + `t.cobrarMensaje`): reutilízalo, no lo copies.
- **Dinero parado en producto:** productos con unidades disponibles y **más de 30 días sin venderse** (constante en un solo lugar), con lo que costaron y el total (y su % del inventario). Los sin costo se avisan aparte.

## Lo que ya existe en el código (reutilizar)

| Qué | Dónde |
|---|---|
| Ganancia, periodos, cascada | `src/domain/` (`ganancia.ts`, `periodo.ts`, `resumen.ts`, `dinero.ts`) |
| Ventas, gastos, por cobrar, por semana | [src/features/profit/repositorio.ts](src/features/profit/repositorio.ts) |
| UI actual | [src/features/profit/ui/](src/features/profit/ui) (`Gastos.tsx`, `Tarjetas.tsx`, `GraficoRanking.tsx`) |
| Pagos por método | tabla `pago` (`metodo`: transferencia, billetera, efectivo; `monto`, `fecha`, `comprobante`); `listarPagos` y `registrarPago` en [src/features/orders/repositorio.ts](src/features/orders/repositorio.ts) |
| Caja del Mostrador (efectivo) | tabla `cierre_caja` (`efectivo_esperado`, `efectivo_contado`, `diferencia`); [src/features/counter/repositorio.ts](src/features/counter/repositorio.ts) |
| Cobrar por WhatsApp | `enlaceWhatsApp` en [src/features/catalog/enlaces.ts](src/features/catalog/enlaces.ts) y `textos.clientes.cobrarMensaje` |
| Búsqueda + paginación en el servidor | [src/features/orders/busqueda.ts](src/features/orders/busqueda.ts) y la página de Pedidos: es el modelo a seguir |
| Exportar CSV | [src/features/export/](src/features/export) (tipos `gastos` y `pedidos`) |
| Menú | `src/components/nav/menu.ts` (la entrada es `/ganancia`) y `src/lib/textos/nav.ts` (`ganancia: "Ganancia"`) |

## Lo que NO existe y hay que crear

1. **`gasto` no guarda con qué método se pagó.** Sin eso, Movimientos no puede filtrar salidas por método y Cuadre no puede restar los gastos del lugar correcto.
   - SQL nuevo: agregar `metodo text` a `gasto` (check: `efectivo`, `transferencia`, `billetera`; **null = "sin método"**, para no romper los gastos viejos). Actualizar el RPC `registrar_gasto` para recibirlo.
   - Código: un selector de método en `RegistrarGasto` ([Gastos.tsx](src/features/profit/ui/Gastos.tsx)), y en el Asistente (`supabase/asistente_gasto.sql` y su intención de gasto), que hoy registra gastos sin método.
   - Los gastos sin método se muestran como "Sin método" y no entran en el cuadre de ningún lugar (decirlo en la interfaz).
2. **Conteos guardados del Cuadre.** Tabla nueva, por ejemplo `conteo_dinero`: `negocio_id`, `metodo`, `contado`, `esperado`, `diferencia`, `nota`, `contado_en`, `usuario_id`. Con RLS como el resto (solo dueña y administradora), y escritura por función `security definer` que verifique el rol (patrón de `PROGRESO.md`).
   - **Cómo se calcula "Debería haber":** `último conteo del método + pagos de ese método − gastos de ese método, desde ese conteo`. La **primera vez** no hay conteo previo: el primer conteo funciona como saldo inicial ("Empezá contando lo que hay hoy") y no marca diferencia.
   - **Efectivo ya tiene su cierre en el Mostrador** (`cierre_caja`). Decisión pendiente (ver abajo): tratar el cierre de caja como un conteo de efectivo, o mantener los dos separados con un enlace entre ellos.
3. **Fecha de la última venta por producto**, para el dinero parado. Se puede calcular en el servidor desde `pedido_item` + `pedido` (estados pagado, preparando, enviado, entregado). Si resulta lento, hacer un RPC (`ultima_venta_por_producto`).
4. **Funciones puras nuevas en `src/domain/` con pruebas (vitest):** punto de equilibrio y día de cruce; "debería haber" por método; unir pagos y gastos en una lista de movimientos con su resumen; dinero parado.

**El SQL lo corre la dueña, no el agente.** Escribe cada cambio en un archivo nuevo de `supabase/` (se corre una vez, en orden, y se puede volver a correr), con un encabezado que diga qué hace y después de qué archivo va. El agente solo lee con `execute_sql`, `list_tables` y `get_advisors`. Revisa con `get_advisors` al final.

## Rutas y nombres

- `/dinero` (Resumen), `/dinero/movimientos`, `/dinero/cuadre`. Cada una es una página del servidor con `searchParams` (periodo, `q`, tipo, método, página).
- **Cambia el nombre de la ruta y de los textos, no rompas lo que ya existe:** `/ganancia` debe redirigir a `/dinero` (hay enlaces en Inicio y en el menú), y `/ganancia/resumen` (el resumen semanal) se queda tal cual o se mueve con redirección.
- Textos en `src/lib/textos/` (un archivo por tema; idealmente `dinero.ts`, y mover lo de `ganancia.ts` de a poco).
- Menú: la etiqueta pasa a "Dinero" (`menu.ts` y `nav.ts`). Revisa el ícono.

## Cómo se ve (sistema de diseño del panel)

Mira la página `/design-system` y [BRANDING.md](BRANDING.md). Lo esencial, con los componentes que ya existen:

- **Una cosa fuerte por pantalla.** El botón mango es **"Registrar gasto"** (con ícono). Todo lo demás: botones `suave` o `secundario`, siempre con ícono (`icono="..."`), y de solo ícono con `BotonIcono`.
- **Tarjetas de números:** `TarjetaDato` ([TarjetaDato.tsx](src/components/ui/TarjetaDato.tsx)) con banda de color por estado (`colorDeEstado`) e ícono. Contorno de 2 px, sin sombra.
  - Bandas sugeridas: ganancia → teal (`entregado`), vendido → rosa (`pagado`), gastos → ámbar (`poco_stock`), te deben → limón (`pendiente`).
- **Listas y tablas:** `Card` con `p-0` y filas con línea fina; encabezado en gris chico; hover en `teal-fondo`; chips de estado sin borde (`discreto`).
- **Filtros:** chips tranquilos (como [Pestanas.tsx](src/components/nav/Pestanas.tsx)) y selectores en píldora (`ListaDesplegable` con `variante="pildora"`). Los filtros avanzados, plegados.
- **Avisos:** `Aviso` (gris con ícono para informar; limón solo para advertir). El color significa algo: limón = esperar o advertencia, rosa = dinero, ámbar = ojo, teal = bien.
- **Lotito a color** (`LotitoMas`), nunca el monito gris, y solo en momentos (vacíos, cuadre perfecto).
- **Guardar:** botón con ícono, se prende solo cuando hay cambios, con "Todo guardado / Tenés cambios sin guardar" al lado (ver [PagosForm.tsx](src/features/payments/ui/PagosForm.tsx)).
- **Movimientos:** verde `text-teal` para entradas y rojo `text-error` para salidas, con signo `+` o `−` (no depender solo del color).
- Móvil: toda cuadrícula con `grid-cols-1`, botones de 44 px.

## Reglas del proyecto que aplican

- **Las reglas de dinero las calcula el código** (`src/domain/`, funciones puras con pruebas), nunca la IA.
- Importes en centavos (`Centavos`) y `formatearDolares`. Fechas con las funciones de `src/lib/formato.ts` (la hora se arma a mano, ver "Cosas que mordieron" en `PROGRESO.md`).
- Textos en español salvadoreño con voseo, sin emojis, **y nunca la palabra "plata"**: se dice "dinero".
- Antes de escribir código de Next.js, lee la guía correspondiente en `node_modules/next/dist/docs/` (`AGENTS.md`: esta versión tiene cambios).
- Entre features solo se importa el repositorio, tipos y lógica; no `ui/` ni `actions/` (ESLint lo exige). Lo compartido va en `components/ui/`.
- Solo dueña y administradora ven costos y esta sección (`negocio.puedeGestionar`), como hoy.
- **Los commits los hace la dueña**, no el agente.
- Verificación: `npx tsc --noEmit`, `npx eslint src`, `npx vitest run`, `npx next build`. Reiniciar `npm run dev` después de `next build`.

## Plan por fases

1. **Movimientos** (sin base de datos): función pura de unión + resumen con pruebas, repositorio paginado (pagos + gastos), página y filtros. Los gastos viejos salen "Sin método".
2. **SQL de `gasto.metodo`** + selector en el formulario de gasto y en el Asistente. Con esto el filtro por método de las salidas queda completo.
3. **Renombrar a Dinero** (rutas, redirección, menú, textos) y rediseñar **Resumen**, con la tarjeta "Ya cubriste tus gastos".
4. **Cuadre:** SQL de `conteo_dinero`, función de "debería haber", tarjetas por método, "Te deben" y "Dinero parado".
5. **Después, si se pide:** gastos recurrentes (la columna `gasto.recurrente` ya existe en la base pero no se usa en el código; falta crearlos solos cada mes, ver `supabase/cron.sql`), ventas por canal, reporte mensual en PDF para el contador.

## Preguntas abiertas para la dueña

- **Efectivo y el cierre de caja del Mostrador:** ¿un solo conteo de efectivo (el cierre de caja alimenta el Cuadre) o dos cosas separadas? Recomendación: un solo conteo, para no pedirle contar el efectivo dos veces.
- **Dinero parado:** ¿30 días es buen umbral? Podría ser un ajuste del negocio, como el aviso de poco stock.
- **Gastos viejos sin método:** ¿se dejan como "Sin método" o se le pide que los complete?

## Aceptación (cuando esté listo)

- Las tres pantallas coinciden con el prototipo, con datos reales.
- Cada función pura nueva tiene pruebas; `tsc`, `eslint` y `vitest` pasan.
- Un gasto nuevo guarda su método; los viejos no se rompen.
- `/ganancia` redirige a `/dinero`.
- Una persona sin permiso de gestión no ve nada de esto (probar con un rol de vendedora).
- Revisado a 390 px de ancho (celular), sin desborde horizontal.
