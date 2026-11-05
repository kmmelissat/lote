export const ayuda = {
  titulo: "Ayuda",
  descripcion: "Respuestas cortas a lo que más se pregunta. Si no está acá, escribile a Lotito.",
  ruta: "/ayuda",
  enlace: "Ayuda",
  enlaceTexto: "Preguntas frecuentes sobre cómo usar Lote.",
  heroEtiqueta: "Lotito te explica",
  heroTitulo: "¿En qué te ayudo?",
  hablarConLotito: "Preguntale a Lotito",
  atajosTitulo: "Lo más buscado",
  grupos: [
    { id: "productos", titulo: "Tus productos", temas: ["producto_nuevo", "importar", "variantes", "categorias", "lotito_foto"] },
    { id: "ventas", titulo: "Cobrar y enviar", temas: ["apartado_vitrina", "cobrar", "pagar_pedido", "datos_de_pago", "envios_config", "seguimiento"] },
    { id: "vitrina", titulo: "Tu tienda en línea", temas: ["vitrina", "explorar"] },
    { id: "negocio", titulo: "Tu negocio", temas: ["ganancia", "balance", "saldo_inicial", "deuda", "cuota_deuda", "gastos_fijos", "actividad", "permisos", "equipo", "exportar"] },
    { id: "lotito", titulo: "Hablar con Lotito", temas: ["asistente", "deshacer"] },
  ],
  cierreTitulo: "¿No encontrás lo que buscás?",
  cierreTexto: "Escribile a Lotito como le escribirías a alguien que te ayuda: apartá, cobrá o preguntale cuánto ganaste.",
  cierreAccion: "Hablar con Lotito",
  cierreTituloFuera: "¿Querés que Lotito te ayude en tu negocio?",
  cierreTextoFuera: "Creá tu cuenta con Google o con tu correo. Gratis para empezar, sin tarjeta.",
  empezar: "Empezar gratis",
  /** Preguntas que se muestran como atajos cuando el chat está vacío y la pantalla no tiene las suyas */
  atajos: ["producto_nuevo", "cobrar", "ganancia", "vitrina"],
  preguntas: [
    {
      id: "producto_nuevo",
      enlace: { href: "/productos/nuevo", etiqueta: "Agregar un producto" },
      donde: ["/productos", "/inicio"],
      pregunta: "¿Cómo agrego un producto?",
      respuesta:
        "Tocá el botón + y elegí Nuevo producto. Con el nombre y el precio ya queda; el costo lo podés poner después. Si subís una foto, \"Completar con la foto\" te propone nombre, descripción y categoría para que los corrijas. Si ya tenés una lista en Excel, usá Importar en Productos.",
    },
    {
      id: "importar",
      enlace: { href: "/productos/importar", etiqueta: "Importar productos" },
      donde: ["/productos", "/productos/importar"],
      pregunta: "¿Cómo importo los productos que ya tengo en Excel?",
      respuesta:
        "En Productos tocá Importar. Subí tu Excel o tu CSV, pegá las filas o el enlace de Google Sheets. Además del nombre y el precio podés traer descripción, condición y el resto de la ficha. Si el mismo producto va en varias filas con talla o color, Lote las junta como variantes. Si algo sale mal, hay un botón para deshacer.",
    },
    {
      id: "apartado_vitrina",
      enlace: { href: "/ajustes/tienda", etiqueta: "Ajustes de tu tienda" },
      donde: ["/pedidos"],
      pregunta: "¿Qué pasa cuando alguien aparta desde mi tienda en línea?",
      respuesta:
        "El producto deja de estar disponible al instante y el cliente ve tus datos de pago y el tiempo que tiene para pagar. Si no paga a tiempo, el apartado vence solo y el producto vuelve a estar disponible. El plazo y el límite por persona se cambian en Mi tienda.",
    },
    {
      id: "cobrar",
      enlace: { href: "/pedidos", etiqueta: "Ir a Pedidos" },
      donde: ["/pedidos"],
      pregunta: "¿Cómo le cobro a un cliente?",
      respuesta:
        "Abrí el pedido y tocá Copiar mensaje de cobro: arma el total, tus datos de pago y el plazo, listo para pegar en el chat. Cuando pague, registrá el pago o el abono en el mismo pedido. Los datos de pago se cargan en Mi tienda, en la pestaña Pagos.",
    },
    {
      id: "ganancia",
      enlace: { href: "/balance", etiqueta: "Ver Gestión" },
      donde: ["/balance", "/movimientos"],
      pregunta: "¿Cómo sé cuánto gané?",
      respuesta:
        "En Gestión, en el Resumen, ves cuánto ganaste en el periodo: lo vendido menos lo que costaron los productos y menos tus gastos. Si a algún producto le falta el costo, la ganancia aparece como estimada. Solo la ven quien es titular y quien administra.",
    },
    {
      id: "balance",
      enlace: { href: "/balance/detalle", etiqueta: "Ver el Balance" },
      donde: ["/balance"],
      pregunta: "¿Qué es el Balance y cuánto vale mi negocio?",
      respuesta:
        "El Balance es lo que tenés y lo que debés: suma lo que tenés (el dinero de tus cuentas, lo que te deben y tu mercadería a lo que te costó) y le resta lo que debés. Lo que queda es lo que es tuyo hoy. Las tarjetas de crédito cuentan como lo que debés. Un préstamo sube lo que tenés y también lo que debés, así que no cambia lo que es tuyo. Lo que es tuyo sube cuando vendés con ganancia y baja cuando gastás. Lo ven quien es titular y quien administra.",
    },
    {
      id: "saldo_inicial",
      enlace: { href: "/balance/detalle", etiqueta: "Poner mi saldo" },
      donde: ["/balance"],
      pregunta: "¿Cómo pongo cuánto dinero tengo y cómo armo mis cuentas?",
      respuesta:
        "En Balance, en «Tus cuentas», tocá Poner saldo inicial en cada cuenta y escribí cuánto hay hoy. Con Agregar cuenta sumás las que uses (caja, banco, billetera). El saldo inicial se pone una sola vez: desde ahí sube con lo que cobrás y baja con lo que gastás y pagás. Si un día no calza con lo que hay de verdad, tocá Ajustar saldo, escribí lo que hay y por qué la diferencia: queda anotado como ajuste. Para pasar dinero de una cuenta a otra, por ejemplo de la caja al banco, usá Mover dinero: no cuenta como ingreso ni gasto.",
    },
    {
      id: "deuda",
      enlace: { href: "/balance/detalle", etiqueta: "Anotar una deuda" },
      donde: ["/balance"],
      pregunta: "¿Cómo anoto una deuda, un préstamo o un crédito?",
      respuesta:
        "En Gestión, en Balance, tocá Anotar lo que debés. Elegí si es deuda, préstamo o crédito, a quién se lo debés y cuánto. Si te prestaron dinero y lo recibiste, elegí en qué cuenta entró para que ese saldo suba. Cada vez que pagués, tocá Abonar y elegí de dónde sale el dinero. Pagar una deuda no es un gasto: no baja tu ganancia.",
    },
    {
      id: "cuota_deuda",
      enlace: { href: "/balance/detalle", etiqueta: "Ver mis deudas" },
      donde: ["/balance"],
      pregunta: "¿Cómo guardo la cuota de una deuda que pago cada mes?",
      respuesta:
        "Al anotar la deuda, o con Editar si ya la tenés, completá la cuota: cuánto pagás cada vez, cuántas cuotas son y qué día del mes toca. Lote te muestra cuántas cuotas faltan y cuándo toca pagar, y al abonar ya te pone el monto de la cuota. Podés cambiarla cuando quieras.",
    },
    {
      id: "gastos_fijos",
      enlace: { href: "/movimientos", etiqueta: "Ver mis gastos fijos" },
      donde: ["/movimientos"],
      pregunta: "¿Cómo anoto un gasto que pago todos los meses, como el alquiler?",
      respuesta:
        "En Movimientos, tocá Registrar gasto, elegí «Cada mes» en «¿Cuándo?», y escribí qué es, cuánto cuesta, la categoría y qué día del mes se paga. Desde ahí Lote lo registra solo cada mes, y tu ganancia ya lo descuenta. Cuenta desde hoy: si este mes ya lo pagaste, anotalo aparte como un gasto normal. Si un mes es más corto, se registra el último día. Podés editar el monto, pausarlo o quitarlo; lo que ya se registró se queda.",
    },
    {
      id: "actividad",
      enlace: { href: "/ajustes/tienda", etiqueta: "Ajustes de tu tienda" },
      donde: ["/ajustes", "/productos/nuevo"],
      pregunta: "¿Vendo lo que produzco o lo que compro? ¿Cambia algo?",
      respuesta:
        "Sí. En Ajustes, en Mi tienda, pestaña Ventas, elegí qué hacés: compro y vendo, produzco o las dos cosas. Si producís, el costo de cada producto se arma con Materiales y Mano de obra; si revendés, con lo que te costó, el envío y la importación.",
    },
    {
      id: "asistente",
      donde: [],
      pregunta: "¿Qué le puedo decir al asistente?",
      respuesta:
        "Escribile como a alguien que te ayuda: \"apartá la chaqueta para @ana\", \"vendí 2 llaveros en persona\", \"ya pagó Ana\", \"gasté $5 en bolsas\" o \"¿cuánto gané esta semana?\". Si escribís \"ayuda\" te muestra más ejemplos.",
    },
    {
      id: "deshacer",
      donde: [],
      pregunta: "¿Puedo deshacer algo que registré?",
      respuesta:
        "Sí. Con el asistente escribí \"deshacer\" y se revierte lo último que hizo. Un pedido también se puede cancelar mientras no esté entregado, y las unidades vuelven a estar disponibles.",
    },
    {
      id: "seguimiento",
      enlace: { href: "/pedidos", etiqueta: "Ir a Pedidos" },
      donde: [],
      pregunta: "¿Cómo le mando a un cliente el seguimiento de su pedido?",
      respuesta:
        "En el pedido, en la parte de Envío, guardá cómo se entrega y tocá Copiar mensaje de envío: lleva un enlace donde el cliente ve el estado sin escribirte. El enlace no muestra sus datos ni los precios.",
    },
    {
      id: "permisos",
      enlace: { href: "/ajustes/equipo", etiqueta: "Ver el equipo" },
      donde: [],
      pregunta: "¿Quién puede ver mis costos y mi ganancia?",
      respuesta:
        "Solo quien es titular y quien administra. Quien está en Ventas puede registrar ventas, apartados y pagos, pero no ve costos ni ganancias.",
    },
    {
      id: "exportar",
      enlace: { href: "/ajustes", etiqueta: "Ir a Ajustes" },
      donde: ["/ajustes"],
      pregunta: "¿Puedo llevarme mis datos?",
      respuesta:
        "Sí. En Ajustes, en Exportar datos, descargás tus productos, pedidos, clientes y gastos en un archivo que abre Excel o Google Sheets.",
    },
    {
      id: "variantes",
      enlace: { href: "/productos/nuevo", etiqueta: "Agregar un producto" },
      donde: ["/productos/nuevo"],
      pregunta: "¿Cómo vendo un producto con tallas o colores?",
      respuesta:
        "En Nuevo producto abrí la sección de variantes y escribí las opciones, por ejemplo modelos y colores. Lote arma las combinaciones y cada una lleva su precio, su costo y sus unidades. En la tienda en línea tu cliente elige la que quiere. Si ya las tenés en Excel, importalas: repetí el nombre del producto y cambiá la talla o el color en cada fila.",
    },
    {
      id: "vitrina",
      enlace: { href: "/ajustes/tienda", etiqueta: "Ajustes de tu tienda" },
      donde: ["/inicio", "/productos"],
      pregunta: "¿Cómo comparto mi tienda en línea?",
      respuesta:
        "En el menú, tocá Copiar enlace en Mi tienda en línea y pegalo en tu perfil o en tus chats. Ahí tus clientes ven lo disponible y pueden comprar o apartar sin escribirte primero.",
    },
    {
      id: "explorar",
      enlace: { href: "/ajustes/tienda", etiqueta: "Ajustes de tu tienda" },
      donde: ["/ajustes"],
      pregunta: "¿Mis productos salen en el Marketplace?",
      respuesta:
        "Solo si vos querés. En Mi tienda está el interruptor del Marketplace y empieza apagado. Cuando lo prendés, tus productos aparecen junto a los de otras tiendas.",
    },
    {
      id: "lotito_foto",
      donde: ["/productos/nuevo", "/productos"],
      pregunta: "¿Cómo me ayuda Lotito con las fotos?",
      respuesta:
        "Subí o sacá la foto en Nuevo producto y Lotito la lee: te propone nombre, categoría, marca y descripción. Vos corregís lo que haga falta, y si no te gusta, tocá Deshacer. El precio y el costo siempre los ponés vos.",
    },
    {
      id: "datos_de_pago",
      enlace: { href: "/ajustes/tienda?seccion=pagos", etiqueta: "Datos de pago" },
      donde: ["/ajustes", "/pedidos"],
      pregunta: "¿Dónde pongo mis datos de pago?",
      respuesta:
        "En Ajustes, en Mi tienda, pestaña Pagos. Prendé los métodos con los que cobrás (transferencia, efectivo o contra entrega) y escribí los datos de cada uno. Salen en cada mensaje de cobro. Solo quien es titular puede cambiarlos.",
    },
    {
      id: "envios_config",
      enlace: { href: "/ajustes/tienda?seccion=envios", etiqueta: "Envíos" },
      donde: ["/ajustes", "/pedidos"],
      pregunta: "¿Dónde configuro mis envíos?",
      respuesta:
        "En Ajustes, en Mi tienda, pestaña Envíos. Ahí decís si se puede recoger en la tienda, a qué departamentos entregás y cuánto cobrás por el envío (una tarifa para todos, o distinta en algún departamento). Que Lote gestione tus envíos con una paquetera viene pronto. Solo quien es titular puede cambiarlo.",
    },
    {
      id: "pagar_pedido",
      enlace: { href: "/pedidos", etiqueta: "Ir a Pedidos" },
      donde: ["/pedidos"],
      pregunta: "¿Cómo marco que un cliente ya pagó?",
      respuesta:
        "En Pedidos tocá Marcar pagado en la fila del pedido y elegí cómo pagó. Si pagó solo una parte, abrí el pedido y registrá un abono. También le podés escribir al asistente: \"ya pagó Ana\".",
    },
    {
      id: "equipo",
      enlace: { href: "/ajustes/equipo", etiqueta: "Ir a Equipo" },
      donde: ["/ajustes"],
      pregunta: "¿Cómo invito a alguien a mi equipo?",
      respuesta:
        "En Ajustes, en Equipo, creás un enlace de invitación y elegís el rol. El enlace sirve una sola vez y vence a los 7 días. Desde ahí también cambiás roles o quitás el acceso.",
    },
    {
      id: "categorias",
      donde: ["/productos/nuevo", "/productos"],
      pregunta: "¿Cómo organizo mis productos en categorías?",
      respuesta:
        "Las categorías son una lista fija de Lote, la misma para todas las tiendas: al crear o editar un producto elegís el rubro y después la categoría (por ejemplo, Belleza y Brochas y esponjas). Así tus productos aparecen en el lugar correcto del Marketplace. Si subís una foto, Lotito te propone la categoría.",
    },
  ],
} as const;
