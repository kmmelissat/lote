import { z } from "zod";
import { ayuda } from "@/lib/textos/ayuda";

/** Los temas de las preguntas frecuentes: la IA solo elige uno, la respuesta es el texto fijo. */
export const TEMAS_AYUDA = ayuda.preguntas.map((p) => p.id) as [string, ...string[]];

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
  "pregunta",
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
  consulta: z.enum(["apartados", "por_cobrar", "por_enviar", "producto", "ganancia", "ganancia_producto", "productos_estado"]).nullable(),
  /** Solo para preguntas de ganancia: semana o mes. Null si no lo dijo. */
  periodo: z.enum(["semana", "mes"]).nullable(),
  /** Solo para "productos_estado": cuáles quiere ver */
  estado: z.enum(["disponible", "apartado", "vendido"]).nullable(),
  /** Solo para gasto: en qué se gastó */
  categoria: z.enum(["empaque", "publicidad", "transporte", "local", "comisiones", "otros"]).nullable(),
  /** Solo para gasto: lo que dijo que compró o pagó ("bolsas") */
  nota: z.string().nullable(),
  /** Solo para "pregunta": el tema de ayuda que mejor responde. Null si ninguno calza. */
  tema: z.enum(TEMAS_AYUDA).nullable(),
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
  periodo: null,
  estado: null,
  categoria: null,
  nota: null,
  tema: null,
  alternativa: null,
});

// Lo que la IA saca de una foto de producto y de la línea que la acompaña.
// El precio, el costo y la cantidad solo pueden salir de la línea escrita: de la foto nunca.
export const SalidaFoto = z.object({
  nombre: z.string(),
  descripcion: z.string(),
  categoria: z.string().nullable(),
  /** Marca, solo si se lee en la foto (logo o etiqueta) o la dijo la línea */
  marca: z.string().nullable(),
  /**
   * Versiones del mismo producto que se VEN en la foto (por ejemplo varios colores de una misma funda).
   * Vacío si es un solo producto. Nunca tallas ni modelos que no se vean.
   */
  opciones: z.array(z.object({ nombre: z.string(), valores: z.array(z.string()) })),
  /** Talla o tono, si se ve o se dijo ("M", "rosa") */
  detalle: z.string().nullable(),
  precio: z.number().nullable(),
  costo: z.number().nullable(),
  cantidad: z.number().int().nullable(),
});

export type SalidaFoto = z.infer<typeof SalidaFoto>;

// Lo que la IA lee de la captura de una transferencia. Solo lee: comparar con el pedido lo hace el código.
export const SalidaComprobante = z.object({
  /** false si la imagen no es un comprobante de pago */
  esComprobante: z.boolean(),
  /** Dólares transferidos (no el saldo de la cuenta ni comisiones). Null si no se lee con seguridad */
  monto: z.number().nullable(),
  /** AAAA-MM-DD, si se ve la fecha */
  fecha: z.string().nullable(),
  /** Número de referencia, confirmación o autorización, tal cual aparece */
  referencia: z.string().nullable(),
});

export type SalidaComprobante = z.infer<typeof SalidaComprobante>;

// Lo que la IA propone al leer un chat pegado: una lista de acciones, cada una con la misma forma que
// un mensaje suelto. Solo lee; cada acción se confirma una por una antes de ejecutarse.
export const SalidaChat = z.object({
  acciones: z.array(SalidaEntender).max(5),
});

export type SalidaChat = z.infer<typeof SalidaChat>;
