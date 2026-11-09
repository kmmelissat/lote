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
- Campos (`campos.tsx`): borde fino, `shadow-xs`, foco teal con halo de 3 px. Lo que llena Lotito se resalta en amarillo suave (`MARCA_LOTITO`).
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

- `/pedidos`: botón "Registrar" primario teal (`EnlacePunch`); se quitaron "Para atender" y "Este mes" (7 nov: la lista es lo principal); `ResumenCompacto` en una sola tarjeta con líneas finas y cifras semibold; buscador, botón Filtros (`BotonPunch`, menú con borde fino) y pestañas grises.
- `Pestanas` (`components/nav/Pestanas.tsx`) ya es Punch: barra gris donde la activa se levanta en blanco. Como es compartida, también cambió en Movimientos, Balance y Clientes.
- Tabla y lista apilada con borde fino, encabezado gris claro, chips de estado y de canal con los tonos `chip-*`.
- Falta: el detalle `/pedidos/[codigo]` (`ResumenPedido`, `ProgresoPedido`, `AccionesPedido`, cobro y envío) y `AccionPedido` en su variante grande.

## Pendiente

- Aplicar el sistema al resto de la app.
- Definir la tipografía final del logo.
- Decidir qué color es cada estado de los chips (hoy son provisionales).
- Selector de tienda arriba de la barra y grupo "Mi tienda" con su signo +, como en la maqueta.
