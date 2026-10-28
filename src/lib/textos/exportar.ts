export const exportar = {
  titulo: "Exportar datos",
  descripcion: "Descargá lo tuyo en un archivo que abre Excel o Google Sheets.",
  enlace: "Exportar datos",
  enlaceTexto: "Productos, pedidos, clientes y gastos en CSV.",
  volver: "Volver a ajustes",
  ayuda: "Los archivos incluyen costos y saldos. Guardalos en un lugar seguro.",
  temas: {
    productos: { titulo: "Productos", texto: "Con precio, unidades y costo por unidad." },
    pedidos: { titulo: "Pedidos", texto: "Todos los estados, con cliente, productos, total y saldo." },
    clientes: { titulo: "Clientes", texto: "Con contacto, total comprado y lo que deben." },
    gastos: { titulo: "Gastos", texto: "Todos los gastos registrados, por fecha y categoría." },
  },
  columnas: {
    productos: [
      "Código", "Nombre", "Descripción", "Categoría", "Marca", "Condición", "Precio",
      "Cantidad", "Disponibles", "Apartadas", "Vendidas", "Costo por unidad",
    ],
    pedidos: ["Pedido", "Fecha", "Cliente", "Canal", "Estado", "Productos", "Total", "Saldo"],
    clientes: ["Nombre", "Contacto", "Notas", "Pedidos", "Total comprado", "Saldo"],
    gastos: ["Fecha", "Categoría", "Monto", "Nota"],
  },
} as const;
