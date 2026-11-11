# Branding de Punch

Resumen de la marca nueva. Desde el 8 de noviembre de 2026 la app se llama **Punch** (antes Lote). Este documento dice cómo se ve y cómo habla. Para saber qué pantallas ya se aplicaron, ver [PUNCH.md](PUNCH.md); la referencia viva está en `/design-system`. [BRANDING.md](BRANDING.md) es la marca vieja (Lote, cartoon) y sigue valiendo para la landing y las vitrinas mientras no se rehagan.

## Qué es Punch

Tu tienda en línea y tus cuentas claras, para emprendedores que venden por redes sociales en El Salvador. La marca es una amiga que lleva la cuenta: cercana, rápida, sin tecnicismos. Punch sigue siendo el asistente.

## Dirección

**Clean, moderno, amigable y con pops de color.** Referencias: shadcn/ui (sobriedad, bordes finos, texto chico), ClickUp y Apple (limpieza, aire).

Lo que sí:
- **Fondo blanco.** Los fondos suaves son grises con un toque de teal.
- **Bordes finos**, de 1 px, suaves.
- **Esquinas redondeadas, sin llegar a círculo.**
- **Sombras mínimas:** solo `shadow-xs` en tarjetas.
- **El color es el pop, no el fondo:** fichas de ícono, chips, sellos, puntitos de título, fotos de producto y el botón principal.
- **Aire.** Mucho espacio entre secciones; títulos en semibold; texto base de 14 a 16 px.

Lo que no:
- Nada cartoon: sin sombra dura, sin giros, sin contorno grueso.
- Sin degradados ni fondos de color en la página.
- Sin crema, mango ni limón.

## Logo

El iso es un monito con forma de etiqueta de precio y un check rosa. El nombre va en minúscula y con punto: **punch.** (el punto en celeste). Se usa a color, con aire alrededor y de 16 px para arriba. No se estira, no se gira y no lleva sombra. Archivo: `public/punch.svg`. La tipografía final del logo está por definir.

## Color

Escalas del 50 al 900 sacadas del iso. Los valores completos están en `ESCALAS` de `src/features/design-system/SistemaDeDiseno.tsx`.

| Escala | Rol | Tono del iso |
|---|---|---|
| Teal | Principal: acción y texto | 900 `#013c47` |
| Celeste | Secundario | 300 `#99e1f8` |
| Rosa | Acento | 300 `#f29ebb` |
| Lila | Acento | |
| Amarillo | Acento y avisos | |
| Verde | Éxito | |
| Rojo | Error y borrar | |

**Neutros:** `gris-50 #f7f9f9`, `gris-100 #eef2f2` y la línea de los bordes `#e1e8e8` (`--color-linea`). Texto: `#003844`; texto secundario: `#4a6b73`.

**Chips y fichas:** fondo en tono 200 (`--color-chip-*`, `--color-ficha-*`) y texto en tono 800. Qué color es cada estado de los chips todavía es provisional.

## Formas

| Elemento | Esquina |
|---|---|
| Tarjetas grandes | 32 px |
| Tarjetas medianas | 24 px |
| Botones, campos y filas del menú | 14 px (nunca en píldora) |
| Chips y pestañas | 8 a 12 px |
| Fichas de ícono | 10 a 12 px |
| Casillas redondas, interruptores y avatares | Círculo |

## Tipografía

Plus Jakarta Sans para todo el texto (`--font-sans`). Fredoka queda solo para el logo y los números grandes de la marca vieja (`--font-logo`). Títulos en semibold; botones en peso medio, de 14 px.

## Componentes

- **Botones:** rectángulos de esquina suave. Principal (teal oscuro, uno por pantalla), secundario (blanco con borde fino), suave (gris claro), acento (rosa), texto (sin marco) y peligro (rojo). Alto de 44 px en celular y 40 px en escritorio. Los de solo ícono son cuadrados, llevan etiqueta y el ícono va en 20 px.
- **Campos:** etiqueta arriba, ayuda o error abajo, borde fino. Al enfocar, el borde pasa a teal con un halo de 3 px.
- **Controles:** casillas, opciones circulares e interruptores con borde fino; teal cuando están prendidos.
- **Tarjetas:** blancas, borde de 1 px y sombra mínima. La encabeza una ficha de color de 32 px con un ícono, el título y, a la derecha, un chip de estado.
- **Chips y avisos:** chips chicos con borde fino; avisos de info, éxito, alerta y error.
- **Pestañas:** una barra gris donde la activa se levanta en blanco.
- **Tabla:** filas separadas por una línea fina, cifras a la derecha.
- **Modal:** título corto, una frase, lo seguro a la izquierda y la acción a la derecha.
- **Producto:** foto sobre fondo de color, sello, precio grande y botón.
- **Progreso:** barra delgada y continua: hecho en teal, actual a medio tono, lo que falta en gris.
- **Vacíos y cargando:** estado vacío con el iso y un siguiente paso; cargando con formas que pulsan.

## Navegación

- **Escritorio:** pantalla con fondo gris claro; la barra lateral es parte de ese marco, sin tarjeta propia, y el contenido va en un panel blanco con borde fino y esquinas de 32 px. Grupos sin cajas, con título chico en mayúsculas; cada fila mide 44 px con su ícono en una ficha de color de 28 px. La fila activa lleva fondo gris y borde.
- **Celular:** el mismo marco gris con el encabezado pegado arriba y el contenido en un panel blanco de esquinas de 24 px.

## Voz y textos

- Español salvadoreño con **voseo** (tenés, mandá, poné). Todos los textos están en `src/lib/textos/`.
- Se dice **"dinero"**, nunca "plata".
- Frases cortas, sin tecnicismos. Los botones dicen exactamente lo que hacen ("Guardar devolución").
- Los estados vacíos siempre traen un siguiente paso.
- Los errores dicen qué pasó y cómo arreglarlo, sin disculpas.
