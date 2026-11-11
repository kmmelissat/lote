# Rediseño del panel: lo hecho, lo decidido y lo que sigue

Nota de traspaso entre chats. **Última actualización: 31 de octubre de 2026.** Léela completa antes de tocar una pantalla del panel. Complementa a [PROGRESO.md](PROGRESO.md) (estado general), [BRANDING.md](BRANDING.md) (la marca) y [GESTION.md](GESTION.md) (las finanzas del negocio).

El sistema de diseño vivo está en la página `/design-system` del panel ([src/features/design-system/SistemaDeDiseno.tsx](src/features/design-system/SistemaDeDiseno.tsx)). Ahí se documentan los componentes con ejemplos que funcionan. Si cambias una regla, actualízala ahí también.

---

## 1. Cómo trabaja la dueña (importante para no repetir errores)

- **Prefiere ver antes que leer.** Lo que mejor funcionó: publicar un *artifact* con 2 o 3 propuestas dibujadas (HTML con los colores y fuentes de la marca) y que ella elija. Cada vez que adiviné en código, hubo varias vueltas. Para pantallas nuevas: **dibujar primero, codificar después**.
- **"No me gusta" sin más detalle** quiere decir que falta un criterio: no sigas ajustando a ciegas. Pregunta con opciones (`AskUserQuestion`) o pide una captura. Las capturas que manda son muy útiles: léelas con cuidado.
- Los mensajes que llegan **mientras trabajas** suelen ser correcciones puntuales sobre lo que acabas de hacer. Aplícalos sin discutir.
- **Nunca me dijo qué quiere con palabras de diseño**, sino con ejemplos: "como Mi tienda", "como Shopify", una captura de otra app. Pide referencias.
- Sentimientos recurrentes: *"todo pesa lo mismo"*, *"no sé por dónde empezar"*, *"too much"*, *"se siente plano/aburrido"*, *"espacio perdido en desktop"*. El punto medio que busca: **juvenil, colorido y divertido, pero que se sepa adónde ir y sin ruido**.
- **El SQL lo corre ella**, los **commits también**. El agente solo lee la base con `execute_sql`, `list_tables` y `get_advisors`.
- Español salvadoreño con voseo, **sin emojis y nunca la palabra "plata"** (se dice "dinero").

---

## 2. Reglas del sistema de diseño (decididas, no re-discutir)

1. **El sistema es solo para el panel.** La landing, el Marketplace y las vitrinas se quedan juguetones. Los componentes compartidos traen una opción para lo público (`StatusChip publico`).
2. **Marca y jerarquía van por separado.** El contorno de 2 px, las esquinas redondas, Punch y el rebote van parejos en todo (eso es la marca). La **jerarquía** la dan el relleno de color, la sombra dura y el tamaño: una cosa fuerte por pantalla, pocas medias, el resto callado.
3. **Un solo botón mango por pantalla** (la acción principal). Todo botón lleva ícono; los de solo ícono son `BotonIcono` (redondos, con `etiqueta`).
4. **El color significa algo.** Limón = esperar o advertencia, rosa = dinero, ámbar = ojo (poco stock, falta algo), teal = bien, celeste = en camino, rojo = problema. Las bandas de las tarjetas de números usan el color del estado (`colorDeEstado`).
5. **Tarjetas:** `Card` con contorno de 2 px y sin sombra (la sombra dura es solo para lo que se toca). Los niveles son `plano`, `tarjeta` e `interactivo`; los tonos, `neutra`, `marca`, `aviso` y `error`. **No hay tarjeta crema.**
6. **Punch a color** (`LotitoMas`, el de la landing), nunca el monito gris viejo (`Monito`). Aparece en momentos (vacíos, avisos), no decorando cada tarjeta.
7. **Avisos:** gris con ícono para informar; **limón solo para lo que de verdad advierte** (`Aviso`).
8. **Filtros:** chips tranquilos (texto gris, el elegido en teal suave), sin borde ni cajita para la cantidad. Selectores en píldora (`ListaDesplegable variante="pildora"`).
9. **Tablas y listas:** dentro de una `Card` con `p-0`, filas con línea fina, encabezado en gris chico, hover en teal suave, chips de estado sin borde (`discreto`).
10. **Guardar:** botón con ícono que se prende solo si algo cambió, con "Todo guardado / Tenés cambios sin guardar" al lado.
11. **Pocos textos de ayuda.** Si el campo se explica con su etiqueta o su ejemplo (placeholder), no hay párrafo.
12. **Interruptores:** el colorido (riel limón que pasa a mango, perilla blanca), a ella le gusta tal cual. **Elecciones (radio y casillas):** `OpcionRadio` y `OpcionCheck`, con contorno, sombra y un check que rebota.
13. **No se tocan:** el menú lateral y la barra del celular, que le encantan.

