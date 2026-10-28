# Lote: la marca

Nota para no olvidarla. Cada pantalla, también las del panel, tiene que sentirse **de la misma marca que la landing**: juguetona, cálida y un poco desordenada a propósito. Nada de "panel genérico" gris y blanco.

## Vibe

- **Amiga que lleva la cuenta.** Lote es la compañera del emprendimiento chiquito que vende por redes: cercana, rápida, sin tecnicismos. El monito (el gorila) es su voz.
- **Pegado a mano.** Etiquetas, notas y stickers un poco torcidos, como pegados con cinta. Bordes gruesos y sombras duras, como un sticker o un libro de recortes.
- **Serio con la plata, ligero con el resto.** Los números siempre claros y exactos; todo lo demás puede jugar.
- Referencias de ánimo: stickers, cuadernos de emprendedoras, neo-brutalismo suave (bordes y sombras duras, colores planos), no corporativo.

## Colores

Definidos en [src/app/globals.css](src/app/globals.css). Usar siempre los tokens, nunca hex sueltos.

| Token | Hex | Para qué |
|---|---|---|
| `teal-oscuro` | #003844 | Texto, bordes de 2 px, sombras duras, fondos oscuros ("5 de 5", cierre, menú) |
| `teal` | #006c67 | Color de marca sobrio: botones secundarios, enlaces, íconos |
| `teal-fondo` | #ddefee | Relleno suave, estado activo del menú, hover |
| `mango` | #ff9a2e | **El** color de la acción principal (un solo botón mango por pantalla) |
| `limon` | #ffe27a | Tarjetas destacadas, subrayados, notas adhesivas, ganancia |
| `rosa` | #f194b4 | Acentos juguetones: monitos, etiquetas, "vendido" |
| `rosa-palido` | #fdeaf1 | Fondos de sección |
| `crema` | #fff7e8 | Fondo cálido: menú lateral, hero, hojas |
| `superficie` / `fondo` | #fff / #f5f8f7 | Páginas y tarjetas neutras |

Reglas: un solo mango principal por pantalla; el texto siempre `teal-oscuro` sobre los acentos (contraste comprobado); los acentos van en bloques de color plano, sin degradados.

## Formas

- **Radios grandes:** tarjetas y bloques de 20 a 28 px (`rounded-[24px]`), botones en píldora (`rounded-full`).
- **Bordes de 2 px** en `teal-oscuro` en lo importante (tarjetas protagonistas, botones, menús). Lo secundario puede ir con borde fino `borde`.
- **Sombra dura** (`shadow-dura`, `shadow-dura-chica`): desplazada, sin desenfoque. Los botones "saltan" al pasar el mouse (`-translate-y-0.5` + más sombra) y se hunden al tocarlos (`active:translate-y-0.5 active:shadow-none`).
- **Giros leves** (±1 a 3°) en notas, etiquetas y tarjetas sueltas; nunca en texto largo ni en formularios.

## El monito

- Dibujos en [public/monitos/](public/monitos/) (`asoma`, `calculadora`, `caja`, `celular`, `moneda`, `saluda`, `thumbsup`); faltan durmiendo y con lupa. En la landing se usan con el componente `Monito` (se pinta con `text-*` porque es una máscara); en el panel, `Gorila` para el isotipo.
- Siempre asomándose, sentado sobre un borde o en una esquina, nunca flotando solo. Tamaño chico a mediano.
- Aparece en **momentos**: estados vacíos, "Todo al día", primeros pasos, errores amables, celebraciones. No decora cada tarjeta.
- Habla en globos o notas cortas: "Tranquila, yo llevo la cuenta."

## Voz y textos

- Español salvadoreño con **voseo** (tenés, mandá, apartés). Todos los textos en [src/lib/textos.ts](src/lib/textos.ts).
- Corto, concreto, con calidez: "Todavía no hay pedidos. Cuando apartés algo, aparece acá."
- Los estados vacíos hablan con la voz del monito y siempre traen una acción.
- **Sin emojis** y sin "Powered by AI" (app.md §6.1). Se dice "redes sociales (Instagram, Facebook, WhatsApp)", no "Instagram" a secas.

## Movimiento

- Animaciones con rebote suave (`entra`, `asomar`, `flotar`); la sección **nunca cambia de tamaño** mientras se anima (reservar el espacio con `invisible`).
- Todo respeta "reducir movimiento".

## Cómo se aplica al panel

- Menú lateral en `crema`, con la acción rápida en mango y el estado activo en `teal-fondo` con una barrita mango.
- Cada pantalla: título con personalidad (saludo, frase), una tarjeta protagonista con borde de 2 px y sombra dura, y los estados vacíos con el monito.
- Datos en tarjetas con color de acento cuando son lo importante (la ganancia en `limon`); el resto, neutras.
- Lo funcional (tablas, formularios, filtros) se mantiene claro y sobrio; la marca se nota en el marco, no en cada celda.
