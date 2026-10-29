import { z } from "zod";
import { esUuid } from "@/lib/uuid";

// Lo que llega de los formularios de reseñas: se revisa una sola vez, antes de tocar la base.

const MAXIMO_TEXTO = 500;
const MAXIMO_NOMBRE = 60;

const estrellas = z.coerce.number().int().min(1).max(5);
const comentario = z.string().trim().max(MAXIMO_TEXTO);

const esquemaDeCliente = z.object({ estrellas, texto: comentario.default("") });

const esquemaManual = z.object({
  nombre: z.string().trim().min(1).max(MAXIMO_NOMBRE),
  estrellas,
  texto: comentario.default(""),
  // Vacío = una reseña de la tienda en general, no de un producto
  producto: z
    .string()
    .trim()
    .transform((s) => (s ? Number(s) : null))
    .pipe(z.number().int().nullable()),
});

const campos = (formData: FormData, nombres: string[]) =>
  Object.fromEntries(nombres.map((n) => [n, String(formData.get(n) ?? "")]));

/** La reseña que deja quien compró: estrellas de 1 a 5 y un texto de hasta 500 letras. null si algo no cuadra. */
export function leerResenaDeCliente(formData: FormData, pedido: string, codigo: number) {
  if (!esUuid(pedido) || !Number.isInteger(codigo)) return null;
  const r = esquemaDeCliente.safeParse(campos(formData, ["estrellas", "texto"]));
  return r.success ? { pedido, codigo, ...r.data } : null;
}

/** La reseña que la tienda agrega a mano. null si algo no cuadra. */
export function leerResenaManual(formData: FormData) {
  const r = esquemaManual.safeParse(campos(formData, ["nombre", "estrellas", "texto", "producto"]));
  return r.success ? { codigo: r.data.producto, nombre: r.data.nombre, estrellas: r.data.estrellas, texto: r.data.texto } : null;
}
