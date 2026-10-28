export const ayuda = {
  titulo: "Ayuda",
  descripcion: "Respuestas a lo que más se pregunta.",
  enlace: "Ayuda",
  enlaceTexto: "Preguntas frecuentes sobre cómo usar Lote.",
  volver: "Volver a ajustes",
  preguntas: [
    {
      pregunta: "¿Cómo agrego un producto?",
      respuesta:
        "Tocá el botón + y elegí Nuevo producto. Con el nombre y el precio ya queda; el costo lo podés poner después. Si subís una foto, \"Completar con la foto\" te propone nombre, descripción y categoría para que los corrijas. Si ya tenés una lista en Excel, usá Importar en Productos.",
    },
    {
      pregunta: "¿Qué pasa cuando alguien aparta desde mi vitrina?",
      respuesta:
        "El producto deja de estar disponible al instante y el cliente ve tus datos de pago y el tiempo que tiene para pagar. Si no paga a tiempo, el apartado vence solo y el producto vuelve a estar disponible. El plazo y el límite por persona se cambian en Ajustes, en Vitrina.",
    },
    {
      pregunta: "¿Cómo le cobro a un cliente?",
      respuesta:
        "Abrí el pedido y tocá Copiar mensaje de cobro: arma el total, tus datos de pago y el plazo, listo para pegar en el chat. Cuando pague, registrá el pago o el abono en el mismo pedido. Los datos de pago se cargan en Ajustes.",
    },
    {
      pregunta: "¿Cómo sé cuánto gané?",
      respuesta:
        "En Ganancia ves dos números: la ganancia de tus productos y la ganancia después de gastos. Si a algún producto le falta el costo, la ganancia aparece como estimada. Solo la ven la dueña y la administradora.",
    },
    {
      pregunta: "¿Qué le puedo decir al asistente?",
      respuesta:
        "Escribile como a una ayudante: \"apartá la chaqueta para @ana\", \"vendí 2 llaveros en persona\", \"ya pagó Ana\", \"gasté $5 en bolsas\" o \"¿cuánto gané esta semana?\". Si escribís \"ayuda\" te muestra más ejemplos.",
    },
    {
      pregunta: "¿Puedo deshacer algo que registré?",
      respuesta:
        "Sí. Con el asistente escribí \"deshacer\" y se revierte lo último que hizo. Un pedido también se puede cancelar mientras no esté entregado, y las unidades vuelven a estar disponibles.",
    },
    {
      pregunta: "¿Cómo le mando a un cliente el seguimiento de su pedido?",
      respuesta:
        "En el pedido, en la parte de Envío, guardá cómo se entrega y tocá Copiar mensaje de envío: lleva un enlace donde el cliente ve el estado sin escribirte. El enlace no muestra sus datos ni los precios.",
    },
    {
      pregunta: "¿Quién puede ver mis costos y mi ganancia?",
      respuesta:
        "Solo la dueña y la administradora. Una vendedora puede registrar ventas, apartados y pagos, pero no ve costos ni ganancias.",
    },
    {
      pregunta: "¿Puedo llevarme mis datos?",
      respuesta:
        "Sí. En Ajustes, en Exportar datos, descargás tus productos, pedidos, clientes y gastos en un archivo que abre Excel o Google Sheets.",
    },
  ],
} as const;
