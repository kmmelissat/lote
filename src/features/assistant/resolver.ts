import type { RefPedido } from "./intencion";

export type ProductoRef = { id: string; codigo: number; nombre: string };
export type PedidoRef = { id: string; codigo: number; cliente: string | null };

export type Resolucion<T> =
  | { tipo: "uno"; valor: T }
  | { tipo: "varios"; opciones: T[] }
  | { tipo: "ninguno" };

const MAX_OPCIONES = 5;
const PALABRAS_VACIAS = new Set(["el", "la", "los", "las", "de", "del", "un", "una", "unos", "unas", "mi", "mis"]);

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();

const singular = (t: string) => (t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : t);

const palabras = (s: string) =>
  normalizar(s)
    .split(/\s+/)
    .filter((t) => t && !PALABRAS_VACIAS.has(t))
    .map(singular);

// "llaveros" calza con "llavero"; "chaq" no calza con nada hasta tener 3 letras.
const calza = (consulta: string, palabra: string) =>
  consulta === palabra || (consulta.length >= 3 && palabra.startsWith(consulta));

/**
 * Encuentra un producto por código (#12) o por nombre aproximado.
 * Si coinciden varios, devuelve la lista: nunca adivina entre dos.
 */
export function resolverProducto<P extends ProductoRef>(consulta: string, productos: P[]): Resolucion<P> {
  const texto = consulta.trim();
  const codigo = texto.match(/^#?\s*(\d+)$/);
  if (codigo) {
    const p = productos.find((x) => x.codigo === Number(codigo[1]));
    return p ? { tipo: "uno", valor: p } : { tipo: "ninguno" };
  }

  const buscadas = palabras(texto);
  if (!buscadas.length) return { tipo: "ninguno" };

  const exactos = productos.filter((p) => normalizar(p.nombre) === normalizar(texto));
  if (exactos.length === 1) return { tipo: "uno", valor: exactos[0] };

  const conPalabras = productos.map((p) => ({ p, nombre: palabras(p.nombre) }));
  const coincidencias = (nombre: string[]) => buscadas.filter((b) => nombre.some((n) => calza(b, n))).length;

  const completas = conPalabras
    .filter(({ nombre }) => coincidencias(nombre) === buscadas.length)
    .sort((a, b) => a.nombre.length - b.nombre.length);
  if (completas.length === 1) return { tipo: "uno", valor: completas[0].p };
  if (completas.length > 1) return { tipo: "varios", opciones: completas.slice(0, MAX_OPCIONES).map((c) => c.p) };

  const parciales = conPalabras.filter(({ nombre }) => coincidencias(nombre) * 2 >= buscadas.length && coincidencias(nombre) > 0);
  return parciales.length
    ? { tipo: "varios", opciones: parciales.slice(0, MAX_OPCIONES).map((c) => c.p) }
    : { tipo: "ninguno" };
}

/** Encuentra un pedido por su número o por el nombre del cliente. Con varios del mismo cliente, devuelve la lista. */
export function resolverPedido<P extends PedidoRef>(ref: RefPedido, pedidos: P[]): Resolucion<P> {
  if (ref.codigo !== null) {
    const p = pedidos.find((x) => x.codigo === ref.codigo);
    return p ? { tipo: "uno", valor: p } : { tipo: "ninguno" };
  }
  const buscadas = palabras(ref.cliente ?? "");
  if (!buscadas.length) return { tipo: "ninguno" };

  const delCliente = pedidos.filter((p) => {
    const nombre = palabras(p.cliente ?? "");
    return buscadas.every((b) => nombre.some((n) => calza(b, n)));
  });
  if (delCliente.length === 1) return { tipo: "uno", valor: delCliente[0] };
  return delCliente.length
    ? { tipo: "varios", opciones: delCliente.slice(0, MAX_OPCIONES) }
    : { tipo: "ninguno" };
}
