# Migración total de Lote a Punch

Hasta ahora se rediseñaron las **rutas internas del panel** (inicio, vender, pedidos, productos, asistente, etc.). Este documento ordena lo que falta para que **toda** la app use el sistema Punch y se pueda borrar lo viejo.

Referencias: [PUNCH.md](PUNCH.md) (sistema de diseño), [BRANDING_PUNCH.md](BRANDING_PUNCH.md) (marca), [BRANDING.md](BRANDING.md) (marca vieja, se retira al final).

## Qué es "estilo viejo"

Se reconoce en el código por:

- Bordes gruesos (`border-2`, `border-4`, `border-[2px]`, `border-[3px]`) y sombras duras (`shadow-[Npx_Npx_0…]`, `shadow-duro`).
- Colores de borde viejos: `border-borde` y `border-borde-control` (en Punch: `border-linea`).
- Fondo crema con puntitos y monitos como decoración.
- Componentes viejos: `Card`, `Button`, `Aviso`, `Textarea`, `EmptyState`, `TarjetaStat`, `Confirmar` (en Punch: `TARJETA_PUNCH`, `BotonPunch`, `EnlacePunch`, `EncabezadoTarjeta`, `InfoPunch`).

Comando para medir el avance (debe bajar a 0 en cada fase):

```bash
grep -rlE "border-(2|4)( |\"|$)|border-\[(2|3)px\]|shadow-\[[0-9]+px_[0-9]+px_0|shadow-duro|border-borde" src
```

## Reglas para todas las fases

- Un mockup HTML temporal (en el scratchpad, nunca Artifact) antes de cada pantalla grande; los ajustes chicos van directo.
- Textos en `src/lib/textos/`, en español salvadoreño; decir "dinero", nunca "plata".
- Al terminar cada pantalla: `npx tsc --noEmit`, `npx eslint <archivos>`, `npx vitest run <carpeta> --reporter=dot`. La suite entera y `next build` solo al cerrar una fase.
- Actualizar `docs/FEATURES.md` (y `PUNCH.md`) cuando cambie lo que hace una pantalla o el mapa del repo.
- Un commit por pantalla o grupo chico, sin líneas de atribución de IA.
- Ver en móvil y escritorio antes de cerrar (pedir captura si no se puede ver).

## Fase 1: Landing (`/` y `/landing-mas`)

Código: `src/features/landing/ui/` (`comun.tsx`, `mas/`).

- [ ] `comun.tsx`
- [ ] `mas/Hero.tsx` y `mas/HeroEscena.tsx`
- [ ] `mas/Cinta.tsx`
- [ ] `mas/Problema.tsx`
- [ ] `mas/Principios.tsx`
- [ ] `mas/Funciones.tsx`
- [ ] `mas/Buscar.tsx`
- [ ] `mas/Pasos.tsx`
- [ ] `mas/PlanesPrecios.tsx`
- [ ] `mas/Preguntas.tsx`
- [ ] `mas/Cierre.tsx`
- [ ] Imágenes `public/landing/lotito-*.webp`: reemplazar por arte de Punch y renombrar.
- [ ] Revisar textos de la landing (nombre, `terminos`, `privacidad`).
- [ ] Decidir si `/landing-mas` pasa a ser `/` y se retira la landing anterior.

Hecho cuando: el comando de arriba no devuelve nada en `src/features/landing`, y la página se ve igual de coherente que el panel.

## Fase 2: Marketplace y tiendas

Rutas: `/marketplace`, `/c/[negocio]/[codigo]` (vitrina y producto), `/p/[pedido]` (seguimiento).
Código: `src/features/catalog/ui/`, `src/app/c/`, `src/app/p/`.

- [ ] Explorar: `CuerpoExplorar`, `SobreExplorar`, `BarraFiltros`, `PanelFiltros`, `MenuCategorias`, `BuscadorAutocompletar`, `Plegable`.
- [ ] Tiendas: `PaginaTiendas`, `BandaTiendas`, `TarjetaTiendaLista`.
- [ ] Compra: `PanelCarritos`, `TicketPedido`, `camposCompra`, `EscribirALaTienda`.
- [ ] Páginas `c/[negocio]/[codigo]/page.tsx` y `p/[pedido]/page.tsx`.
- [ ] La vitrina de cada tienda: decidir cuánto se parece a Punch y cuánto deja de personalización a la persona que vende.
- [ ] Reseñas (`src/features/reviews`) y seguimiento (`src/features/tracking`): revisar que usen los mismos componentes.
- [ ] Imágenes `public/mercadito/`, `public/seguimiento/` y `public/monitos/` que sigan en uso: reemplazar o quitar.

Hecho cuando: ninguna pantalla pública usa bordes gruesos ni sombras duras, y funciona bien en celular (es donde más se usa).

## Fase 3: Formularios y pantallas internas sin pasar a Punch

**Es lo más importante.** Es lo que la persona usa todos los días dentro del panel.

Agrupado por lo que hace, para migrarlo por flujo:

**Productos**
- [ ] `EditorVariantes`, `LoteForm`, `ZonaFotos`, `FotoInput`, `SelectorGaleria`
- [ ] `SelectorProductos` (promociones), `NuevaOferta` (ofertas)

**Pedidos, cobro y envío**
- [ ] `ProgresoPedido` (borde grueso suelto)
- [ ] `PagosForm`, `CampoTelefono`
- [ ] `EnvioPedido`, `TarifasForm`, `ZonasEntregaInput`, `PagoPaquetera`

