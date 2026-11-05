# Gestión: el balance del negocio

Nota de diseño de la charla del 2 nov 2026. **Gestión es la sección nueva** y desde el 4 nov se llama **Balance** (una sola pantalla, `/balance/detalle`, con la ganancia del periodo arriba; el 4 nov se quitó la pestaña Resumen y `/balance/resumen` redirige; antes `/gestion` y `/gestion/cuadre`, que redirigen). **Dinero (`/dinero`) se eliminó (3 nov)**: sus rutas redirigen (`/dinero` y `/dinero/resumen` a `/gestion`, `/dinero/movimientos` a `/movimientos`, `/dinero/cuadre` a `/gestion/cuadre`).

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
- **Ya no hay "lo que contaste"**. La tabla `conteo_dinero` se quitó con [supabase/quitar_conteo_dinero.sql](../supabase/quitar_conteo_dinero.sql).

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
- No hay billetera móvil como método aparte. Cada movimiento es de un **tipo**, efectivo o transferencia (en pantalla, "Banco o billetera"), y va a una **cuenta** de ese tipo (ver "Varias cuentas").
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
- **Crear negocio (2 nov, "cuaderno con stickers"):** ya no comparte el panel de marca del inicio de sesión. Vive en su propio grupo de rutas, `src/app/(onboarding)/`, a pantalla completa y como una hoja de cuaderno de recortes de cuatro hojas: nombre y redes, qué hacés, tienda en línea y revisar (con sello). La pregunta va con marcador, las respuestas son fotos pegadas (la elegida se levanta y recibe una estrella), hay stickers sueltos y Lotito comenta al margen. Un solo formulario: todos los campos siguen en la página y se mandan juntos al final ([CrearNegocioForm.tsx](src/features/auth/ui/CrearNegocioForm.tsx)). El inicio de sesión conserva su panel.
  - **La respuesta elegida** se nota de tres maneras a la vez: un circulito arriba a la derecha (vacío o naranja con ✓), fondo limón con borde grueso y una etiqueta "Elegida"; las demás bajan de intensidad. Hay una línea de instrucción ("Tocá la que más se parece a vos"), un aro de foco más grueso con el teclado, y en celular las respuestas son una fila (dibujo y texto) y los botones Atrás y Seguir quedan pegados abajo.
- **Crear negocio, cinco hojas (2 nov):** 1) nombre del negocio, tu nombre y cómo querés que te hable Lotito (Ella, Él o Sin género); 2) de qué es el negocio (hasta 3 rubros y una frase) con categorías iniciales que se pueden quitar; 3) qué hacés; 4) cómo vendés (Instagram, WhatsApp con +503, Facebook, en persona; cada casilla pide su dato) y la tienda en línea; 5) revisar. Solo el nombre es obligatorio; las hojas 2 y 4 dicen "Saltar por ahora" mientras estén vacías; los números de página de arriba llevan de vuelta a una hoja ya hecha. Lo que se guarda: los rubros y la frase van a "Sobre tu tienda" (que Lotito lee en el chat), las categorías se crean con su rubro, "en persona" prende el Mostrador, el WhatsApp va al negocio, y el nombre y el trato van al perfil de la persona (metadatos de la sesión, sin SQL). La lógica pura está en [negocioNuevo.ts](src/features/auth/negocioNuevo.ts) con pruebas.
- **El trato, aplicado (2 nov):** (1) el rol propio en el menú se lee según la elección (Dueña, Dueño o Titular del negocio; Administradora, Administrador o Administración; Vendedora, Vendedor o Ventas) con `rolPropio` en [trato.ts](src/domain/trato.ts); (2) todo lo que habla de otras personas o en general usa nombres sin género: Titular del negocio, Administración, Ventas, y frases como "solo quien es titular" o "quien administra"; (3) Lotito recibe el trato como dato y habla en femenino, masculino o sin género según corresponda. El trato vive en los metadatos de la sesión de cada persona; no se guarda en el negocio ni lo ve nadie más.
- **"Clienta" pasó a "cliente"** en todos los textos de la app (los nombres internos del código todavía dicen "clienta").
- **Crear negocio en escritorio (2 nov):** el diseño del cuaderno se queda igual; solo se reorganiza el espacio. Desde pantallas anchas (`lg`) la hoja se ensancha y se reparte en dos columnas: a la izquierda la pregunta, su ayuda y Lotito con su nota; a la derecha lo que se responde y los botones. En celular y tableta sigue una sola columna, con Lotito debajo.
- **De qué es el negocio, como lista desplegable (2 nov):** en la hoja 2 los 16 rubros ya no salen como chips: es una lista desplegable con un solo rubro (el que más se parece, opcional). Las categorías iniciales salen de ese rubro.
- **Páginas del cliente (2 nov):** la confirmación ahora vive en `/c/<tienda>/pedido/<id>` (la dirección vieja `/apartado/` redirige) y cuenta la etapa real del pedido (pago confirmado, preparando, en camino, entregado) con un botón al seguimiento. Las dos páginas, el seguimiento `/p/<id>` y el detalle, son una hoja de cuaderno en los colores de la tienda ([HojaCuaderno.tsx](src/features/catalog/ui/HojaCuaderno.tsx)), con la compra como un ticket pegado ([TicketPedido.tsx](src/features/catalog/ui/TicketPedido.tsx): productos, envío, total y cómo paga; la dirección solo en el detalle) y un botón para escribirle a la tienda por WhatsApp ([EscribirALaTienda.tsx](src/features/catalog/ui/EscribirALaTienda.tsx)); si la tienda no tiene WhatsApp, el botón no sale.