Para "mostrar cuántos hay de algo" usar `TarjetaDato`: contorno de 2 px, banda de color por estado, ícono redondo, número en la tipografía del logo. Es lo que le gusta (más que `TarjetaStat`, que ya no se usa en ninguna pantalla real).

---

## 3. Componentes nuevos o cambiados

| Componente | Qué es |
|---|---|
| `Button` / `ButtonLink` | Nuevas opciones: `tamano="chico"`, `icono="..."`, variante `suave` (borde fino, sin sombra). Se quitó la variante `acento`. Alturas: normal 48 px, chico 44 px en celular y 40 px en desktop. |
| `BotonIcono` / `BotonIconoLink` | Redondo, de solo ícono. Alturas iguales a las del botón con texto (`tamano="normal"` 48 px, `"chico"` 40 px). Variantes: secundario, mango, peligro, suave. |
| `Card` | `nivel` y `tono` (ver arriba). `estiloCard()` para usar el estilo en un `<Link>`. |
| `Aviso` | Línea con ícono: `info` (gris) o `alerta` (limón). |
| `TarjetaDato` | Número con etiqueta, banda de color, ícono opcional, enlace opcional y `alTocar` (para filtrar sin recargar). Vive en `components/ui` porque la usan Inicio, Pedidos, Productos, Clientes y el detalle del producto. |
| `OpcionRadio`, `OpcionCheck` | Elecciones con personalidad (reemplazan los radios armados a mano). |
| `Pestanas` (nav) | Ahora son chips tranquilos y esconde los estados en cero (menos "Todos" y el activo). La usan Pedidos, Clientes y Ganancia. |
| `StatusChip` | Opciones `publico` y `discreto`; `colorDeEstado()`. "Disponible" pasó a teal suave y "Poco stock" a ámbar **en el panel**. |
| `EmptyState` | Tarjeta blanca punteada con Punch a color. |
| `Interruptor` | Se queda colorido (es una excepción a "mango es la acción", a propósito). |
| `ListaDesplegable` | Nueva `variante="pildora"`. |
| `MenuAcciones` | El botón es redondo y de 48 px. |
| `Confirmar` y `Ventana` | Mismo contorno de 2 px, sin sombra dura; el botón de confirmar es mango (o rojo si es peligro). |
| `Icon` | Íconos nuevos: `editar`, `borrar`, `descargar`, `atras`, `adelante`, `ojo`. |

---

## 4. Pantallas: estado

