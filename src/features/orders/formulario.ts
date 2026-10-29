import { z } from "zod";
import { normalizarTelefono } from "@/domain";
import { esUuid } from "@/lib/uuid";
import { METODOS_DE_COBRO, type Canal, type MetodoPago } from "./repositorio";

// Lo que llega del formulario de pedido nuevo: acá se normaliza una sola vez. Nada falla en seco, porque la pantalla
// necesita devolver lo escrito junto al error; las reglas de "qué falta" las decide la acción con estos datos.

export const MAXIMO_PRODUCTOS_POR_PEDIDO = 20;

const CANALES: [Canal, ...Canal[]] = ["instagram", "whatsapp", "presencial", "vitrina"];

const texto = z.string().trim().default("");

/** Los productos vienen como JSON del navegador: cada línea se revisa; si algo no cuadra, queda null. */
const items = z
  .string()
  .default("")
  .transform((crudo): { productoId: string; cantidad: number }[] | null => {
    try {
      const lista: unknown = JSON.parse(crudo || "[]");
      if (!Array.isArray(lista) || lista.length < 1 || lista.length > MAXIMO_PRODUCTOS_POR_PEDIDO) return null;
      const revisadas = lista.map((i) => ({ productoId: String(i?.productoId), cantidad: Number(i?.cantidad) }));
      return revisadas.every((i) => esUuid(i.productoId) && Number.isInteger(i.cantidad) && i.cantidad >= 1) ? revisadas : null;
    } catch {
      return null;
    }
  });

const pedidoSchema = z
  .object({
    tipo: z.enum(["venta", "apartado"]).catch("apartado"),
    cliente: texto,
    canal: z.enum(CANALES).catch("presencial"),
    contacto: texto.transform((s) => s.slice(0, 60)),
    acepta: z.string().default(""),
    metodo: z.enum(METODOS_DE_COBRO as [MetodoPago, ...MetodoPago[]]).optional().catch(undefined),
    items,
  })
  // Solo se puede avisar a un teléfono; un @usuario no recibe WhatsApp.
  .transform((d) => ({ ...d, acepta: d.acepta === "on" && normalizarTelefono(d.contacto) !== null }));

export type DatosPedido = z.output<typeof pedidoSchema>;

export function leerPedido(formData: FormData): DatosPedido {
  const campo = (nombre: string) => formData.get(nombre);
  return pedidoSchema.parse({
    tipo: campo("tipo"),
    cliente: campo("cliente") ?? undefined,
    canal: campo("canal"),
    contacto: campo("contacto") ?? undefined,
    acepta: campo("acepta") ?? undefined,
    metodo: campo("metodo") ?? undefined,
    items: campo("items") ?? undefined,
  });
}
