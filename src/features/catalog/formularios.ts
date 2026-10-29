import { z } from "zod";
import { esDepartamento } from "@/lib/departamentos";
import { textos } from "@/lib/textos";
import { MAX_CANTIDAD, MAX_LINEAS } from "./carritoReglas";

// Lo que llega de los formularios públicos no se cree: acá se revisa una sola vez, con un mensaje por campo.
// Apartar, comprar y comprar el carrito comparten los datos de la persona y, las dos últimas, los de entrega.

const t = textos.vitrina.apartar;
const c = textos.vitrina.compra;

const METODOS_DE_PAGO = ["transferencia", "billetera", "efectivo", "contra_entrega"] as const;

const nombre = z.string().trim().min(1, t.errorNombre).max(80, t.errorNombre);
const contacto = z.string().trim().min(3, t.errorContacto).max(80, t.errorContacto);
const acepta = z.literal("on", { error: t.errorAcepta });
const cantidad = z.coerce.number({ error: t.errorCantidad }).int(t.errorCantidad).min(1, t.errorCantidad).max(MAX_CANTIDAD, t.errorCantidad);

const datosDeLaPersona = { nombre, contacto, acepta };

const entrega = {
  // Cualquier cosa que no sea "retiro" cuenta como envío, igual que antes
  entrega: z.enum(["retiro", "envio"]).catch("envio"),
  departamento: z.string().trim().max(40).default(""),
  municipio: z.string().trim().max(60).default(""),
  direccion: z.string().trim().max(200, c.errorEntrega).default(""),
  referencia: z.string().trim().max(200).default(""),
  metodo: z.enum(METODOS_DE_PAGO, { error: c.errorMetodo }),
};

type DatosDeEntrega = { entrega: "retiro" | "envio"; departamento: string; direccion: string };

// Un envío necesita departamento y dirección; recoger no pide nada de eso
function pedirDireccionSiHayEnvio(d: DatosDeEntrega, ctx: z.RefinementCtx) {
  if (d.entrega !== "envio") return;
  if (!esDepartamento(d.departamento)) ctx.addIssue({ code: "custom", path: ["departamento"], message: c.errorEntrega });
  if (!d.direccion) ctx.addIssue({ code: "custom", path: ["direccion"], message: c.errorEntrega });
}

/** Los productos del carrito vienen como JSON del navegador: se revisa cada línea y se vuelve a armar. */
const itemsDelCarrito = z
  .string()
  .transform((crudo) => {
    let lista: unknown;
    try {
      lista = JSON.parse(crudo);
    } catch {
      return [];
    }
    if (!Array.isArray(lista)) return [];
    const items = lista
      .map((i: { codigo?: unknown; cantidad?: unknown }) => ({ codigo: Number(i?.codigo), cantidad: Number(i?.cantidad) }))
      .filter((i) => Number.isInteger(i.codigo) && Number.isInteger(i.cantidad) && i.cantidad >= 1 && i.cantidad <= MAX_CANTIDAD);
    // Sin repetidos y con tope
    return items.filter((i, k) => items.findIndex((o) => o.codigo === i.codigo) === k).slice(0, MAX_LINEAS);
  })
  .refine((items) => items.length > 0, t.errorDatos);

export const apartarSchema = z.object({ ...datosDeLaPersona, cantidad });
export const comprarSchema = z.object({ ...datosDeLaPersona, cantidad, ...entrega }).superRefine(pedirDireccionSiHayEnvio);
export const comprarCarritoSchema = z.object({ ...datosDeLaPersona, items: itemsDelCarrito, ...entrega }).superRefine(pedirDireccionSiHayEnvio);

export type ResultadoFormulario<T> =
  | { ok: true; datos: T }
  | { ok: false; /** Mensaje por campo (el primero de cada uno) */ errores: Record<string, string>; /** El primero de todos, para mostrarlo arriba */ error: string };

/** Valida los datos de un formulario. `entradas` son los campos ya leídos (con el contacto armado). */
export function leerFormulario<S extends z.ZodType>(schema: S, entradas: Record<string, unknown>): ResultadoFormulario<z.output<S>> {
  const r = schema.safeParse(entradas);
  if (r.success) return { ok: true, datos: r.data };
  const errores: Record<string, string> = {};
  for (const problema of r.error.issues) {
    const campo = String(problema.path[0] ?? "formulario");
    errores[campo] ??= problema.message;
  }
  return { ok: false, errores, error: Object.values(errores)[0] ?? t.errorDatos };
}

/** Los campos de texto de un FormData (los archivos no se usan en estos formularios). */
export function camposDe(formData: FormData): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const [clave, valor] of formData.entries()) if (typeof valor === "string") campos[clave] = valor;
  return campos;
}
