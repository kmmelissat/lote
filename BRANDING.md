# Lote: la marca

Nota para no olvidarla. Cada pantalla, también las del panel, tiene que sentirse **de la misma marca que la landing**: juguetona, cálida y un poco desordenada a propósito. Nada de "panel genérico" gris y blanco.

> **Panel: marca y jerarquía van por separado.** El contorno de 2 px, las esquinas redondas, Lotito y el movimiento van parejos en todo (eso es la marca). La jerarquía la dan el relleno de color, la sombra dura y el tamaño: una cosa fuerte por pantalla, pocas medias, el resto callado. El color solo se usa si significa algo. Detalle en `/design-system`.

## Vibe

- **Amiga que lleva la cuenta.** Lote es la compañera del emprendimiento chiquito que vende por redes: cercana, rápida, sin tecnicismos. El monito (el gorila) es su voz.
- **Pegado a mano.** Etiquetas, notas y stickers un poco torcidos, como pegados con cinta. Bordes gruesos y sombras duras, como un sticker o un libro de recortes.
- **Serio con la plata, ligero con el resto.** Los números siempre claros y exactos; todo lo demás puede jugar.
- Referencias de ánimo: stickers, cuadernos de emprendedoras, neo-brutalismo suave (bordes y sombras duras, colores planos), no corporativo.

## El vibe cartoon

Lote se ve como un **dibujo animado hecho a mano**, no como una app. Es lo que la hace reconocible; si una pantalla se siente "de panel", le falta cartoon.
- **Contorno grueso en todo.** Todo lo importante lleva borde de 2 px en `teal-oscuro`, el mismo color de las líneas de los dibujos del monito y de las ilustraciones. Contorno oscuro + relleno plano = cartoon.
- **Color plano, sin degradados ni desenfoques.** Bloques de color liso (mango, limón, rosa, celeste, crema), como un dibujo coloreado con marcador. Las sombras son **duras y desplazadas** (abajo a la derecha), como un sticker despegado del papel.
- **Formas redondeadas y blandas.** Radios grandes, píldoras, círculos; nada de esquinas filosas. Hasta el toldo, el globo del monito y los cartoncitos de precio tienen las puntas redondeadas.
- **Un poco torcido a propósito.** Las cosas están pegadas, no alineadas: giros de ±1 a 10° en stickers, etiquetas e ilustraciones sueltas (nunca en texto largo ni en formularios). La perfección geométrica se siente corporativa.
- **Personaje con voz.** Lotito reacciona como un personaje de caricatura: se asoma, se levanta cuando enfocás el buscador, habla en globos con borde grueso y la cola del globo apunta a él.
- **Objetos con carita de ilustración.** Las cosas se dibujan, no se fotografían: la tartaleta, la blusa, el bolso y el case son stickers con el mismo trazo que el monito. Una foto de stock rompe el vibe.
- **Movimiento de dibujo animado.** Rebote suave (`asomar`, `entra`), balanceo de cosas colgadas (`balancea`), flotar, girar despacito. Todo "squash and stretch" liviano; nada de fundidos lineales ni transiciones de aplicación.
- **Escenas, no pantallas.** Cuando una sección lo permite, se arma como una escena con objetos puestos en un lugar (el puesto de feria con toldo, mesa y productos; el monito sobre el borde del buscador), con profundidad por capas: fondo, personaje detrás, objetos delante.
- **Textura de cuaderno de recortes:** etiquetas con hilo, notas adhesivas, cinta, bordes punteados en lo vacío. Nada de vidrio, cristal ni brillos.

