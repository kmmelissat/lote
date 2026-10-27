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
    perfil: "Mi perfil y ajustes",
    buscar: "Buscar",
    avisos: "Avisos",
  },

  perfil: {
    nombre: "Tu negocio",
    detalle: "Completá tu perfil",
  },

  inicio: {
    titulo: "Inicio",
    descripcion: "Lo que tenés, lo que está apartado y lo que falta cobrar.",
    vacioTitulo: "Todavía no tenés productos",
    vacioTexto: "Mandá la foto de tu primer producto y Lote arma la ficha.",
    vacioAccion: "Agregar producto",
  },
  productos: {
    titulo: "Productos",
    descripcion: "Tu inventario con su estado, costo y ganancia.",
    vacioTexto: "Acá van a aparecer tus productos, con su estado y su ganancia.",
  },
  pedidos: {
    titulo: "Pedidos",
    descripcion: "Seguí cada pedido desde el apartado hasta la entrega.",
    vacioTexto: "Cuando apartés o vendás algo, el pedido aparece acá.",
  },
  ganancia: {
    titulo: "Ganancia",
    descripcion: "Cuánto vendés y cuánto te queda de verdad.",
    vacioTexto: "Registrá una venta y acá vas a ver cuánto te dejó.",
  },
  ajustes: {
    titulo: "Ajustes",
    descripcion: "Tu negocio, tus pagos y tus envíos.",
    vacioTexto: "Acá se configura el negocio, los pagos y los envíos.",
  },
  nuevo: {
    titulo: "¿Qué querés hacer?",
    descripcion: "Elegí una acción y Lote se encarga del resto.",
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
