export const mensajeEnvio = {
  paquetera: (cliente: string | null, paquetera: string | null) =>
    `${cliente ? `Hola ${cliente}!` : "Hola!"} Tu pedido ya salió${paquetera ? ` con ${paquetera}` : ""}.`,
  guia: (guia: string) => `Número de guía: ${guia}`,
  propio: (cliente: string | null) =>
    `${cliente ? `Hola ${cliente}!` : "Hola!"} Tu pedido va en camino. Te avisamos cuando lleguemos.`,
  retiro: (cliente: string | null) =>
    `${cliente ? `Hola ${cliente}!` : "Hola!"} Tu pedido ya está listo para que lo retirés.`,
  seguimiento: (enlace: string) => `Podés ver cómo va tu pedido acá: ${enlace}`,
  gracias: "Gracias por tu compra!",
} as const;
