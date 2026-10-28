export const cobro = {
  envio: "Envío",
  saludo: (cliente: string | null, negocio: string) =>
    cliente ? `Hola ${cliente}! Este es tu pedido en ${negocio}:` : `Hola! Este es tu pedido en ${negocio}:`,
  total: "Total",
  yaPagaste: (pagado: string) => `Ya pagaste ${pagado}.`,
  saldo: "Te faltan",
  pagarPor: "Podés pagar por:",
  metodos: {
    transferencia: "Transferencia",
    billetera: "Billetera móvil",
    efectivo: "Efectivo",
    contra_entrega: "Contra entrega",
  },
  plazo: (tiempo: string) => `Tenés ${tiempo} para pagar y asegurar tus piezas.`,
  gracias: "Gracias por tu compra!",
} as const;