Cómo comprobarlo: si se le quitan los colores, tiene que seguir viéndose como una ilustración (contorno, formas, giros); y si se le quita el texto, el personaje y los objetos tienen que contar qué es.

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
| `celeste` | #8fd6f4 | Acento fresco: sombras de stickers sobre fondos oscuros, detalles de tecnología |
| `celeste-palido` | #e2f4fc | Fondos suaves con el celeste (tarjetas de categoría); el fondo del puesto del mercadito, para que las rayas verdes del toldo se distingan |
| `crema` | #fff7e8 | Fondo cálido: menú lateral, hero, hojas |
| `superficie` / `fondo` | #fff / #f5f8f7 | Páginas y tarjetas neutras |

Reglas: un solo mango principal por pantalla; el texto siempre `teal-oscuro` sobre los acentos (contraste comprobado); los acentos van en bloques de color plano, sin degradados.

## Formas

- **Radios grandes:** tarjetas y bloques de 20 a 28 px (`rounded-[24px]`), botones en píldora (`rounded-full`).
- **Bordes de 2 px** en `teal-oscuro` en lo importante (tarjetas protagonistas, botones, menús). Lo secundario puede ir con borde fino `borde`.
- **Sombra dura** (`shadow-dura`, `shadow-dura-chica`): desplazada, sin desenfoque. Los botones "saltan" al pasar el mouse (`-translate-y-0.5` + más sombra) y se hunden al tocarlos (`active:translate-y-0.5 active:shadow-none`).
- **Giros leves** (±1 a 3°) en notas, etiquetas y tarjetas sueltas; nunca en texto largo ni en formularios.

## El monito

- Dibujos en [public/monitos/](public/monitos/) (`asoma`, `calculadora`, `caja`, `celular`, `moneda`, `saluda`, `thumbsup`); falta durmiendo. El monito con lupa no tiene dibujo propio todavía: en el hero del mercadito es el `asoma` con una lupa en SVG encima (ver abajo). En la landing se usan con el componente `Monito` (se pinta con `text-*` porque es una máscara); en el panel, `Gorila` para el isotipo.
- Siempre asomándose, sentado sobre un borde o en una esquina, nunca flotando solo. Tamaño chico a mediano.
- Aparece en **momentos**: estados vacíos, "Todo al día", primeros pasos, errores amables, celebraciones. No decora cada tarjeta.
- Habla en globos o notas cortas: "Tranquila, yo llevo la cuenta."

## El mercadito (hero del Marketplace)

Prueba en [/marketplace/mercadito](src/app/marketplace/mercadito/page.tsx), componente [HeroMercadito](src/features/catalog/ui/HeroMercadito.tsx). Idea: el Marketplace es **un puesto de feria**, no un banner con fotos pegadas (la feria, el mercado, el tiangue).

- **Toldo** de rayas `teal` y `crema` con borde ondulado, en SVG. El fondo del puesto va en `celeste-palido`: sobre `teal` las rayas verdes desaparecen y el toldo se lee como bultos crema.
- **El buscador es el centro**: grande, centrado, el único botón mango. Lotito se asoma por detrás de su esquina, con globo ("¿Qué andás buscando?"; al enfocar dice "¡Dale, decime!") y una lupa que levanta al enfocar. El placeholder rota entre frases ("un regalo para mamá…", "algo dulce…") y nombres de productos reales.
- **La mesa** (`limon`, borde superior `mango`) es donde se apoyan los productos. Las ilustraciones se riegan por todo el hero, cada una con su tamaño, altura y giro, **sin repetir ninguna y sin dos productos del mismo tipo**; el centro (titular, buscador, Lotito) se deja libre.
- **Ilustraciones** hechas con OpenAI (`pnpm imagenes-mercadito`, [scripts/imagenes-mercadito.mts](scripts/imagenes-mercadito.mts)): estilo sticker plano, trazo grueso `teal-oscuro`, fondo transparente, sin texto ni personas. Viven en [public/mercadito/](public/mercadito/). No son productos reales: los precios son de ejemplo.
- **Cartoncito de precio** chico, colgado de un hilo en la esquina de arriba, medio afuera de la ilustración para no taparla; se balancea (`balancea`). Al pasar el mouse, el producto se endereza y sube.
- **Detalles**: contador animado "N productos · N tiendas" y un sello giratorio "Hecho en El Salvador" (`girar-lento`), solo en pantallas grandes, igual que las ilustraciones del fondo. Todo respeta "reducir movimiento".
- **Altura**: se mantuvo baja a propósito (alrededor de 280 px en escritorio); antes de agregar algo, comprobar que no la suba.

