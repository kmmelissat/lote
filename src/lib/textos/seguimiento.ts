export const seguimiento = {
  titulo: "Seguimiento de tu pedido",
  pedido: (n: number) => `Pedido #${n}`,
  estado: "Cómo va tu pedido",
  ahora: "estado actual",
  pasos: {
    pendiente: "Pedido recibido",
    pagado: "Pago confirmado",
    preparando: "Preparando tu pedido",
    enviado: "En camino",
    entregado: "Entregado",
  },
  cancelado: "Este pedido se canceló. Si tenés dudas, escribile al negocio.",
  envio: "Envío",
  paquetera: "Empresa",
  guia: "Número de guía",
  productos: "Tu pedido",
  verVitrina: (negocio: string) => `Ver más de ${negocio}`,
} as const;
