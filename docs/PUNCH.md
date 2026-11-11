# Punch: el sistema de diseño nuevo

Desde el 8 de noviembre de 2026 la app se llama **Punch** (antes Lote). Este documento reúne lo que decidimos para su sistema de diseño. La referencia viva está en `/design-system` (`src/features/design-system/SistemaDeDiseno.tsx`). `BRANDING.md` describe la marca vieja (Lote, cartoon) y sigue valiendo para la landing y las vitrinas mientras no se rehagan.

## Estado

- Rama `rediseno-punch`. Se rehace primero la página `/design-system`; en la app se aplicó la **barra lateral de escritorio** y el **marco del celular** (encabezado y cajón). El resto (pantallas, `components/ui`) sigue con el estilo viejo.
- Aplicar a la app por fases y avisar antes de cada una.

## Dirección

**Clean, moderno, amigable y con pops de color.** Referencias: shadcn/ui (sobriedad, bordes finos, texto chico), ClickUp y Apple (limpieza, aire). Nada cartoon: sin sombra dura, sin giros, sin contorno grueso, sin degradados ni fondos de color en la página.

- **Fondo blanco.** Sin celeste ni degradés de fondo. Los fondos suaves son grises con un toque de teal.
- **Bordes finos y suaves**, de 1 px. Se ven, pero no son intensos.
- **Esquinas redondeadas, sin llegar a círculo.** Tarjetas grandes 32 px y medianas 24 px; botones, campos y filas del menú 14 px (suaves, nunca en píldora); chips y pestañas 8 a 12 px. Lo circular se reserva para casillas redondas, interruptores y avatares.
- **Sombras mínimas.** Solo `shadow-xs` en tarjetas; un poco más al pasar el mouse en las de producto.
- **El color es el pop**, no el fondo: fichas de ícono, chips, sellos, puntitos de título, fotos de producto, el botón principal.
- **Aire.** Mucho espacio entre secciones; títulos en semibold, texto base de 14 a 16 px.
- Los textos usan "dinero", nunca "plata".

## Color

Escalas del 50 al 900 sacadas del iso (`public/punch.svg`):

| Escala | Rol | Tonos exactos del iso |
|---|---|---|
| Teal | Principal (acción y texto) | 900 `#013c47` |
| Celeste | Secundario | 300 `#99e1f8` |
| Rosa | Acento | 300 `#f29ebb` |
| Lila | Acento | |
| Amarillo | Acento y avisos | |
| Verde | Éxito | |
| Rojo | Error y borrar | |

Los valores de cada tono están en `ESCALAS` de `SistemaDeDiseno.tsx`. Ya no hay crema, mango ni limón.

Neutros: `gris-50 #f7f9f9`, `gris-100 #eef2f2` y la línea de los bordes `#e1e8e8` (`--color-linea` en `globals.css`).

## Logo

El iso es un monito con forma de etiqueta de precio y un check rosa. El nombre va en minúscula y con punto: **punch.** (el punto en celeste). Se usa a color, con aire alrededor y de 16 px para arriba; no se estira, gira ni lleva sombra.

## Componentes

- **Botones:** rectángulos de esquina suave, texto de 14 px en peso medio. Principal (teal oscuro, uno por pantalla), secundario (blanco con borde fino), suave (gris claro), acento (rosa), texto (sin marco) y peligro (rojo). Alto de 36 px en escritorio y 44 px en el celular. Los de solo ícono son cuadrados y llevan etiqueta.
- **Controles:** casillas, opciones circulares e interruptores, con borde fino; teal cuando están prendidos.
- **Campos:** etiqueta arriba, ayuda o error abajo, borde fino. Al enfocar, el borde pasa a teal con un halo de 3 px.
- **Chips y avisos:** chips chicos con borde del mismo tono; avisos de info, éxito, alerta y error.
- **Tarjetas:** blancas, borde de 1 px y sombra mínima.
- **Pestañas:** una barra gris donde la activa se levanta en blanco.
- **Modal:** título corto, una frase, lo seguro a la izquierda y la acción a la derecha.
- **Tabla:** filas separadas por una línea fina, cifras a la derecha.
- **Navegación:** barra de arriba (logo, buscador, accesos) y, en el celular, barra de abajo con cuatro accesos.
- **Producto:** foto sobre fondo de color, sello, corazón de favoritos, precio grande y botón.
- **Vacíos y cargando:** estado vacío con el iso y un siguiente paso; cargando con formas que pulsan.

