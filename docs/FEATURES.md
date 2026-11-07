# Lote: qué hace la app

Lote es **tu tienda en línea y tus cuentas claras**, para emprendedores de El Salvador que venden por redes sociales (Instagram, Facebook, WhatsApp). **Afuera:** cada negocio tiene una vitrina con su propio enlace (su tienda en línea) y aparece, si quiere, en el Marketplace; sus clientes compran, apartan o solo ven el catálogo. **Adentro:** inventario, pedidos, cobros, envíos, gastos, ganancia real de cada producto y balance. Es un proyecto del curso Diseño de Productos y Servicios (ciclo 3).

Este documento dice **qué se puede hacer hoy** y, al final, **dónde vive cada cosa** (rutas y código). Es el documento para retomar el proyecto. La especificación completa (incluido lo que falta) está en [app.md](app.md); [PROGRESO.md](PROGRESO.md) es histórico y está desactualizado.

Estado de cada función: **✅** hecha · **🧪** hecha, pero falta probarla con datos o personas reales · **⏳** depende de un tercero (Meta) · **❌** no está.

## Para quien vende (el panel)

### Productos
- ✅ Crear con foto: Lotito (la IA) lee la foto y propone nombre, categoría, marca y descripción; vos confirmás. También "foto + una línea" ("chaqueta negra M, 25, me costó 10").
- ✅ Código corto por producto (#12), cantidad, reponer (recalcula el costo promedio), marca, categoría de una lista, estado (nuevo o usado con nota), detalles (Material, Medidas…) y precio de antes (oferta).
- ✅ Costo real por tipo y ganancia con margen en vivo. El costo se puede poner después. Los tipos dependen de «¿Qué hacés?» (Ajustes → Mi tienda): quien revende ve compra, envío, importación y otros; quien produce, materiales y mano de obra; quien hace las dos cosas, todos.
- ✅ Variantes con cruce (modelo × color, hasta 30 combinaciones), cada una con su stock, precio y costo. Convertir un producto en variantes y agregar variantes después. **Mi galería**: las fotos de arriba y las que se suben en cualquier variante forman la galería del producto; en cada variante (o grupo) se tocan las que van ahí o se sube una nueva (sin elegir ninguna, usa todas).
- ✅ **Mi galería**: una ventana (modal) con todas las fotos que sube el negocio. Cada foto que se sube (producto, variantes, lote) queda guardada ahí. Se abre con «Mi galería» en cualquier zona de fotos para tocar las que se quieren usar (o subir nuevas), y desde Productos (escritorio) para administrarla: ver cuáles están en uso y borrar las que no usa ningún producto. La limpieza diaria de fotos sueltas no toca lo que está en la galería. (Necesita `galeria.sql`.) Código: `src/components/ui/SelectorGaleria.tsx`, `src/lib/galeria.ts`.
- ✅ Lote de fotos: un producto por foto, con el costo total repartido.
- ✅ "Otra igual" (copia precio, costo y categoría), editar, borrar (si no tiene pedidos) y poco stock con umbral propio.
- ✅ Importar desde CSV o desde una hoja pública de Google Sheets (vista previa con errores, ficha y variantes, **deshacer** la importación completa).
- ✅ Texto listo para el post y sticker "VENDIDO" para stories.
- ✅ **Productos que no se mueven**: sección plegable arriba de la lista de Productos, solo para quien ve costos.
- ✅ Categorías fijas de Lote en dos niveles (rubro > categoría, ej. Belleza > Brochas y esponjas): el producto elige una de la lista, nadie la inventa. Lotito y el importador de CSV la deducen del texto.
- ❌ **Etiquetas propias** de la tienda ("Favoritos del mes"): solo para su vitrina, sin tocar Explorar.

### Vender y cobrar
- ✅ Apartar, vender y liberar. **Bloqueo de doble promesa**: si algo ya está apartado, la app dice para quién. Pedidos con varios productos.
- ✅ Estados: pendiente → pagado → preparando → enviado → entregado (o cancelado). Los apartados vencen solos.
- ✅ Pagos completos o abonos, contra entrega, fiado ("quién me debe") y saldo por cobrar.
- ✅ Datos de pago de la tienda (transferencia, efectivo, contra entrega) y mensaje de cobro listo para mandar. Los métodos son **efectivo** y **cuenta digital** (en la base, `transferencia`); la billetera móvil se quitó.
- ✅ Comprobante con IA: subís la captura de la transferencia, Lotito lee el monto y vos confirmás.
- ✅ Respuesta sugerida para "¿sigue disponible?".
- ✅ Pedidos como tabla (o lista apilada en celular), con un botón para avanzar cada uno.
- ✅ **Filtros** en la lista de pedidos: canal (Instagram, WhatsApp, en persona, tienda en línea), fecha (hoy, esta semana, este mes, el mes pasado, en días de El Salvador) y cobro (los que deben o contra entrega). Van en la URL, se combinan con la búsqueda y las pestañas de estado, y las pestañas cuentan con los filtros puestos; las cifras del resumen siguen contando todo (`features/orders/filtros.ts`).
- ✅ Resumen arriba de la lista: por cobrar (en cuántos pedidos; lleva a Clientes con saldo), esperando pago (aviso si hay apartados por vencer), por enviar (desglosado en pagados, preparando y contra entrega) y en camino (aviso si hay enviados de hace más de 7 días sin entregar). Cuenta igual que el menú e Inicio (`features/orders/porAtender.ts`). En celular, los avisos (apartados por vencer, enviados de hace días) también salen en el resumen compacto. Debajo, dos paneles: **Para atender**, los pedidos concretos que piden algo hoy con cliente, motivo y total (apartados que vencen en menos de un día, lo que espera envío del más viejo al más nuevo y lo enviado hace más de 7 días; `pedidosUrgentes` en `porAtender.ts`), y **Este mes**: cuánto se vendió y en cuántos pedidos contra el mes pasado a la misma altura, y de qué canal vienen (Instagram, WhatsApp, en persona, tienda en línea); al pie, el ticket promedio con 2 ventas o más y cuántos apartados se pagaron si ya se cerró alguno (`features/orders/delMes.ts`). En celular, "Este mes" va plegado.
- ✅ **Ofertas con fechas**: desde la ficha del producto (o de todas sus variantes) se programa una rebaja en dólares o porcentaje con día de inicio y de fin. Empieza y termina sola, y en la vitrina, el carrito, el Marketplace ("Ofertas"), el Mostrador y el pedido del panel se cobra el precio rebajado. Se puede cancelar. (Necesita `ofertas.sql`.)
- ✅ **Promociones** (Productos → Promociones): **packs** (varios productos a un precio fijo) y **"llevá y pagá"** (2x1, 3x2, sobre un producto o sus variantes), con fechas opcionales y se pueden apagar. Se aplican solas en el pedido del panel, el Mostrador y la vitrina (compra, carrito y apartado); la ficha del producto y el carrito las anuncian. La pantalla muestra lo que está corriendo (packs, llevá y pagá y ofertas, cada uno con su sello, interruptor para apagarlo o botón para cancelarlo); para crear se va a **Nueva promoción** (`/productos/promociones/nueva`, acepta `?tipo=pack|llevas_pagas|oferta`), que pide el tipo y arma cada uno con su vista previa. En pantallas angostas el botón de crear queda pegado abajo con lo que falta o el precio. (Necesita `promociones.sql`.)
- ✅ **Descuento** en el pedido del panel, en dólares o en porcentaje; se ve en el resumen y en el detalle del pedido. (Necesita `descuento_pedido.sql`.)

### Envíos
- ✅ Dirección del pedido, tarifa por departamento, quién paga el envío (cliente, tienda o a medias) y zonas donde entrega.
- ✅ Guía manual de la paquetera y mensaje de envío con el enlace de seguimiento.
- ✅ Paso «Listo para que la paquetera lo recoja», entre empacado y en camino (es una marca en el envío, no un estado nuevo).
- ✅ Lo que se le paga a la paquetera sale del efectivo o de la cuenta digital, una vez por pedido.
- ✅ Seguimiento público para el cliente en `/p/<pedido>`, con Lotito ilustrado en cada paso (también los del retiro en tienda).
- ❌ Paquetera integrada (cotizar, crear guía y etiqueta desde la app).

### Dinero: Gestión y Movimientos
Detalle de diseño y reglas en [GESTION.md](GESTION.md). La sección "Dinero" (`/dinero`) y "Ganancia" (`/ganancia`) ya no existen: redirigen acá.
- ✅ **Balance** (`/balance/detalle`, una sola pantalla; `/balance` y `/balance/resumen` redirigen): arriba la ganancia del periodo (vendiste − costo − descuentos − envío − gastos, con comparación y selector de periodo) y abajo lo que tenés (efectivo, cuenta digital, por cobrar, inventario a costo) − lo que debés = lo que es tuyo, con un «¿Cómo leo esto?» escrito con los números reales.
- ✅ **Saldos que se actualizan solos**: saldo inicial + lo que entra − lo que sale, con ajuste a mano. Un préstamo recibido o el abono a una deuda no son ingreso ni gasto.
- 🧪 **Varias cuentas** (Balance → Dinero): cada negocio arma sus cuentas (caja, bancos, billeteras), cada una de tipo efectivo o banco/billetera, con su saldo inicial, ajuste, nombre editable y una principal por tipo (ahí cae lo que se guarda sin elegir cuenta). **Mover dinero** entre cuentas no es ingreso ni gasto. La cuenta se elige al abonar una deuda, al anotar un préstamo recibido, al registrar un gasto y al pagarle a la paquetera. (Necesita `cuentas.sql`; detalle en [GESTION.md](GESTION.md#varias-cuentas-4-nov).)
- 🧪 **Tarjetas de crédito** (Balance → Detalle): cada tarjeta con día de corte y de pago. Pagar un gasto o la mercadería con una tarjeta sube lo que debés en ella (no baja ninguna cuenta); pagarla baja la cuenta elegida y la deuda. Lo que se debe en tarjetas suma a «Lo que debés» del balance. Sin cupo ni intereses. (Necesita `tarjetas.sql`; detalle en [GESTION.md](GESTION.md#tarjetas-de-crédito-4-nov).)
- ✅ **Deudas** (deuda, préstamo, crédito) con abonos y cuota opcional (monto, cuántas cuotas, día del mes), editable sin perder los abonos.
- ✅ **«¿De dónde salió el dinero?»** al crear, reponer o cargar un lote: la compra de mercadería baja el saldo de ese lugar (opcional).
- ✅ **Movimientos** (`/movimientos`): el libro de ingresos, gastos y costos (cada venta muestra sus productos con foto, variante y cantidad, si fue venta completa o abono, y su ganancia), con filtros de periodo, tipo, método, cuenta y búsqueda (cada fila dice su cuenta; lo movido entre cuentas sale aparte, sin sumar) que mandan sobre los totales, el gráfico y la lista.
- ✅ Gastos (empaque, publicidad, transporte, local, comisiones, otros) por chat o formulario, ligados o no a un pedido, con el método con que se pagaron.
- ✅ **Gastos fijos** (Movimientos → Registrar gasto → «Cada mes»): se anotan una vez y se registran solos cada mes (al abrir Inicio, Gestión o Movimientos, y en la tarea diaria), sin repetir meses.
- ✅ Una venta cuenta cuando el pedido se paga completo.

### Vender (el antiguo Mostrador, `/vender`)
- ✅ Para todas las tiendas: vender, apartar o crear un pedido rápido. Buscar por nombre o código, escanear el código de barras (lector USB/Bluetooth o la cámara en Chrome y Edge), descuento en dólares o porcentaje, cambio y recibo en pantalla. Cada venta queda como pedido entregado y pagado.
- ✅ Un producto con variantes es una sola tarjeta («N opciones», «Desde $X»); al tocarla, la grilla muestra sus variantes con su foto, precio y stock (se pueden agregar varias) y «Todos los productos» vuelve. Si la búsqueda deja una sola variante, aparece directo; escanear su código la agrega sin preguntar.
- ✅ Las tarjetas muestran la oferta (precio de antes tachado y «−N %»), la promoción vigente que la cubre («2x1», «Pack», y con qué otros productos va: «Pack con Taza: $12.00») y resaltan «Queda 1» cuando quedan pocas (el umbral de Ajustes). Al abrir Vender se ponen al día las ofertas que empiezan o terminan hoy.
- ✅ Código de barras por producto, único por tienda; un código desconocido se puede asociar al momento.
- ✅ **Caja** (`/vender/caja`), solo si está prendido «Vendo en persona» en Ajustes → Mi tienda: abrir con el efectivo inicial y cerrar contando; muestra si sobra o falta y guarda el historial. La vendedora vende, pero los montos de la caja solo los ven dueña y administradora.
- ❌ Vender sin conexión, recibo por WhatsApp o impreso, etiquetas con código de barras.

### Clientes
- ✅ Se crean solos al apartar o vender: contacto (teléfono, usuario de red y correo), historial, total comprado y saldo. Los avisos de WhatsApp salen al teléfono.
- ✅ Buscar clientes y ver su ficha.

### Lotito, el asistente
- ✅ Chat dentro del panel (y burbuja flotante en todas las pantallas): "apartá la chaqueta para Ana", "ya pagó", "gasté $5 en bolsas", "¿cuánto gané esta semana?", "¿quién me debe?".
- ✅ **Marcar entregado y cambiar el precio por chat**: «ya se entregó el pedido de Ana» (pasa por los pasos que falten; si era contra entrega, cobra el saldo) y «subile el precio a las fundas a $8» (avisa cuánto deja por unidad, o si queda bajo el costo). Las dos se deshacen. (Necesita `asistente_acciones.sql`.)
- ✅ **Todo se puede deshacer.** Lo delicado se confirma; los montos los calcula el código, nunca la IA.
- ✅ Preguntas frecuentes con respuesta fija (la IA solo elige el tema) y memoria corta para mensajes como "¿y el mes pasado?".
- ✅ Conoce el balance: responde «¿cuánto debo?» y «¿cuánto vale mi negocio?» con cada deuda y su cuota.
- ✅ Habla según el trato que eligió cada persona (Ella, Él o Sin género).
- ✅ Lo que no entiende se guarda (solo el texto) para mejorarlo después.
- ✅ Funciona sin IA para "ayuda" y "deshacer". Usa OpenAI (`gpt-4.1-mini`).
- ❌ Chatear con Lotito desde el celular por WhatsApp (falta el webhook de entrada).

### Tienda, equipo y datos
- ✅ **Mi tienda**: nombre, frase, logo, **banner** (imagen ancha 4:1 que se recorta al subir; sin ella la vitrina muestra una franja del color de marca; necesita `banner_tienda.sql`), color de marca, dirección de la vitrina (`/c/<tu-tienda>`), contacto (WhatsApp, Instagram, Facebook, TikTok), «¿Qué hacés?» (revendo, produzco o ambos), tiempo de entrega y política de cambios, y contexto para Lotito.
- ✅ **Crear negocio** (`/crear-negocio`): un cuaderno de cinco hojas (nombre y trato, de qué es el negocio, qué hacés, cómo vendés y la tienda en línea, revisar). Solo el nombre es obligatorio.
- ✅ La vitrina es opcional: se prende y se apaga. También se decide si se puede comprar, apartar o solo escribir, y si aparecer en el Marketplace.
- ✅ **Equipo y roles**: la dueña invita por enlace de un solo uso (vence en 7 días) y asigna rol; una persona se puede quitar al instante.

| Acción | Dueña | Administradora | Vendedora | Solo lectura |
|---|---|---|---|---|
| Ver productos y precios | sí | sí | sí | sí |
| Registrar ventas, apartados y pagos | sí | sí | sí | no |
| Editar productos y precios | sí | sí | no | no |
| Ver costos, ganancia y gastos | sí | sí | no | no |
| Exportar datos | sí | sí | no | no |
| Equipo, tienda, pagos y envíos | sí | no | no | no |

- ✅ Exportar productos, pedidos, clientes y gastos a CSV.
- ✅ Reseñas: llegan pendientes y la tienda decide cuáles publicar, ocultar o borrar; también puede agregar las suyas.
- ✅ Inicio con números del negocio, "requiere tu atención", primeros pasos y buscador ⌘K.

## Para quien compra (la vitrina, `/c/<tienda>`)

- ✅ Vitrina con banner (o franja del color de la tienda), logo encimado, color y frase de la tienda; buscador, filtro por modelo, orden y botón de WhatsApp.
- ✅ **Look de marketplace festivo**: cinta de frases animada, tarjeta compacta de la tienda, filtros laterales (categorías y rango de precio), tarjetas con un solo sello, sombra dura y confeti al agregar; la ficha pone la compra en una caja con borde. Lo mismo en el Marketplace (hero oscuro, filas de productos).
- ✅ Datos de confianza de la tienda (verificada, desde cuándo vende en Lote, unidades vendidas) y estrellas promedio en las tarjetas.
- ✅ Página del producto: galería, variantes (sin preseleccionar), stock y precio de la elegida, precio anterior tachado, etiquetas (nuevo, últimas unidades), envío estimado, reseñas y "avisame cuando haya" si está agotado.
- ✅ **Comprar ahora** en tres pasos cortos (datos, entrega, pago) o **apartar** sin pagar durante unas horas. No hace falta crear cuenta.
- ✅ **Carrito** por tienda (hasta 10 productos distintos) que se compra como un solo pedido. No hay carrito entre tiendas: cada una es otro vendedor.
- 🚧 **Cuenta de comprador**: como en cualquier marketplace. Con cuenta (Google o enlace al correo) los datos y los pedidos quedan listos y el carrito se sincroniza entre aparatos. Sin cuenta, al pedir se deja **correo y teléfono** (los dos obligatorios) y se crea una cuenta **no verificada** (`comprador`, por correo; `pedido.comprador_id`). Se verifica entrando con Google (o el enlace al correo) con ese mismo correo: `/auth/callback` reclama la cuenta no verificada (`verificado_en`) y junta pedidos y carritos. Sin verificar, los pedidos y el carrito solo se ven en el dispositivo donde se hicieron (cookie httpOnly `lote_comprador`, en la base solo su hash). Falta el código por OTP (necesita Meta). El carrito de cada tienda se guarda en el servidor (`carrito_item`, `SincronizarCarrito`), "Mis pedidos" (`/marketplace/pedidos`) suma los del servidor a los del navegador, y el formulario trae los datos de la cuenta (`datosDeMiCuenta`). Pendiente: qué ve en `/inicio` quien no tiene tienda. (Necesita `compradores.sql`, `carritos.sql`, `comprador_usuario.sql` y `comprador_correo.sql`, en ese orden; código en `compradorDispositivo.ts`.)
- ✅ Confirmación en `/c/<tienda>/pedido/<id>` (la dirección vieja `/apartado/` redirige): la etapa real del pedido, el ticket de la compra, cómo pagar y un botón para escribirle a la tienda por WhatsApp.
- ✅ Seguimiento del pedido y reseña del producto cuando llega entregado.
- ✅ Aceptar que la tienda escriba por WhatsApp es obligatorio para confirmar.

## Marketplace (`/marketplace`)

- ✅ Todos los productos de las tiendas que quieran aparecer, juntos: buscador, **rubros** (Ropa, Comida, Hogar, Tecnología, Mascotas…) y, dentro de cada uno, sus categorías, precio, solo ofertas, envío gratis, «entregan en mi departamento», orden y páginas numeradas.
- ✅ "Destacados" y "Ofertas" arriba, y una vista de tiendas.
- ✅ Cada tienda decide si aparece. Es la antigua "Explorar".

## Administración de Lote (`/admin`)
- ✅ Una sola cuenta de admin elige qué productos salen en "Destacados" del Marketplace.
- ✅ **Encabezado del Marketplace** (`EncabezadoMarketplace`, barra flotante crema con borde y sombra dura, fija al bajar): logo y buscador (`?q=`) con el selector "Categorías" adentro (menú con los rubros a la izquierda y sus categorías a la derecha), y los accesos con solo ícono Mi cuenta, Pedidos, Ayuda y Favoritos, más el botón Carrito (con el total de unidades de todas las tiendas; lleva al carrito de la primera tienda que tenga algo). **Mi cuenta** (`BotonCuenta`): sin sesión abre una ventana para entrar con Google o con el correo y vuelve a la misma página del Marketplace (no a Inicio); con sesión lleva a `/marketplace/cuenta`: perfil editable (nombre, WhatsApp; el correo es el del acceso), dirección de entrega guardada (departamento, municipio, dirección, referencia) que llena sola el envío al comprar, sus 5 pedidos recientes con estado y cerrar sesión (vuelve al Marketplace). (Necesita `comprador_perfil.sql`.) Favoritos aparece apagado ("Pronto") hasta que exista.
- ✅ **Mis pedidos** (`/marketplace/pedidos`, enlace en el encabezado): los pedidos que la persona hizo desde ese navegador, sin cuenta. Se anotan al ver la confirmación (`localStorage`, hasta 30), muestran en qué va cada uno (una consulta al servidor con los ids) y llevan al seguimiento `/p/<pedido>`. Se pueden quitar de la lista. No hay búsqueda por número y teléfono todavía.

## Avisos por WhatsApp
- ✅ Seis avisos: apartado nuevo, apartado por vencer, apartado vencido, pedido enviado, recordatorio de abono y resumen semanal. Solo salen si el cliente aceptó y hay un teléfono.
- ✅ Hay una cola, una tarea programada diaria y un modo consola para la demo.
- ⏳ Salida real por la API de Meta: la cuenta de pruebas funcionó, pero las plantillas están en revisión y no hay verificación del negocio.
- ❌ Webhook de entrada (responder desde WhatsApp).

## Landing, ayuda y marca
- ✅ **Analítica con Mixpanel** (`src/lib/analitica.ts` en el navegador, `analiticaServidor.ts` en el servidor). Solo se activa con `NEXT_PUBLIC_MIXPANEL_TOKEN`. Autocapture, identidad con el id de Supabase (`AnaliticaProvider`) y eventos: `sesion_iniciada`, `sesion_cerrada`, `negocio_creado`, `producto_creado`, `pedido_creado`, `pedido_vitrina_creado`, `lotito_mensaje_enviado`, `cta_clic` (cualquier enlace con `data-cta`; los `BotonLanding` ya lo traen) y `formulario_iniciado` (cualquier `<form data-formulario="nombre">`). Casi toda Server Action de panel manda su evento al tener éxito con `rastrearAccion(evento, props)` (agrega `negocio_id` y `rol`): pedidos y estados, pagos, envíos, Mostrador y caja, gastos, balance (cuentas, deudas, tarjetas), productos (editar, reponer, lote, variante, importar, borrar), promociones, ofertas, reseñas, equipo y ajustes de la tienda. Los nombres están junto a cada llamada; para un evento nuevo, una línea antes del `revalidatePath`.
- ✅ Landing en `/` con SEO completo, y un centro de ayuda en `/ayuda`.
- ✅ **Planes en la landing** (`PlanesPrecios`, papelitos pegados con sus topes y Lotito): Gratis, Emprendedor y Negocio, con lo que incluye cada uno. Con precios de lanzamiento y cambio mensual/anual (Emprendedor $5.99/mes o $59/año, Negocio $12.99/mes o $129/año). Todo es $0 en la beta; los precios **no están confirmados** (ver `docs/PRECIOS.md`). Los topes y el cobro aún no se aplican.
- ✅ Aviso de privacidad y términos de uso (`/terminos`), pie de verdad en todas las rutas públicas (`components/ui/Pie.tsx`: marca, enlaces, legal y correo de contacto), login con Google o correo, y páginas de error con el monito.
- ✅ Una marca propia (colores, formas, monitos y voz) en [BRANDING.md](BRANDING.md), aplicada también al panel.

## Seguridad y calidad
- ✅ Acceso por roles, con las reglas críticas también en la base de datos (RLS y funciones con permisos). Las acciones públicas (apartar, comprar, reseñar) pasan por el servidor con límite de intentos y campo trampa contra robots.
- ✅ Los montos y las reglas de estado viven en funciones puras con pruebas (más de 500 pruebas automáticas).
- ✅ Selector de fecha propio (calendario en español, con teclado), en ofertas, promociones y gastos.
- ✅ Pensada primero para celular: botones de 44 px, una columna y menú inferior flotante.

## Lo que falta

Todo lo que [app.md](app.md) pide y la app todavía no tiene. Entre paréntesis, la sección de app.md. La prioridad es la del documento: **P0** imprescindible, **P1** importante, **P2** si sobra tiempo, **P3** etapa 3 (negocio con local y equipo).

### Del MVP (P1)
- ❌ **Paquetera integrada** (4.6): cotizar, crear la guía y la etiqueta imprimible, rastrear desde la app, y contra entrega con paquetera. Hoy la guía se anota a mano. Depende de conseguir acceso a la API de una paquetera (Boxful u otra).
- ❌ **Lotito por WhatsApp** (5): escribirle desde el celular y que cada persona del equipo tenga el suyo, con permisos por rol. Falta el webhook de entrada.
- ❌ **Onboarding** (15): vincular el WhatsApp al registrarse.
- ❌ **Borrar los datos de un cliente a pedido** (15): privacidad.
- ❌ **Plan de pago** (15): los límites del plan gratis y la mensualidad.
- ❌ **Accesibilidad revisada con herramientas** (6.2): Lighthouse o axe en las pantallas principales y VoiceOver en el flujo crear producto, apartar y pagar. Lo que se arregla leyendo el código sí está hecho.

### Si sobra tiempo (P2)
- ✅ **Descuentos, ofertas y combos** (4.2): descuento en monto o porcentaje, ofertas con fechas, packs y "llevá y pagá". Falta aplicar un cupón o un código de descuento.
- ❌ **Devoluciones y cambios** (4.7): devolver unidades al stock o descartarlas, reembolsar y cambiar por otro producto, con el estado "devuelto" y el ajuste de ventas y ganancia.
- ✅ **Gastos recurrentes** (4.5): los gastos fijos de cada mes se registran solos. Faltan los **gastos de feria o evento**.
- ✅ **Productos dormidos** (4.5): «Productos que no se mueven», en Productos.
- ❌ **Conteo de inventario** (4.12): contar una ubicación a mano o escaneando y ajustar la diferencia con un motivo (merma, error, hallazgo).
- ❌ **Consignación** (4.7): productos con dueño externo y comisión, con lo que se le debe a quien lo dio.
- ❌ **Clientes frecuentes** (4.7): avisar cuando llega algo de la categoría que ese cliente suele comprar.
- ❌ **Más formas de meter productos** (4.1 y 4.8): por audio, desde un post de Instagram y desde una foto de un cuaderno o una nota.
- ❌ **Reportes básicos** (4.14): lo más vendido de la semana por producto, marca y categoría, e interés contra ventas (muchas consultas y pocas ventas).
- ❌ **"Atendiendo a" y actividad por persona** (4.10): quién atiende a cada cliente y qué hizo cada miembro del equipo.

### Etapa 3 (P3)
- ❌ **Mostrador, lo que falta** (4.11): vender sin conexión y sincronizar después, recibo por WhatsApp o impreso, y etiquetas con código de barras. El resto del Mostrador está hecho.
- ❌ **Varias ubicaciones y traslados** (4.12): casa, local, bodega, feria. La base ya guarda la existencia por ubicación, pero no hay pantallas ni traslados.
- ❌ **Compras y proveedores** (4.13): registrar compras, cuentas por pagar, historial de precios de compra y reposición sugerida.
- ❌ **Reportes completos** (4.14): margen por categoría y por marca, y reportes por ubicación y por persona.
- ❌ **API y conexiones** (4.15): API REST con claves por negocio, webhooks y tienda web conectada (`StoreAdapter`).
- ❌ **Facturación electrónica** (4.16): comprobantes válidos ante la autoridad tributaria de El Salvador.
- ❌ **Pagos en línea con tarjeta** (4.17): enlace de pago desde el mensaje de cobro. En la compra de la vitrina la tarjeta aparece como "Próximamente".

### Fuera de alcance, a propósito
- ❌ Leer los mensajes directos de Instagram automáticamente, app nativa, modo oscuro y combinaciones de variantes más allá de modelo × color (4.18).
- ❌ Analítica de uso (12): se hizo una vez y se quitó, porque el proyecto es una tarea.
- ❌ Pegar el chat de un cliente para que Lotito arme los pedidos: existió y se quitó el 30 de octubre.

## Mapa del repo

Cada sección, sus rutas y dónde está su código (en `src/features/` salvo que se diga otra cosa). Las páginas viven en `src/app/` y son delgadas: piden los datos a la feature y arman la pantalla.

| Sección | Rutas | Código |
|---|---|---|
| Inicio | `/inicio` | `home` |
| Productos | `/productos` (`/nuevo`, `/lote`, `/importar`, `/promociones`, `/promociones/nueva`, `/<código>`, `/<código>/editar`) | `products`, `import`, `offers` (ofertas con fechas), `promotions` (packs y llevá y pagá) |
| Pedidos | `/pedidos` (`/nuevo`, `/<código>`) | `orders`, `payments` (cobros y comprobante con IA), `shipping` (envíos y paquetera) |
| Clientes | `/clientes` (`/<id>`) | `customers` |
| Balance | `/balance/detalle` (la ganancia del periodo arriba, el detalle abajo) | `gestion` (balance, saldos, deudas, compras de mercadería, gastos fijos) |
| Movimientos | `/movimientos` | `profit` (ganancia por periodo, gastos, movimientos, productos que no se mueven); la pantalla está en `src/app/(panel)/_pantallas/` |
| Vender y caja | `/vender`, `/vender/caja` | `counter` |
| Lotito | `/asistente` (y la burbuja en todo el panel) | `assistant` (`motor.ts` decide qué hacer; `intenciones/` cada acción), `ai` (OpenAI y los prompts) |
| Ajustes | `/ajustes/tienda` (con secciones; `/ajustes/pagos`, `/envios` y `/vitrina` redirigen ahí), `/ajustes/equipo`, `/resenas`, `/exportar` | `store-settings`, `team`, `reviews`, `export` (`/api/exportar/<tipo>`) |
| Vitrina | `/c/<tienda>`, `/c/<tienda>/<código>` (`/comprar`, `/apartar`), `/c/<tienda>/carrito` (`/comprar`), `/c/<tienda>/pedido/<id>` | `catalog`, `reviews` |
| Seguimiento | `/p/<pedido>` | `tracking` |
| Marketplace | `/marketplace`, `/marketplace/pedidos`, `/marketplace/categoria/<nombre>` (`/calle` y `/mercadito` eran prototipos y redirigen) | `catalog` |
| Admin | `/admin` | `admin` |
| Entrar y empezar | `/login`, `/crear-negocio`, `/invitacion/<token>`, `/auth/callback` | `auth`, `team` |
| Landing y ayuda | `/`, `/ayuda`, `/privacidad`, `/terminos` | `landing`, `ayuda` |
| Avisos por WhatsApp | `/api/cron/avisos` (tarea diaria de Vercel; también registra los gastos fijos) | `whatsapp` |
| Sistema de diseño | `/design-system` | `design-system` |

Lo compartido:

- `src/domain/`: las reglas de dinero, estados, fechas y texto. Funciones puras con pruebas; acá se calculan todos los montos.
- `src/components/ui/` (botones, campos, tarjetas, modales) y `src/components/nav/` (menú, buscador ⌘K con sus destinos en `destinos.ts`).
- `src/lib/`: Supabase (`supabase/`, con los tipos generados en `database.types.ts`), formato de dinero y fechas, enlaces tipados (`ruta.ts`) y los textos de la interfaz (`textos/`, un archivo por tema).
- Base de datos: `supabase/*.sql` (se corren a mano en Supabase) y [esquema_actual.sql](esquema_actual.sql), la versión vigente de cada tabla y función (`pnpm esquema`; solo para leer).
- `scripts/`: datos de prueba (`pnpm semilla`), limpiar fotos sin usar (`pnpm fotos-sueltas`), generar ilustraciones con OpenAI (`pnpm imagenes-*`) y el esquema (`pnpm esquema`).
- Las direcciones viejas (`/explorar`, `/ganancia`, `/dinero`, `/mostrador`, `/gestion`, `/gestion/cuadre`, `/gestion/movimientos`) redirigen desde `next.config.ts`.
