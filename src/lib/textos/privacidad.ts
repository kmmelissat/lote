export const privacidad = {
  titulo: "Aviso de privacidad",
  descripcion: "Qué datos guarda Lote, para qué los usa y cómo cuidamos los de tus clientes.",
  actualizado: "Última actualización: 28 de octubre de 2026",
  volver: "Volver",
  secciones: [
    {
      titulo: "Qué es Lote",
      texto:
        "Lote es un producto en beta, en construcción y en pruebas. Sirve para llevar el inventario, los apartados, los cobros y los envíos de un negocio que vende por redes sociales y WhatsApp.",
    },
    {
      titulo: "Qué guardamos de tus clientes",
      texto:
        "Lo mínimo para atender el pedido: nombre, contacto (teléfono o usuario en redes), la dirección cuando hay envío y el historial de sus pedidos. No pedimos nada más.",
    },
    {
      titulo: "Cuándo se les escribe por WhatsApp",
      texto:
        "Solo a quien marcó la casilla al apartar desde la tienda. Sin esa casilla, Lote no le escribe.",
    },
    {
      titulo: "Qué se envía a la inteligencia artificial",
      texto:
        "Cuando usás el asistente o \"Completar con la foto\", se envía a OpenAI el mensaje que escribiste o la foto, junto con una lista de tus productos y de los nombres de los clientes con pedidos abiertos, para que entienda de qué hablás. La inteligencia artificial propone; los números y el dinero los calcula Lote.",
    },
    {
      titulo: "Qué ve quien recibe un enlace de seguimiento",
      texto:
        "El estado del pedido, los productos y, si va por paquetera, la empresa y la guía. Nunca el nombre, el teléfono ni la dirección de nadie, ni los precios.",
    },
    {
      titulo: "Cómo medimos el uso de Lote",
      texto:
        "Usamos Mixpanel para saber qué pantallas y funciones se usan (por ejemplo, cuántos pedidos se crean) y mejorar Lote. Te identificamos con un número interno, no con tu correo, y no mandamos los datos de tus clientes ni el contenido de tus mensajes. Quien compra en una vitrina no queda identificado.",
    },
    {
      titulo: "Exportar o borrar tus datos",
      texto:
        "Podés descargar tus productos, pedidos, clientes y gastos en Ajustes, en Exportar datos. Borrar datos desde la app todavía no se puede: está pendiente. Mientras tanto, tus datos solo los ven las personas de tu negocio.",
    },
    {
      titulo: "Dudas, quejas o errores",
      texto:
        "Si tenés una duda sobre tus datos, encontraste un error o querés contarnos algo, escribí a kmmelissat@gmail.com.",
    },
  ],
} as const;