## Barra lateral de escritorio (ya aplicada)

- **Encierra todo.** La pantalla tiene fondo gris claro; la barra lateral es parte de ese marco, sin tarjeta propia, y el contenido va en un panel blanco con borde fino y esquinas de 32 px. Nada flota.
- Arriba el iso con "punch." y el botón para recoger; debajo, el buscador (⌘K) y "Acciones rápidas" en teal oscuro.
- Los grupos (Vender, Dinero, Tu negocio) van sin cajas, con título chico en mayúsculas. Cada fila mide 44 px; el ícono va en una ficha de color de 28 px.
- La fila activa lleva fondo gris y borde. Pedidos muestra su contador en una insignia rosa.
- Abajo, la tarjeta de perfil.
- Código: `CascaronMenu.tsx`, `MenuEscritorio.tsx`, `ListaMenuVertical.tsx`, `menu.ts` (`FICHA_SECCION`) y el layout `src/app/(panel)/layout.tsx`.

## Celular (ya aplicado)

- Mismo marco gris que en escritorio: encabezado pegado arriba (botón de menú, iso con "punch." y botón del asistente (ícono de chat, provisional) en teal oscuro) y el contenido en un panel blanco con borde y esquinas de 24 px.
- El cajón reutiliza `ListaMenuVertical` (mismos grupos y fichas que escritorio) sobre fondo gris con borde fino. Código: `MenuMovil.tsx`.

## Vender, el POS rápido (ya aplicado)

- Variante A del mockup: tarjetas de producto (foto sobre color de ficha, chips de oferta y promoción, contador teal, precio grande y botón "+"), ticket a la derecha con borde fino y total en texto (sin bloque oscuro), botón principal teal de 44 px.
- Cobro: formas de pago y entrega como tarjetas sueltas con borde fino; la elegida lleva borde teal con halo. El cambio va en chip verde.
- Paso 2 (cobro): primero se elige el modo (dos tarjetas). En persona: Pago, Cliente opcional y la entrega escondida ("la llevan ya · Cambiar"). Por chat: Cliente (canal primero, correo plegado), Entrega y Pago. El efectivo sale con "Exacto" elegido y cambio en $0.00. Si falta algo, el botón lo dice. En celular, una línea con lo elegido arriba.
- Recibo, escáner, asociar código y toda la Caja (abrir, cerrar, historial, código de barras) también van en Punch: tarjetas blancas con borde fino, chips verde/amarillo, botones de `BotonesPunch.tsx` (`BotonPunch`, `EnlacePunch`, `TARJETA_PUNCH`).
- Código: `src/features/counter/ui/` (`ProductosDelMostrador`, `ResumenLateral`, `OpcionesDePago`, `EntregaDeVenta`, `ModoDeVenta`). Los componentes compartidos (`Button`, `OpcionRadio`) siguen viejos; aquí se estilizó en el lugar.

## Agregar producto (ya aplicado)

