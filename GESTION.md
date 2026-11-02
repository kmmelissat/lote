# Gestión: el balance del negocio

Nota de diseño de la charla del 2 nov 2026. **Gestión es la sección nueva** (`/gestion`). **Dinero (`/dinero`) queda como está, congelado**, mientras se hace bien Gestión. Ver [DINERO.md](DINERO.md) para lo que ya hay allá.

## Por qué

El Cuadre de Dinero era una cuadratura de caja (contar el dinero y compararlo con lo que "debería haber"). A la dueña no le hizo sentido. Lo que quiere es **ver todo el contexto del negocio**: dónde está su dinero, qué debe y cuánto vale hoy.

## Las tres pantallas

| Pantalla | Qué es |
|---|---|
| **Cuadre** | El **balance general**. Activos, pasivos y patrimonio. |
| **Movimientos** | El libro: ingresos, gastos y costos, partida por partida. |
| **Resumen** | Los dos juntos: cuánto ganó en el periodo (Movimientos) y cuánto vale hoy el negocio (Cuadre). |

### Cuadre (balance)

- **Activos** (lo que tiene): efectivo, cuenta digital, por cobrar, inventario a costo.
- **Pasivos** (lo que debe): deudas, préstamos y créditos.
- **Patrimonio** = activos − pasivos. Es lo que de verdad vale el negocio.
- "Te deben" y "dinero parado en producto" se quedan como detalle de *por cobrar* e *inventario*.
- **Ya no hay "lo que contaste"**. Los 2 conteos viejos (`conteo_dinero`) quedan como historial, sin usarse.

### Saldos que se actualizan solos

Efectivo y cuenta digital = **saldo inicial** (se escribe una sola vez) + todo lo que entra − todo lo que sale. Para que cuadre:

- Un **préstamo recibido** mete dinero a la cuenta pero **no es ingreso ni ganancia**: sube el pasivo.
- **Pagar una cuota/abono** baja el pasivo y baja la cuenta. **No es gasto** (salvo los intereses, que sí lo son, en una versión futura).
- La **compra de mercadería** (el costo al crear o reponer un producto) es **salida de dinero**: sube el inventario y baja la cuenta. No es gasto.
- Si no cuadra con la realidad, el saldo se **puede ajustar a mano** (queda anotado como ajuste).

### Pasivos

Lista simple con abonos: a quién se le debe, monto, tipo (deuda, préstamo, crédito), fecha límite opcional, y pagos hasta saldarla. El balance suma lo que falta pagar. Sin intereses ni cuotas por ahora.

## Qué responde cada pantalla

| Pantalla | Pregunta | Lo fuerte |
|---|---|---|
| Resumen | ¿Cómo te va? | La ganancia del periodo (hero limón) con su cuenta: vendiste − costo − gastos, y el gráfico de lo que entró y salió por día |
| Movimientos | ¿Qué pasó? | El neto, el mismo gráfico y la lista partida por día |
| Cuadre | ¿Qué tenés y qué debés? | La cuenta lo que tenés − lo que debés = lo que es tuyo, con cada parte explicada en palabras sencillas y un "¿Cómo leo esto?" con ejemplo |

El gráfico ([GraficoEntraSale](src/features/gestion/ui/GraficoEntraSale.tsx)) es de barras hechas con HTML, sin librería: teal entra, rosa sale, con tabla escondida para lectores de pantalla.

## Cambios de la segunda vuelta (2 nov)

- **Productos que no se mueven** ya no está en el Cuadre: vive en Productos (sección plegable arriba de la lista, solo para quien ve costos). El Resumen de Gestión deja un mini resumen que lleva ahí.
- **Cuota de cada deuda, guardada y editable**: una deuda guarda cuánto se paga cada vez, cuántas cuotas son y qué día del mes toca (todo opcional). La lista muestra "Cuota de $X al mes · quedan N cuotas · Toca pagar el 15 nov", el abono viene con la cuota ya escrita y hay un botón Editar que corrige la deuda sin perder sus abonos (no cambia el tipo ni dónde entró el dinero). SQL: [supabase/pasivo_cuota.sql](supabase/pasivo_cuota.sql).
- **Movimientos** de Gestión muestra la fecha en cada fila.
- **¿Cómo leo esto?** del Cuadre es un acordeón con tres pasos escritos con los números reales del negocio.