**Migradas y aprobadas**
- **Inicio:** nota adhesiva "Para hoy" (lo pendiente) con Punch asomando, que ahora integra el siguiente paso de "Primeros pasos"; tarjetas de números con banda de estado; "Ganancia de la semana" como cartoncito con ojal. Sin botón "Nuevo producto" en el encabezado. Prototipo aprobado: dirección A, "Cuaderno".
- **Productos (lista):** tarjetas de números arriba (Disponibles, Poco stock, Valen, Ganancia posible), búsqueda y "Filtros" plegados (categoría, orden, "sin costo", "sin foto"), tabla con categoría y vendidas en pantalla ancha, Importar como botón redondo. La lista trae **todos** los productos (antes se cortaba en 100).
- **Pedidos:** búsqueda en el servidor (por número o por nombre de la clienta), paginación para todos los estados, tarjetas de números arriba.
- **Clientes:** tabla con orden, tarjetas de números, botón "Cobrar" por WhatsApp. También la ficha de cada clienta.
- **Mi tienda** (`/ajustes/tienda`): las tres pestañas (Tienda, Pagos, Envíos) con avisos grises, Punch a color y botón de guardar que se prende solo. **Pagos** quedó como "Elegir y completar": etiquetas `OpcionCheck` y abajo solo los campos de los métodos elegidos, con plantilla para transferencia.
- **Nuevo producto y editar producto** (el mismo formulario): ver sección 5.
- **Detalle del producto:** tres tarjetas de números arriba (Disponibles, Apartadas, Vendidas); a la izquierda y pegajosa, la tarjeta de vitrina con la descripción y las etiquetas adentro y "Ver en la vitrina"; a la derecha el panel (Lo que te deja, Variantes, **Últimos pedidos de este producto**, Fotos en cuadrícula si hay más de una, Compartir, avisos de stock, código de barras y borrar). "Editar" es el único mango; el menú ⋯ lleva reponer, agregar variante y "otra igual".

**Sin migrar (siguen con el estilo viejo)**
- Pedido (detalle) y **nuevo pedido**, y el **Mostrador** y su caja.
- Ajustes (la página principal) y las demás pestañas de ajustes (categorías ya está, falta equipo, reseñas, ayuda, exportar, vitrina).
- Importar productos (`ImportarCsv`) y el formulario de **varias fotos** (`LoteForm`, que solo se tocó un poco).
- Ganancia: la reemplazó Dinero, y Dinero se eliminó el 3 de nov. Hoy es Gestión y Movimientos (ver [GESTION.md](GESTION.md)).
- Asistente (chat) y la burbuja de Punch.
- `Pestanas` de Ganancia/Clientes ya cambiaron, pero revisar que se vean bien.

---

## 5. El formulario de producto (lo más trabajado)

Archivo: [NuevoProductoForm.tsx](src/features/products/ui/NuevoProductoForm.tsx). Estructura final:

- **Pantalla ancha:** a la izquierda, la tarjeta de vitrina del producto (se arma sola; `VistaPreviaProducto`); a la derecha los pasos. **Pantalla angosta:** una sola columna y un botón "Ver cómo queda" que abre la vista previa en una ventana. Guardar va **siempre en la barra fija de abajo**.
- **Pasos numerados con título subrayado de color** (como Mi tienda), con los campos sobre un panel gris suave:
  1. **Foto** (con Punch).
  2. **Información del producto:** nombre y categoría; precio y precio de antes; lo que te costó y cantidad (dos filas de dos); la ganancia por unidad en una línea; descripción.
  3. *(opcional, plegado)* **Marca, condición y detalles.**
  4. *(opcional)* **Variantes.**
  5. *(opcional)* **Más costos** (envío, importación, otros) y el precio sugerido.
- Los pasos opcionales traen una etiqueta "Opcional", un resumen a la derecha y se abren al tocarlos. **Se abren solos** si tienen un error, si Punch llenó algo ahí, o al editar un producto que ya tiene datos.
- **Todo lo que llena Punch** lleva el chip "✦ Punch" (nombre, categoría, descripción, marca, detalles y variantes) y se quita con "Deshacer lo de Punch".
- **Variantes** ([EditorVariantes.tsx](src/features/products/ui/EditorVariantes.tsx)), estilo Shopify: una cosa a la vez. Atajos para empezar (Talla, Color, Sabor, Otra opción); cada opción se edita sola y se cierra con "Listo" en un resumen; tabla **agrupada por la primera opción** con los grupos cerrados (el precio o el costo que escribes en un grupo vale para todas sus variantes); fotos en la miniatura de cada fila (la del grupo, o la de una sola variante). Lo que se guarda no cambió.
- **Categorías fijas:** el producto solo elige de la lista de su tienda. Se crean en Ajustes → Categorías, cada una con un rubro. La base lo exige.
- El aviso para **cargar muchos productos** (varias fotos a la vez o Excel/CSV) va como dos botones en el encabezado de "Nuevo producto".