- `/productos/nuevo`, `/productos/[codigo]/editar` y el lote de fotos comparten piezas, todas en Punch: tarjeta blanca de 24 px con borde fino que reúne los pasos separados por una línea; cada paso (`BloqueForm`) lleva una ficha de color de 32 px con su número (pasa a check verde cuando está listo), título semibold, ayuda y, si es opcional, su chip gris.
- Campos (`campos.tsx`): borde fino, `shadow-xs`, foco teal con halo de 3 px. Lo que llena Punch se resalta en amarillo suave (`MARCA_LOTITO`).
- Condición (nuevo/usado) como pestañas grises; "¿De dónde salió el dinero?" como chips de borde fino; zona de fotos con borde punteado gris y ficha celeste; vista previa del producto con foto sobre `ficha-celeste`.
- Botones: `BotonPunch` / `EnlacePunch`. El `Button` viejo, en su variante `suave`, ahora también es Punch (esquina 14 px, borde fino), y `PageHeader` usa un botón de volver Punch.
- Código: `src/features/products/ui/` (`NuevoProductoForm`, `BloqueForm`, `campos`, `ZonaFotos`, `VistaPreviaProducto`, `EditorVariantes`).

## Importar productos (ya aplicado)

- `/productos/importar`: pasos como píldoras de borde fino (el actual con halo teal, los hechos con check verde), zona de carga con borde punteado gris y ficha celeste, ayuda en tarjeta Punch con chips (requeridos en amarillo), tabla de vista previa con borde fino y errores en rojo suave, pestañas grises "Todas / Solo errores" y tarjeta de resultado con ficha verde.
- Código: `src/features/import/ui/` (`ImportarCsv`, `PiezasImportar`, `FotoFila`).

## Promociones (ya aplicado)

- `/productos/promociones`: lista con tarjetas Punch (`components/ui/TarjetaPromocion.tsx`): sello en ficha de color (amarillo pack, rosa llevá y pagá, celeste oferta), estado como chip con borde, interruptor teal propio y botón de borrar cuadrado. "Nueva promoción" es un `EnlacePunch` primario.
- `/productos/promociones/nueva`: el tipo se elige en tres tarjetas con ficha de ícono (la elegida con borde teal y halo); el formulario va en tarjeta Punch, y la vista previa, el selector de productos y la oferta de un producto usan bordes finos, fondos grises y fichas en vez de crema, limón y mango.
- Código: `src/features/promotions/ui/` y `src/features/offers/ui/`. `Field`, `Select` (`ListaDesplegable`), `SelectorFecha` y `AtajosDeFechas` ya son Punch (borde fino, `shadow-xs`, foco teal con halo, esquinas 12–14 px); como son compartidos, el cambio se ve en todas las pantallas que los usan.

## Lista de pedidos (ya aplicada)

- `/pedidos`: botón "Registrar" primario teal (`EnlacePunch`); se quitaron "Para atender" y "Este mes". Arriba una franja amarilla (`FranjaPedidos`): "Pendiente de recibir $X en N pedidos" y avisos de apartados por vencer o enviados sin entregar. Buscador, Filtros (`BotonPunch`; "Con saldo" filtra los que tienen saldo) y pestañas grises con un punto de color por estado.
- La lista usa `TablaPunch` (`components/ui/TablaPunch.tsx`): tarjeta con borde fino, encabezado gris, cifras a la derecha y lista apilada cuando el contenedor es angosto (container query). En "Todos" salen primero los abiertos, del más viejo al más nuevo, y luego los cerrados.
- `Pestanas` ya es Punch (barra gris, activa en blanco); es compartida con Movimientos, Balance y Clientes.
- Detalle `/pedidos/[codigo]` aplicado: cliente, pasos, productos, cobro, envío y enlace de seguimiento son tarjetas `TARJETA_PUNCH`; el botón grande de acción es primario. Por dentro también: `PagoForm`, el formulario de envío, el pago a la paquetera, la guía y el enlace de seguimiento usan `BotonPunch` y fondos grises. `/pedidos/nuevo` solo redirige a Vender.