## Ilustraciones de producto

Cuando no queremos productos reales (portadas, fondos, estados vacíos) usamos ilustraciones propias, no fotos.

- **Estilo:** ilustración plana tipo sticker, trazo grueso en `teal-oscuro` (#003844), colores cálidos (mango, rosa, crema, verde azulado), sombreado mínimo, **un solo objeto** centrado y completo, **fondo transparente**, sin texto, sin marcas, sin manos ni personas. Es el `ESTILO` de [scripts/imagenes-mercadito.mts](scripts/imagenes-mercadito.mts); para una nueva, solo se agrega el objeto a `OBJETOS`.
- **Tamaño y formato:** 512 × 512 `webp` con transparencia, en [public/mercadito/](public/mercadito/). Se les da una sombra dura suave con `drop-shadow` en lugar de marco.
- **Qué objetos:** cosas que se reconocen de lejos y representan lo que se vende acá: comida (tartaleta, taza con pan dulce), ropa (blusa de lino), accesorios (aretes, bolso de palma, case de iPhone), plantas (monstera, suculenta).
- **Nunca repetir:** ninguna ilustración dos veces en la misma pantalla, ni dos del mismo tipo (dos plantas, dos dulces). Si falta variedad, se genera otra de un tipo nuevo; no se reutiliza.
- **Sin nombres:** van solas, con su precio en cartoncito. El nombre solo en el `alt`.
- **Precios de ejemplo:** siempre en formato `$16.00`, y se aclara en el código que no son reales.

## Decisiones de diseño del hero (lo que se probó y por qué)

Para no repetir vueltas, esto salió de iterar el hero del mercadito con Melissa:

- **Centrado y simétrico.** Con el titular a la izquierda, Lotito a la derecha y el buscador de lado, nada cuadraba. El buscador va al medio y es lo más grande.
- **Baja altura.** Alrededor de 280 px en escritorio. Todo lo que se agrega tiene que caber sin subirla.
- **Productos chicos y regados**, no en fila ni en grilla; cada uno con otro tamaño, altura y giro. Que se sienta como cosas puestas en un puesto.
- **Precios discretos.** Cartoncitos de 10 px que no tapen la ilustración.
- **Sin nombres de producto** y **sin repetir** ilustraciones ni tipos de producto.
- **Lo que no se toca:** el centro (titular, buscador, Lotito) queda libre de ilustraciones, y el sello va en una esquina.
- **Fondo celeste, no verde**, para que el toldo se lea como toldo.
- **En celular** se oculta lo decorativo (ilustraciones del fondo, sello, Lotito con su globo) y quedan toldo, titular, buscador y la mesa con los productos.
- **Pendiente:** un dibujo propio de Lotito con la lupa en la mano (hoy es una lupa en SVG sobre el `asoma`); el mercadito todavía vive en una ruta de prueba y no reemplaza el hero de [PaginaExplorar](src/features/catalog/ui/PaginaExplorar.tsx).

## Tipografía

- **Plus Jakarta Sans** (`font-sans`) para todo el texto. **Fredoka** (`font-logo`) solo para el logo.
- Títulos en **negrita** (`font-bold`), con `tracking-tight` y interlineado apretado (`leading-tight`) cuando son grandes; el texto corrido va en peso normal y `text-texto-2` para lo secundario.
- Escala: título de página 24–32 px, título de tarjeta `text-lg`, texto `text-base`, apoyo `text-sm`; En escritorio la base baja a 14 px (todo en `rem`); en celular se queda en 16 px.
- El subrayado amarillo (`limon`, 14 % de la altura, `box-decoration-break: clone`) resalta **una** frase por titular.

## Botones

Componente [Button](src/components/ui/Button.tsx) (`ButtonLink` para enlaces, `estiloBoton()` para lo que abre una ventana).

- **Forma única:** píldora (`rounded-full`), alto 48 px, borde de 2 px `teal-oscuro`, sombra dura chica, texto en negrita.
- **Variantes:** `primario` (`teal-oscuro` con texto blanco), `mango` (la acción principal de cara a quien compra), `acento` (ámbar), `secundario` (blanco), `peligro` (rojo, solo para lo que no se deshace).
- **Un solo botón mango por pantalla.** Si hay dos acciones, la otra es `secundario`.
- **Estados:** al pasar el mouse sube 2 px y la sombra crece; al tocarlo se hunde (se desplaza 2 px y pierde la sombra); desactivado baja a 50 % de opacidad y sin sombra.
- **Área táctil:** mínimo 44 px (`min-w-11`, y alto de 40 a 48 px en los chicos, como el "Buscar" del buscador).
- Los botones de ícono son círculos de 40–44 px sin borde que se tiñen de `teal-fondo` al pasar el mouse.

## Campos de formulario

- Alto de 48 px (40 px en filtros), radio de 14 px, borde de 2 px en `borde-control` (#6b8990, contraste 3,5 a 1) que pasa a `teal` al enfocar; fondo blanco.
- Etiqueta arriba, `text-sm` en peso medio; lo opcional o sugerido lleva su marca ([Sugerido](src/components/ui/Sugerido.tsx)).
- Error debajo del campo, en `error`, `text-sm`, y además como aviso; el campo se marca con `aria-invalid`.
- El buscador es la excepción: píldora blanca con borde de 2 px `teal-oscuro`, sombra dura y un anillo `rosa` al enfocar.
- Foco visible en todo: `outline` de 2 px en `teal` con 2 px de separación.

## Tarjetas y estados vacíos

- **Tarjeta** ([Card](src/components/ui/Card.tsx)): fondo blanco, relleno de 20 px, radio de 24 px y borde de 2 px `teal-oscuro`. Las protagonistas suman sombra dura.
- **Estado vacío** ([EmptyState](src/components/ui/EmptyState.tsx)): recuadro **punteado** de 2 px `teal-oscuro` sobre `crema`, el monito `rosa` asomándose, título corto, una frase con la voz de Lotito y, si se puede, una acción.
- **Chips de estado** ([StatusChip](src/components/ui/StatusChip.tsx)): píldora con ícono y texto, un solo mapa estado → color. Disponible `teal-fondo`, apartado y pendiente `perla`, pagado `rosa-fondo`, enviado `azul-fondo`, entregado `teal`, cancelado `error`, vendido `gris-fondo`. Nunca solo color: siempre ícono y texto.

## Ventanas (modales) y avisos

- **Ventana** ([Ventana](src/components/ui/Ventana.tsx)): un `<dialog>` de hasta 32 rem, radio de 24 px, borde de 2 px `teal-oscuro` y sombra dura, con fondo oscuro `teal-oscuro/40`. Título en negrita, ayuda en `text-sm`, y una X de 40 px arriba a la derecha. Se cierra con la X, con Escape y tocando afuera.
- **Confirmar** ([Confirmar](src/components/ui/Confirmar.tsx)): lo mismo, más angosto (`max-w-sm`), con dos botones al pie: "Cancelar" (`secundario`) y la acción (`primario`, o `peligro` si no se deshace; en ese caso el foco empieza en "Cancelar"). El botón dice un verbo claro ("Cancelar pedido"), no "Aceptar".
- **Avisos** ([Toast](src/components/ui/Toast.tsx)): aparecen abajo, hasta 3 a la vez, con ícono (éxito `teal`, error `error`, info `texto-2`), mensaje corto y a veces una acción ("Deshacer"). Entran con `aviso` (180 ms).
- **Para alinear:** hoy `Confirmar` y los avisos usan borde fino (`border-borde`) y sombras suaves (`shadow-xl`, `shadow-lg`) en vez del marco de la marca (borde de 2 px `teal-oscuro` y sombra dura). Hay que pasarlos al mismo marco que `Ventana`.

## Bordes y sombras (resumen)

| Elemento | Borde | Radio | Sombra |
|---|---|---|---|
| Tarjeta y ventana | 2 px `teal-oscuro` | 24 px | dura |
| Estado vacío | 2 px `teal-oscuro` punteado | 24 px | ninguna |
| Botón | 2 px `teal-oscuro` | píldora | dura chica, crece al hover |
| Campo | 2 px `borde-control` | 14 px | ninguna |
| Buscador | 2 px `teal-oscuro` | píldora | dura |
| Chip | ninguno | píldora | ninguna |
| Hero (toldo y puesto) | 2 px `teal-oscuro` | 28 px | dura de 6 px en `rosa` |

La sombra dura siempre baja y a la derecha (4 px o 3 px; 6 px solo en el hero), sin desenfoque. Sobre fondos oscuros, la sombra de los stickers va en `celeste`.

## Voz y textos

- Español salvadoreño con **voseo** (tenés, mandá, apartés). Todos los textos en [src/lib/textos.ts](src/lib/textos.ts).
- Corto, concreto, con calidez: "Todavía no hay pedidos. Cuando apartés algo, aparece acá."
- Los estados vacíos hablan con la voz del monito y siempre traen una acción.
- El buscador habla como Lotito: el globo pregunta "¿Qué andás buscando?", y el placeholder rota con frases como "un regalo para mamá…", "algo dulce…", "una blusa de lino…" más nombres de productos reales.
- Títulos y botones con **verbos concretos** ("Guardar cambios", "Cancelar pedido", "Armá tu vitrina gratis"); nunca "Aceptar", "OK" ni "Enviar" a secas.
- Errores amables y accionables: dicen qué pasó y qué hacer, sin culpar ("Revisá el precio: tiene que ser un número").
- Las cifras van exactas y con su formato (`$16.00`, "12 productos · 3 tiendas"); el plural se ajusta ("1 tienda", "2 tiendas").
- **Sin emojis** y sin "Powered by AI" (app.md §6.1). Se dice "redes sociales (Instagram, Facebook, WhatsApp)", no "Instagram" a secas.

## Movimiento

- Animaciones con rebote suave (`entra`, `asomar`, `flotar`), y para el mercadito `balancea` (cartoncitos colgando, ±3° cada 3,2 s) y `girar-lento` (sello, una vuelta cada 18 s), definidas en [globals.css](src/app/globals.css); la sección **nunca cambia de tamaño** mientras se anima (reservar el espacio con `invisible`).
- Todo respeta "reducir movimiento" (`motion-safe:` en CSS, `prefers-reduced-motion` en lo que se anima con JavaScript: el placeholder que rota y el contador). Con movimiento reducido el contador muestra el número final de una vez.
- Lo que reacciona al usuario es chico y con intención: Lotito se levanta y cambia su globo cuando se enfoca el buscador; los productos se enderezan y suben al pasar el mouse.

## Cómo se aplica al panel

- Menú lateral en `crema`, con la acción rápida en mango y el estado activo en `teal-fondo` con una barrita mango.
- Cada pantalla: título con personalidad (saludo, frase), una tarjeta protagonista con borde de 2 px y sombra dura, y los estados vacíos con el monito.
- Datos en tarjetas con color de acento cuando son lo importante (la ganancia en `limon`); el resto, neutras.
- Lo funcional (tablas, formularios, filtros) se mantiene claro y sobrio; la marca se nota en el marco, no en cada celda.