## Quien produce y quien revende

Un solo balance para los dos. La diferencia es **de qué está hecho el costo del producto**.

| | Revendedor | Productor |
|---|---|---|
| Costo del producto | Compra, envío, importación | Materiales, mano de obra, empaque |

Primera versión:

1. Un campo del negocio, **"¿Qué hacés?"**: *Compro y vendo*, *Produzco* o *Ambos*.
2. Solo cambian los **tipos de costo** que ofrece el formulario de producto. Quien hace ambos ve todos.
3. El balance usa **una sola línea de "Inventario a costo"**.

Para después: **materia prima como activo** (comprar 10 kg de harina y descontarla al producir). Mientras tanto, esa compra se anota como gasto "Materiales" y el costo por unidad es una estimación. **Riesgo:** contar dos veces el mismo material (en el gasto y en el costo del producto). Hay que decirlo en la pantalla.

## Reglas que no cambian

- Solo dinero del negocio. Nada de dinero personal ni retiros.
- No hay billetera móvil. Los métodos son **efectivo** y **cuenta digital** (en la base sigue llamándose `transferencia`).
- **El SQL lo corre la dueña.** Cada cambio va en un archivo nuevo de `supabase/`.

## Estado

Ver la lista de abajo; se va marcando.

- [x] SQL: pasivos, abonos, saldo inicial, "qué hacés" ([supabase/gestion.sql](supabase/gestion.sql)); ya corrido. Los tipos de las tablas nuevas están en `database.types.ts` (agregados a mano; al regenerarlo salen iguales)
- [x] Función pura del balance en `src/domain/balance.ts` con pruebas
- [x] `/gestion/cuadre` (balance, saldos, pasivos con abonos, te deben, dinero parado)
- [x] `/gestion/movimientos` (cobros y gastos como en Dinero, más los préstamos y pagos de deudas aparte)
- [x] `/gestion` (Resumen): patrimonio, ganancia, vendido, gastos y lo que se debe
- [x] Entrada "Gestión" en el menú (Dinero sigue ahí, sin cambios)
- [x] Pantalla para elegir "¿Qué hacés?": Ajustes → Mi tienda → Ventas
- [x] Tipos de costo según "qué hacés": quien produce ve "Materiales" (es el costo principal) y "Mano de obra"; quien revende, Envío, Importación y Otros; las dos cosas ven todos. Un producto que ya trae un costo oculto lo sigue mostrando, para no perderlo al guardar. [supabase/actividad.sql](supabase/actividad.sql) ya corrido.
- [x] Salida de dinero al comprar o reponer mercadería: en el formulario de producto (al crear), en Reponer y en el Lote de fotos hay "¿De dónde salió el dinero?" (*No lo anoto* por defecto). Si se elige, el saldo de ese lugar baja solo. La mano de obra no cuenta: no sale de la caja. [supabase/compras.sql](supabase/compras.sql) ya corrido.
- [ ] Los pagos de pedidos y gastos anteriores al saldo inicial no se cuentan: ya están dentro de ese saldo

## Buscador, Lotito y onboarding (2 nov)

- **Buscador (⌘K):** conoce todas las pantallas del panel ([destinos.ts](src/components/nav/destinos.ts)), cada una con sus sinónimos ("deudas", "cuota", "excel", "abrir caja"); busca sin tildes, por palabras sueltas y a medio escribir ([buscarDestinos.ts](src/components/nav/buscarDestinos.ts)); también encuentra preguntas de la ayuda; con la barra vacía muestra lo que más se hace y ejemplos para tocar; y si no encuentra nada, "Preguntale a Lotito" lleva la pregunta ya escrita y enviada.
- **Lotito:** responde "¿cuánto debo?" y "¿cuánto vale mi negocio?" con el balance, cada deuda y su cuota; conoce Gestión, las ofertas por precio, "Productos que no se mueven" y "¿Qué hacés?"; trae sugerencias propias en Gestión; y la ayuda tiene cinco preguntas nuevas (balance, saldo inicial, deudas, cuota, qué hacés).
- **Onboarding:** al crear el negocio se pregunta "¿Qué hacés?"; los primeros pasos NO piden el saldo inicial: para quien todavía no cargó productos es ruido. El saldo se pide donde ya importa, dentro de Gestión (el Cuadre y la tarjeta de lo que es tuyo en el Resumen lo avisan).