**Vender**
- [ ] `EntregaDeVenta`, `ModoDeVenta`

**Tienda y ajustes**
- [ ] `TiendaForm` (store-settings)
- [ ] Resto de ajustes, equipo (`team`), invitación, auth (`(auth)`, `(onboarding)`)

**Dinero**
- [ ] `PiezasCuadre` (gastos y ganancia)
- [ ] `DatoSencillo` (balance), `GraficoSemanas` (inicio)

**Importar y exportar**
- [ ] `PiezasImportar`, `FotoFila`

**Campos y piezas de formulario (se migran junto con los de arriba)**
- [ ] `Textarea`, `OpcionCheck`, `OpcionRadio`, `BarraFormulario`
- [ ] `EmptyState`, `TarjetaStat`, `Aviso`, `Confirmar`, `Card`
- [ ] `nav/ListaMenuVertical`

**Admin y ayuda**
- [ ] `/admin` y `/ayuda`: revisar y pasar a Punch.

Método: por cada formulario, cambiar sus campos a los de Punch (borde `border-linea`, foco teal con `ring-[3px] ring-teal/20`, altura 44 en móvil), sus botones a `BotonPunch`, sus tarjetas a `TARJETA_PUNCH` con `EncabezadoTarjeta`, y sus avisos a chips de color. Cuando una pieza compartida (por ejemplo `Textarea`) ya no tenga usos viejos, pasa a la lista de la fase 5.

Hecho cuando: el comando de medición no devuelve nada en `src/features` ni en `src/app/(panel)`.

## Fase 4: Borrar la presentación (`/presentacion`)

Se borra, no se migra. Va casi al final para no desviar trabajo.

- [ ] Borrar `src/features/presentacion/` y `src/app/presentacion/`.
- [ ] Quitar el enlace desde cualquier menú, `sitemap.ts` y `robots.ts`.
- [ ] Quitar sus textos en `src/lib/textos/` y sus imágenes de `public/`.
- [ ] Revisar `docs/FEATURES.md` y el README.
- [ ] Correr `tsc`, `eslint` y la suite entera.

## Fase 5: Quitar los componentes compartidos viejos

Solo cuando **nada** los use. Para cada uno:

1. `grep -rn "<Nombre" src` (y sus imports): debe dar 0 usos fuera de su propio archivo y de `design-system`.
2. Borrar el archivo, su prueba si la tiene y su entrada en `src/features/design-system`.
3. Correr `tsc` y `eslint`.

Candidatos: `Card`, `Button`, `Aviso`, `Textarea`, `EmptyState`, `TarjetaStat`, `Confirmar` (revisar si Punch tiene su versión), `OpcionCheck`, `OpcionRadio`, `BarraFormulario`, `Pie`.

Después:

- [ ] Quitar de `globals.css` los tokens viejos (`--color-borde`, `--color-borde-control`, sombras duras, fondo crema y puntitos).
- [ ] Actualizar la página `/design-system` para que solo muestre Punch.
- [ ] Borrar `docs/BRANDING.md` y `docs/REDISENO.md`, o marcarlos como históricos; dejar `PUNCH.md` y `BRANDING_PUNCH.md` como únicas guías.
- [ ] Actualizar `README.md` (lista de documentos).

## Limpieza de nombre (cuando el diseño esté listo)

El texto visible ya dice "Punch", pero el código aún tiene el nombre viejo. Se hace al final porque son cambios grandes y sin efecto visual.

- [ ] Identificadores: `AvatarLotito`, `TextoLotito`, `LotitoMas`, `MARCA_LOTITO`, `CartelLotito`, `useFichaLotito`, `deLotito`, `lotitoAyuda`, `lotitoNota`, `hablarConLotito`, `saludoLotito`.
- [ ] Archivos de imagen con "lotito" o "lote" en el nombre (`public/landing/lotito-*.webp`, `public/lote-iso.svg`, `public/lote-logo.svg`): confirmar si se usan y renombrar o borrar.
- [ ] Eventos de analítica `lotito_mensaje_enviado` y `lotito_foto`: renombrar corta el historial en Mixpanel; decidir si se mantiene el nombre o se empieza uno nuevo.
- [ ] Código sin uso: `src/features/assistant/accionesRepositorio.ts` y los textos `asistente.hoy`, `flotante`, `vacioFlotante`, `placeholderCorto`, y `pestanas`/`secciones` de producto.
- [ ] Nombre del producto "Lote" en `README.md`, metadatos, correos y avisos de WhatsApp.

## Orden y avance

| Fase | Qué | Estado |
|---|---|---|
| 0 | Rutas internas del panel | Hecho |
| 1 | Landing | Pendiente |
| 2 | Marketplace y tiendas | Pendiente |
| 3 | Formularios y pantallas internas | Primera pasada hecha (11 nov): bordes, sombras y colores viejos cambiados en el panel, auth, admin y ayuda; falta revisar pantalla por pantalla |
| 4 | Borrar presentación | Pendiente (al final) |
| 5 | Quitar componentes compartidos | Pendiente (cuando nada los use) |
| 6 | Limpieza de nombre | Pendiente |

Nota: el orden de las fases 1 a 3 es el que se pidió, pero la fase 3 es la de más valor; si hay poco tiempo, se puede adelantar sin romper nada, porque las fases no dependen entre sí. Las fases 4 y 5 sí van al final: la presentación y los compartidos solo se pueden borrar cuando nada los use.