## Gastos fijos recurrentes (3 nov)

Lo que se paga cada mes (alquiler, internet, plan de la tienda) se anota **una vez** y se registra solo.

- **Dónde:** se anotan en Movimientos → Registrar gasto → «Cada mes» (en «¿Cuándo?»). La tarjeta «Gastos fijos» solo aparece cuando hay alguno; ahí se editan, pausan o quitan. Muestra lo que suman al mes y el próximo cobro de cada uno.
- **Cómo funciona:** `gasto_fijo` es la plantilla (nombre, categoría, monto, método, día del mes). Cada mes que pasa, `aplicar_gastos_fijos` crea el gasto de verdad (`recurrente = true`, con `gasto_fijo_id`), así que la ganancia, los movimientos y los saldos lo cuentan como cualquier otro.
- **Cuándo se registra:** al abrir Inicio, Gestión o Movimientos (dueña y administradora) y en la tarea diaria de Vercel (`/api/cron/avisos`), para todos los negocios. Lo que no se registró a tiempo se registra después con su fecha correcta.
- **Reglas:** nunca repite un mes (la plantilla guarda hasta qué mes registró y hay un índice único por plantilla y fecha); un día 31 en un mes corto cae el último día; cuenta **desde el día en que se crea o se reanuda** (no inventa meses atrás); si se quita un gasto ya registrado no vuelve; si se quita la plantilla, lo ya registrado se queda; un cambio de monto vale desde el próximo mes que se registre.
- **Sin SQL todavía:** la pantalla no se rompe: la lista sale vacía y no se registra nada. SQL: [supabase/gastos_fijos.sql](../supabase/gastos_fijos.sql) (después de `gasto_metodo.sql`).
- **Lo que sigue:** con los gastos fijos conocidos, el punto de equilibrio y la meta del mes se pueden calcular de antemano.

## Movimientos, su propia página (3 nov)

Movimientos dejó de ser una pestaña de Gestión: ahora es `/movimientos`, con su entrada en el menú (grupo Finanzas, entre Dinero y Gestión). Gestión queda con dos pestañas: Resumen y Balance. `/gestion/movimientos` redirige a `/movimientos`.

- Los filtros (periodo, tipo, método y búsqueda) van juntos arriba y mandan sobre todo lo de abajo: los totales, el gráfico y la lista.
- El gráfico ya no escribe la frase del día o la semana más alta.
- Dinero ya no existe (ver arriba): la página de Movimientos solo sirve a `/movimientos`.

## Varias cuentas (4 nov)

El dinero ya no vive en dos lugares fijos: cada negocio tiene las cuentas que quiera ("Caja", "Banco Agrícola", "Tigo Money"). SQL: [supabase/cuentas.sql](../supabase/cuentas.sql).