**Punch y las variantes:** el prompt ([fotoAFicha.ts](src/features/ai/prompts/fotoAFicha.ts)) ahora trata varios artículos distintos en una foto (por ejemplo varios CDs) como variantes, con la opción "Álbum" o "Diseño". **No está probado con una foto real** (la prueba con la IA necesita la clave). Si falla, pedirle a la dueña la foto.

---

## 6. Base de datos: archivos y estado

| Archivo | Para qué | Estado |
|---|---|---|
| `supabase/categorias_fijas.sql` | Rubro por categoría y restricción para que el producto solo tenga categorías de su lista | **Corrido** (verificado). El archivo quedó con una sola palabra por un accidente en el IDE: su contenido se perdió, la base sí está bien. |
| `supabase/rubros_guardados.sql` | Explorar usa el rubro guardado | **Corrido** (`explorar_categorias` ya devuelve `rubro`). |
| `supabase/gasto_metodo.sql` | Cada gasto guarda su método de pago (Dinero) | **Corrido** (existe la columna). |

---

## 7. Pendiente, por prioridad

1. **Probar con la foto real** de los CDs de Taylor Swift que Punch arme variantes. Si no, reforzar el prompt con un ejemplo.
2. **Revisar el formulario en pantalla** (nunca se vio renderizado por el agente): el orden de los bloques opcionales, el ancho de la columna, la tabla de variantes y el abrir/cerrar solos.
3. **Migrar** lo que falta de la lista de la sección 4 (Pedido y nuevo pedido, Mostrador, resto de Ajustes, Importar).
4. **Precio de antes en la vista previa:** el campo no se sigue en vivo, así que la tarjeta no puede mostrar el "−20 %". Si lo quiere, hay que controlar ese campo.
5. **Migrar las tarjetas viejas** (`TARJETA` a mano) a `Card` donde queden. Buscar con `grep -rn "TARJETA\b" src`.
6. **Acciones en bloque en la lista de Productos** (seleccionar varias filas) y "sin venderse hace N días".
7. Mejoras sugeridas para Mi tienda sin hacer: QR de la vitrina, dirección y horario del local, validar el enlace mientras se escribe, probar el WhatsApp.
8. El **detalle del pedido** y el de **clientes** pueden reusar el patrón del detalle del producto (números arriba + tarjeta a un lado + panel).

---

## 8. Verificación y trampas

- Antes de dar algo por hecho: `npx tsc --noEmit`, `npx eslint src`, `npx vitest run` y, para cambios grandes, `npx next build` (y reiniciar `pnpm dev` después).
- **Ningún cambio de diseño se vio en pantalla desde el agente** (las pantallas necesitan sesión). Siempre dile a la dueña que lo revise y pide captura.
- **El panel quita el relleno de abajo** (`has-[.barra-formulario]:pb-0` en [src/app/(panel)/layout.tsx](src/app/(panel)/layout.tsx)) cuando hay una barra de guardar en la página, aunque esté oculta. Si ocultas la barra en una pantalla, el contenido queda pegado al borde.
- **Dos cosas pegajosas anidadas se empujan y se pisan.** Pega solo la de afuera.
- **Una clase de ancho y otra con `w-full` se pisan** según el orden del CSS, no el de la clase. Usa una rejilla.
- `.next/types` suele marcar errores falsos hasta que se regeneran.
- Mientras se escribía esto había errores de tipos y una advertencia de `eslint` en el trabajo de Dinero (otro agente): no son de este rediseño.

---

## 9. Prototipos (artifacts)

Son privados de la cuenta de la dueña; los HTML no se guardaron todos en el repo. Los de variantes, formulario y detalle del producto se pueden regenerar a partir de las capturas y de este documento.
