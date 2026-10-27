// Todos los textos de la interfaz viven acá para revisar el tono en un solo lugar.
export const textos = {
  nombre: "Lote",
  eslogan: "Tu inventario, apartado y cuadrado.",
  descripcion:
    "Saber en todo momento qué tenés, qué está apartado y cuánto ganás con cada producto.",

  nav: {
    inicio: "Inicio",
    productos: "Productos",
    nuevo: "Acción rápida",
    pedidos: "Pedidos",
    ganancia: "Ganancia",
    ajustes: "Ajustes",
  },

  inicio: {
    titulo: "Inicio",
    vacioTitulo: "Todavía no tenés productos",
    vacioTexto: "Mandá la foto de tu primer producto y Lote arma la ficha.",
    vacioAccion: "Agregar producto",
  },
  productos: {
    titulo: "Productos",
    vacioTexto: "Acá van a aparecer tus productos, con su estado y su ganancia.",
  },
  pedidos: {
    titulo: "Pedidos",
    vacioTexto: "Cuando apartés o vendás algo, el pedido aparece acá.",
  },
  ganancia: {
    titulo: "Ganancia",
    vacioTexto: "Registrá una venta y acá vas a ver cuánto te dejó.",
  },
  ajustes: {
    titulo: "Ajustes",
    vacioTexto: "Acá se configura el negocio, los pagos y los envíos.",
  },
  nuevo: {
    titulo: "¿Qué querés hacer?",
    opciones: [
      { id: "producto", etiqueta: "Nuevo producto" },
      { id: "venta", etiqueta: "Registrar venta o apartado" },
      { id: "asistente", etiqueta: "Hablar con el asistente" },
      { id: "chat", etiqueta: "Pegar chat de cliente" },
    ],
  },

  estadosProducto: {
    disponible: "Disponible",
    apartado: "Apartado",
    vendido: "Vendido",
  },
  estadosPedido: {
    pendiente: "Pendiente",
    pagado: "Pagado",
    preparando: "Preparando",
    enviado: "Enviado",
    entregado: "Entregado",
    cancelado: "Cancelado",
  },
} as const;