- **Tabla `cuenta`**: nombre, tipo (`efectivo` o `transferencia`), si es la **principal** de su tipo y si está archivada. Al correr el SQL cada negocio recibe "Efectivo" y "Cuenta digital" como principales, y todo lo que ya estaba guardado queda en ellas.
- **Cada movimiento guarda su cuenta** (`cuenta_id` en pago, gasto, abono, ajuste, compra de mercadería y pago a la paquetera; `recibido_cuenta_id` en el préstamo). El tipo sigue en `lugar` / `metodo` como siempre. Un trigger pone la principal de su tipo a lo que se guarda sin cuenta (cobros, Mostrador, gastos fijos, Lotito) **en el momento de guardarse**, así cambiar de principal no mueve el pasado; y rechaza una cuenta de otro negocio, archivada o de otro tipo.
- **Saldo por cuenta**: saldo inicial (uno por cuenta) + lo que entró − lo que salió, con ajuste a mano. El balance suma todas las cuentas en "Dinero".
- **Mover dinero entre cuentas** (`movimiento_entre_cuentas`, función `mover_entre_cuentas`): depositar la caja en el banco no es ingreso ni gasto. No deja sacar más de lo que Lote sabe que hay.
- **Pantalla**: en Balance, entre la ecuación y Activos/Pasivos, hay una tarjeta «Tus cuentas» a todo el ancho: cada cuenta es una tarjetita con su saldo en grande, «Poner saldo inicial» / «Ajustar saldo» y Editar (nombre, hacerla principal, archivarla si está en cero y no es la principal). Arriba a la derecha, «Agregar cuenta» y «Mover dinero». La fila Dinero de Activos quedó solo con su barra.
- **Dónde se elige la cuenta**: abono y préstamo recibido (Balance), gasto (Movimientos y Resumen), pago a la paquetera (pedido), compra de mercadería (crear, cargar varios y reponer producto) y gastos fijos. Un valor suelto "efectivo" o "transferencia" sigue sirviendo: es la principal del tipo.
- **Sin el SQL corrido** todo sigue como antes: se leen dos cuentas "de siempre" (su id es el lugar) y no se pueden crear cuentas.

Movimientos: cada fila dice de qué cuenta es, hay un filtro por cuenta (si hay más de una) y lo que se pasó de una cuenta a otra sale como fila «Caja → Banco», sin sumar en lo que entró ni en lo que salió.

## Tarjetas de crédito (4 nov)

Una tarjeta **no es dinero: es lo que debés**. Versión simple: nombre, día de corte y día de pago (recordatorios), sin cupo ni intereses. Necesita `tarjetas.sql` (después de `cuentas.sql`).

- **Datos**: tabla `tarjeta` y `pago_tarjeta` (lo que se le pagó y de qué cuenta salió). `gasto.tarjeta_id` y `compra_mercaderia.tarjeta_id` marcan lo gastado con ella; esos gastos no llevan método ni cuenta, y la compra no lleva `lugar` (queda vacío). La deuda no se guarda: es **gastado − pagado** (`deudaDeTarjeta`).
- **Pagar con tarjeta**: en «Registrar gasto» y en «¿Con qué cuenta pagaste esta mercadería?» (producto nuevo, lote, reponer) las tarjetas salen como una opción más; el valor del formulario es `tarjeta:<id>` (`elegirCuenta.ts`: `opcionesDePago`, `elegirTarjeta`). No baja ninguna cuenta: sube la deuda. Un gasto que se repite cada mes no se puede pagar con tarjeta.
- **Pagar la tarjeta**: Balance → Detalle → «Tus tarjetas de crédito» → Pagar. Baja la cuenta elegida y baja la deuda; no deja pagar más de lo que se debe. Una tarjeta con deuda no se quita.
- **Balance**: lo que se debe en tarjetas es un pasivo más («Tarjetas de crédito», en «Lo que debés»). No entra en la lista de deudas.
- **Movimientos**: el gasto con tarjeta aparece como gasto y con el nombre de la tarjeta; el pago a la tarjeta es una partida aparte («Pago de tarjeta»). La mercadería pagada con tarjeta no aparece en Movimientos (no movió ninguna cuenta): se ve en la deuda de la tarjeta.
- **Pendiente**: gastos fijos con tarjeta, cupo y avisos de corte y de pago.

