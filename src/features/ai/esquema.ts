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
  "gasto",
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
  /** Solo para gasto: en qué se gastó */
  categoria: z.enum(["empaque", "publicidad", "transporte", "local", "comisiones", "otros"]).nullable(),
  /** Solo para gasto: lo que dijo que compró o pagó ("bolsas") */
  nota: z.string().nullable(),
  /** Solo si dudó entre dos intenciones: la segunda más probable. El sistema le pregunta a la persona. */
  alternativa: z.enum(INTENCIONES).nullable(),
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
  categoria: null,
  nota: null,
  alternativa: null,
});

// Lo que la IA saca de una foto de producto y de la línea que la acompaña.
// El precio, el costo y la cantidad solo pueden salir de la línea escrita: de la foto nunca.
export const SalidaFoto = z.object({
  nombre: z.string(),
  descripcion: z.string(),
  categoria: z.string().nullable(),
  /** Talla o tono, si se ve o se dijo ("M", "rosa") */
  detalle: z.string().nullable(),
  precio: z.number().nullable(),
  costo: z.number().nullable(),
  cantidad: z.number().int().nullable(),
});

export type SalidaFoto = z.infer<typeof SalidaFoto>;
