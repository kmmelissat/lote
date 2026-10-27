import { leerDolares, type Centavos } from "@/domain";

export const CAMPOS = ["nombre", "precio", "cantidad", "costo", "categoria", "marca"] as const;
export type Campo = (typeof CAMPOS)[number];

/** Índice de la columna del archivo que corresponde a cada campo */
export type Mapeo = Partial<Record<Campo, number>>;

export const MAXIMO_FILAS = 500;

const SINONIMOS: Record<Campo, string[]> = {
  nombre: ["nombre", "producto", "articulo", "item", "descripcion", "detalle"],
  precio: ["precio", "precio de venta", "precio venta", "pvp", "venta", "price"],
  cantidad: ["cantidad", "stock", "existencia", "unidades", "inventario", "qty"],
  costo: ["costo", "costo unitario", "precio de compra", "compra", "cost"],
  categoria: ["categoria", "tipo", "linea", "rubro"],
  marca: ["marca", "brand"],
};

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Propone a qué campo corresponde cada columna, por el nombre del encabezado. Nunca repite columna. */
export function proponerMapeo(encabezados: string[]): Mapeo {
  const normales = encabezados.map(normalizar);
  const usadas = new Set<number>();
  const mapeo: Mapeo = {};
  for (const campo of CAMPOS) {
    const sinonimos = SINONIMOS[campo];
    const libre = (h: string, i: number) => !usadas.has(i) && h !== "";
    // Primero coincidencia exacta con un sinónimo; si no, que el encabezado lo contenga.
    let indice = normales.findIndex((h, i) => libre(h, i) && sinonimos.includes(h));
    if (indice === -1) {
      indice = normales.findIndex((h, i) => libre(h, i) && sinonimos.some((s) => h.includes(s)));
    }
    if (indice !== -1) {
      mapeo[campo] = indice;
      usadas.add(indice);
    }
  }
  return mapeo;
}

export type FilaImportable = {
  nombre: string;
  precio: Centavos;
  cantidad: number;
  costo: Centavos | null;
  categoria?: string;
  marca?: string;
};

export type ErrorFila = "nombre" | "precio" | "cantidad" | "costo";
export type ResultadoFila =
  | { ok: true; fila: FilaImportable }
  | { ok: false; errores: ErrorFila[] };

/** Valida una fila del archivo según el mapeo. Cantidad vacía = 1; costo vacío = sin costo. */
export function validarFila(celdas: string[], mapeo: Mapeo): ResultadoFila {
  const leer = (campo: Campo) => (mapeo[campo] === undefined ? "" : (celdas[mapeo[campo]!] ?? "").trim());
  const errores: ErrorFila[] = [];

  const nombre = leer("nombre");
  if (!nombre) errores.push("nombre");

  const precio = leerDolares(leer("precio"));
  if (precio === null) errores.push("precio");

  const textoCantidad = leer("cantidad");
  const cantidad = textoCantidad === "" ? 1 : Number(textoCantidad);
  if (!Number.isInteger(cantidad) || cantidad < 1) errores.push("cantidad");

  const textoCosto = leer("costo");
  const costo = textoCosto === "" ? null : leerDolares(textoCosto);
  if (textoCosto !== "" && costo === null) errores.push("costo");

  if (errores.length) return { ok: false, errores };
  return {
    ok: true,
    fila: {
      nombre,
      precio: precio!,
      cantidad,
      costo,
      categoria: leer("categoria") || undefined,
      marca: leer("marca") || undefined,
    },
  };
}
