# Lote: qué hace la app

Lote es la herramienta para emprendedores de El Salvador que venden por redes sociales (Instagram, Facebook, WhatsApp): lleva el inventario, lo apartado, el cobro, el envío y la ganancia real de cada producto, y le da a cada tienda una vitrina con su propio enlace. Es un proyecto del curso Diseño de Productos y Servicios (ciclo 3).

Este documento dice **qué se puede hacer hoy**. La especificación completa (incluido lo que falta) está en [app.md](app.md) y el estado de la construcción en [PROGRESO.md](PROGRESO.md).

Estado de cada función: **✅** hecha · **🧪** hecha, pero falta probarla con datos o personas reales · **⏳** depende de un tercero (Meta) · **❌** no está.

## Para quien vende (el panel)

### Productos
- ✅ Crear con foto: Lotito (la IA) lee la foto y propone nombre, categoría, marca y descripción; vos confirmás. También "foto + una línea" ("chaqueta negra M, 25, me costó 10").
- ✅ Código corto por producto (#12), cantidad, reponer (recalcula el costo promedio), marca, categoría de una lista, estado (nuevo o usado con nota), detalles (Material, Medidas…) y precio de antes (oferta).
- ✅ Costo real por rubro (compra, envío, importación, otros) y ganancia con margen en vivo. El costo se puede poner después.
- ✅ Variantes con cruce (modelo × color, hasta 30 combinaciones), cada una con su stock, precio y costo. Convertir un producto en variantes y agregar variantes después.
- ✅ Lote de fotos: un producto por foto, con el costo total repartido.
- ✅ "Otra igual" (copia precio, costo y categoría), editar, borrar (si no tiene pedidos) y poco stock con umbral propio.
- ✅ Importar desde CSV o desde una hoja pública de Google Sheets (vista previa con errores, ficha y variantes, **deshacer** la importación completa).
- ✅ Texto listo para el post y sticker "VENDIDO" para stories.
- ✅ Categorías: crear, renombrar y borrar desde Ajustes.

### Vender y cobrar
- ✅ Apartar, vender y liberar. **Bloqueo de doble promesa**: si algo ya está apartado, la app dice para quién. Pedidos con varios productos.
- ✅ Estados: pendiente → pagado → preparando → enviado → entregado (o cancelado). Los apartados vencen solos.
- ✅ Pagos completos o abonos, contra entrega, fiado ("quién me debe") y saldo por cobrar.
- ✅ Datos de pago de la tienda (transferencia, billetera, efectivo, contra entrega) y mensaje de cobro listo para mandar.
- ✅ Comprobante con IA: subís la captura de la transferencia, Lotito lee el monto y vos confirmás.
- ✅ Respuesta sugerida para "¿sigue disponible?".
- ✅ Pedidos como tabla (o lista apilada en celular), con un botón para avanzar cada uno.

### Envíos
- ✅ Dirección del pedido, tarifa por departamento, quién paga el envío (cliente, tienda o a medias) y zonas donde entrega.
- ✅ Guía manual de la paquetera y mensaje de envío con el enlace de seguimiento.
- ✅ Seguimiento público para el cliente en `/p/<pedido>`.
- ❌ Paquetera integrada (cotizar, crear guía y etiqueta desde la app).

### Dinero
- ✅ **Ganancia real**: hoy, semana, mes y mes pasado, con comparación, productos sin costo marcados como estimados, "por cobrar" y dinero parado en inventario.
- ✅ Gastos (empaque, publicidad, transporte, local, comisiones, otros) por chat o formulario, ligados o no a un pedido.
- ✅ Resumen semanal estilo "Wrapped" (lo vendido, el mejor producto, lo apartado, la ganancia).
- ✅ Una venta cuenta cuando el pedido se paga completo.
- ❌ Gastos recurrentes, editar un gasto, rango de fechas a medida.

### Mostrador (solo si tenés un local)
- ✅ Se prende con el interruptor "Tengo un local" en Ajustes → Mi tienda. Sin él no aparece nada.
- ✅ Buscar por nombre o código, escanear el código de barras (lector USB/Bluetooth o la cámara en Chrome y Edge), descuento en dólares o porcentaje, cambio y recibo en pantalla. Cada venta queda como pedido entregado y pagado.
- ✅ Código de barras por producto, único por tienda; un código desconocido se puede asociar al momento.
- ✅ Caja: abrir con el efectivo inicial y cerrar contando; muestra si sobra o falta y guarda el historial. La vendedora vende, pero los montos de la caja solo los ven dueña y administradora.
- ❌ Vender sin conexión, recibo por WhatsApp o impreso, etiquetas con código de barras.

### Clientes
- ✅ Se crean solos al apartar o vender: contacto, historial, total comprado y saldo.
- ✅ Buscar clientes y ver su ficha.

### Lotito, el asistente
- ✅ Chat dentro del panel (y burbuja flotante en todas las pantallas): "apartá la chaqueta para Ana", "ya pagó", "gasté $5 en bolsas", "¿cuánto gané esta semana?", "¿quién me debe?".
- ✅ **Todo se puede deshacer.** Lo delicado se confirma; los montos los calcula el código, nunca la IA.
- ✅ Preguntas frecuentes con respuesta fija (la IA solo elige el tema) y memoria corta para mensajes como "¿y el mes pasado?".
- ✅ Funciona sin IA para "ayuda" y "deshacer". Usa OpenAI.
- ❌ Chatear con Lotito desde el celular por WhatsApp (falta el webhook de entrada).

### Tienda, equipo y datos
- ✅ **Mi tienda**: nombre, frase, logo, color de marca, dirección de la vitrina (`/c/<tu-tienda>`), contacto (WhatsApp, Instagram, Facebook), tiempo de entrega y política de cambios, y contexto para Lotito.
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

- ✅ Vitrina con logo, color y frase de la tienda; buscador, filtro por modelo, orden y botón de WhatsApp.
- ✅ Página del producto: galería, variantes (sin preseleccionar), stock y precio de la elegida, precio anterior tachado, etiquetas (nuevo, últimas unidades), envío estimado, reseñas y "avisame cuando haya" si está agotado.
- ✅ **Comprar ahora** en tres pasos cortos (datos, entrega, pago) o **apartar** sin pagar durante unas horas. No hace falta crear cuenta.
- ✅ **Carrito** por tienda (hasta 10 productos distintos) que se compra como un solo pedido. No hay carrito entre tiendas: cada una es otro vendedor.
- ✅ Pantalla de confirmación con el resumen, cómo pagar y lo que sigue.
- ✅ Seguimiento del pedido y reseña del producto cuando llega entregado.
- ✅ Aceptar que la tienda escriba por WhatsApp es obligatorio para confirmar.

## Marketplace (`/marketplace`)

- ✅ Todos los productos de las tiendas que quieran aparecer, juntos: buscador, **rubros** (Ropa, Comida, Hogar, Tecnología, Mascotas…), precio, orden y páginas numeradas.
- ✅ "Destacados" y "Ofertas" arriba, y una vista de tiendas.
- ✅ Cada tienda decide si aparece. Es la antigua "Explorar".

## Administración de Lote (`/admin`)
- ✅ Una sola cuenta de admin elige qué productos salen en "Destacados" del Marketplace.

## Avisos por WhatsApp
- ✅ Seis avisos: apartado nuevo, apartado por vencer, apartado vencido, pedido enviado, recordatorio de abono y resumen semanal. Solo salen si el cliente aceptó y hay un teléfono.
- ✅ Hay una cola, una tarea programada diaria y un modo consola para la demo.
- ⏳ Salida real por la API de Meta: la cuenta de pruebas funcionó, pero las plantillas están en revisión y no hay verificación del negocio.
- ❌ Webhook de entrada (responder desde WhatsApp).

## Landing, ayuda y marca
- ✅ Landing en `/` con SEO completo, y un centro de ayuda en `/ayuda`.
- ✅ Aviso de privacidad, login con Google o correo, y páginas de error con el monito.
- ✅ Una marca propia (colores, formas, monitos y voz) en [BRANDING.md](BRANDING.md), aplicada también al panel.

## Seguridad y calidad
- ✅ Acceso por roles, con las reglas críticas también en la base de datos (RLS y funciones con permisos). Las acciones públicas (apartar, comprar, reseñar) pasan por el servidor con límite de intentos y campo trampa contra robots.
- ✅ Los montos y las reglas de estado viven en funciones puras con pruebas (más de 500 pruebas automáticas).
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
- ❌ **Descuentos y combos en un pedido del panel** (4.2): monto o porcentaje, y 2x1. La base ya guarda el descuento y el Mostrador lo usa, pero el pedido nuevo del panel no lo ofrece.
- ❌ **Devoluciones y cambios** (4.7): devolver unidades al stock o descartarlas, reembolsar y cambiar por otro producto, con el estado "devuelto" y el ajuste de ventas y ganancia.
- ❌ **Gastos recurrentes** (4.5): alquiler, plan de datos, suscripciones. En la base queda la columna `recurrente`, pero nada la usa. Tampoco **gastos de feria o evento**.
- ❌ **Productos dormidos** (4.5): los que llevan más de 30 días sin moverse.
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

## Mapa de pantallas

| Para quién | Rutas |
|---|---|
| Quien vende | `/inicio`, `/productos` (`/nuevo`, `/lote`, `/importar`, `/<código>`), `/pedidos` (`/nuevo`, `/<código>`), `/clientes`, `/ganancia` (`/resumen`), `/asistente`, `/mostrador` (`/caja`), `/ajustes/*` (tienda, pagos, envíos, equipo, categorías, reseñas, exportar, ayuda) |
| Quien compra | `/c/<tienda>`, `/c/<tienda>/<código>` (`/comprar`, `/apartar`), `/c/<tienda>/carrito` (`/comprar`), `/c/<tienda>/apartado/<id>`, `/p/<pedido>` |
| Todas | `/` (landing), `/marketplace`, `/ayuda`, `/privacidad`, `/login`, `/invitacion/<token>` |
| Admin | `/admin` |
