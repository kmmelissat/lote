import { z } from "zod";

export const INTENCIONES = [
  "crear_producto",
  "reponer",
  "apartar",
  "vender",
  "marcar_pagado",
  "abonar",
  "liberar",
  "enviar",
  "cobrar",
  "consultar",
  "deshacer",
  "ayuda",
  "no_entiendo",
] as const;

// Lo que la IA devuelve: la intención y los datos que dijo la persona, tal cual.
// Plano y con todo anulable a propósito: la IA solo lee, y el código decide qué falta y qué se hace.
export const SalidaEntender = z.object({
  intencion: z.enum(INTENCIONES),
  producto: z.string().nullable(),
  cliente: z.string().nullable(),
  pedido: z.number().int().nullable(),
  cantidad: z.number().int().nullable(),
  precio: z.number().nullable(),
  costo: z.number().nullable(),
  monto: z.number().nullable(),
  metodo: z.enum(["transferencia", "billetera", "efectivo"]).nullable(),
  paquetera: z.string().nullable(),
  guia: z.string().nullable(),
  consulta: z.enum(["apartados", "por_cobrar", "por_enviar", "producto"]).nullable(),
});

export type SalidaEntender = z.infer<typeof SalidaEntender>;

export const salidaVacia = (intencion: SalidaEntender["intencion"]): SalidaEntender => ({
  intencion,
  producto: null,
  cliente: null,
  pedido: null,
  cantidad: null,
  precio: null,
  costo: null,
  monto: null,
  metodo: null,
  paquetera: null,
  guia: null,
  consulta: null,
});