- Detalle del pedido (mockup E "Lista de tareas", 9 nov): a la izquierda `ProgresoPedido` es una lista de pasos ("Para cerrar este pedido", "X de N listos"): hechos con check, el actual resaltado con su título, ayuda y botón (`AccionPedido grande`), y los que faltan en gris; debajo, los productos con total y ganancia (solo quien gestiona). A la derecha: `ClientePedido` (iniciales, contacto, WhatsApp, vencimiento), envío, cobro, devolución si está cancelado y el link de rastreo plegado. Pendiente: notas del pedido (necesita columna nueva).
- Orden del detalle (propuesta 2 del mockup): el encabezado ya no lleva chip de estado (lo dice la barra de progreso) y trae un menú ⋯ (`AccionesPedido` + `MenuAcciones`, ahora en Punch) con Cancelar. Cobro y envío abren con ficha de ícono, título y chip (Pagado / Con saldo / Sin definir). El formulario de pago llega cerrado tras "+ Registrar pago o abono".

## Clientes (ya aplicado)

- `/clientes`: franja amarilla ("Te deben $X entre N clientes", enlace "Ver quiénes" y chip verde de quienes vuelven a comprar) en vez de las cuatro tarjetas de datos; buscador y orden Punch, pestañas grises (Todos / Con saldo con punto amarillo) y `TablaPunch` con avatar en ficha rosa, lo que deben en chip amarillo y botón "Cobrar" por WhatsApp. En celular, lista apilada.
- `/clientes/[id]`: historial de pedidos en `TablaPunch` a la izquierda; a la derecha tarjeta del cliente (contacto y botón de WhatsApp: primario si debe), comprado y saldo en fichas, y notas. En celular, la tarjeta va primero.
- Código: `src/features/customers/ui/` (`ListaClientes`, `FichaCliente`).
## Movimientos (ya aplicado)

- Variante C del mockup: a la izquierda buscador, filtros en píldora (periodo, método y cuenta), pestañas grises Todos / Entradas / Salidas (puntos verde y rosa) y la lista; a la derecha un panel con lo que quedó (`HeroMovimientos`, ya sin bloque oscuro), el gráfico día por día y los gastos fijos. En celular el panel va debajo de la lista.
- La lista (`ListaMovimientos`) es tabla de borde fino con encabezado gris y una fila gris por día con su neto; cada concepto lleva ficha de ícono (verde entra, rojo sale, celeste traslado) y chip de cuenta. Ya no muestra la columna "acumulado".
- El gráfico usa chips verde y rojo; los gastos fijos van en `TARJETA_PUNCH`. El formulario "Registrar gasto" también: botón y ventana de borde fino, campos y chips de 12 a 14 px (el elegido con borde teal y halo), "Una vez / Cada mes" en gris y botones de `BotonPunch`.

## Detalle de producto (ya aplicado)

- `/productos/[codigo]` (mockup D, 10 nov): sin pestañas; lo que más le importa al emprendedor va arriba. Cabecera con foto, chips, nombre, precio y acciones (Editar, ver en la tienda, Agregar variante); franja amarilla solo si hay avisos; con variantes, "Ver: Todas / cada una".
- Tres tarjetas grandes (`TarjetaResumen`): **Te quedan** (`TarjetaStock`, con el botón Reponer que abre su ventana; ámbar si queda poco o nada), **Ganás** (`LoQueTeDeja`: ganancia por unidad, margen, lo que dejaría lo que queda y lo ya vendido; el desglose del costo se abre aparte; ámbar si falta algún costo) y **Vendiste** (unidades y cuánto está apartado por cobrar).
- Debajo: variantes y últimos pedidos a la izquierda; avisos de stock y compartir a la derecha. Luego la oferta a todo el ancho (formulario en dos columnas), las fotos, el código de barras y borrar, todo a la vista (sin menú plegable).
- Todas las tarjetas usan `TARJETA_PUNCH` con `components/ui/EncabezadoTarjeta`. Código: `src/features/products/ui/`.

## Pendiente

- Aplicar el sistema al resto de la app.
- Definir la tipografía final del logo.
- Decidir qué color es cada estado de los chips (hoy son provisionales).
- Selector de tienda arriba de la barra y grupo "Mi tienda" con su signo +, como en la maqueta.
