import { leerDolares, nombreConVariante, SEPARADOR_VARIANTE, type Centavos } from "@/domain";
import { MAX_ESTADO, MAX_NOMBRE_DETALLE, MAX_VALOR_DETALLE, type Detalle } from "@/features/products/infoExtra";
import { MAXIMO_VARIANTES } from "@/features/products/variantes";

export const CAMPOS = [
  "nombre",
  "precio",
  "cantidad",
  "costo",
  "descripcion",
  "condicion",
  "categoria",
  "marca",
  "variante",
  "talla",
  "color",
  "material",
  "estado",
  "precioAnterior",
] as const;
export type Campo = (typeof CAMPOS)[number];

/** Índice de la columna del archivo que corresponde a cada campo */
export type Mapeo = Partial<Record<Campo, number>>;

export const MAXIMO_FILAS = 500;
const MAX_NOMBRE = 120;
const MAX_DESCRIPCION = 2000;

const SINONIMOS: Record<Campo, string[]> = {
  nombre: ["nombre", "producto", "articulo", "item", "title", "name"],
  precio: ["precio", "precio de venta", "precio venta", "precio unitario", "pvp", "venta", "price"],
  cantidad: ["cantidad", "stock", "existencia", "unidades", "inventario", "qty", "quantity"],
  costo: ["costo", "costo unitario", "costo de compra", "precio de compra", "compra", "cost"],
  descripcion: ["descripcion", "desc", "description", "nota", "notas"],
  condicion: ["condicion", "condition", "nuevo o usado"],
  categoria: ["categoria", "tipo", "linea", "rubro", "category"],
  marca: ["marca", "brand"],
  variante: ["variante", "variant", "modelo", "opcion"],
  talla: ["talla", "talle", "size"],
  color: ["color", "tono", "colour"],
  material: ["material", "tela", "fabric"],
  estado: ["como esta", "estado de conservacion", "desgaste"],
  precioAnterior: ["precio anterior", "precio de antes", "precio regular", "precio original", "antes"],
};

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Propone a qué campo corresponde cada columna, por el nombre del encabezado. Nunca repite columna. */
export function proponerMapeo(encabezados: string[]): Mapeo {
  const normales = encabezados.map(normalizar);
  const usadas = new Set<number>();
  const mapeo: Mapeo = {};
  const libre = (h: string, i: number) => !usadas.has(i) && h !== "";
  // Primero todas las coincidencias exactas, para que "precio anterior" no se lo quede "precio".
  for (const campo of CAMPOS) {
    const indice = normales.findIndex((h, i) => libre(h, i) && SINONIMOS[campo].includes(h));
    if (indice !== -1) {
      mapeo[campo] = indice;
      usadas.add(indice);
    }
  }
  for (const campo of CAMPOS) {
    if (mapeo[campo] !== undefined) continue;
    const indice = normales.findIndex((h, i) => libre(h, i) && SINONIMOS[campo].some((s) => h.includes(s)));
    if (indice !== -1) {
      mapeo[campo] = indice;
      usadas.add(indice);
    }
  }
  return mapeo;
}

const NUEVO = ["nuevo", "nueva", "new"];
const USADO = ["usado", "usada", "used", "segunda", "segunda mano", "paca", "2da"];

/** Vacío = nuevo. Si no se entiende, null (error). */
export function leerCondicion(texto: string): "nuevo" | "usado" | null {
  const n = normalizar(texto);
  if (!n) return "nuevo";
  if (NUEVO.includes(n)) return "nuevo";
  if (USADO.includes(n)) return "usado";
  return null;
}

export type FilaImportable = {
  nombre: string;
  precio: Centavos;
  cantidad: number;
  costo: Centavos | null;
  descripcion?: string;
  condicion: "nuevo" | "usado";
  categoria?: string;
  marca?: string;
  talla?: string;
  color?: string;
  varianteColumna?: string;
  /** Etiqueta de variante ("M · Negro"). Null si es un producto suelto. */
  etiqueta: string | null;
  grupo?: string;
  opcionesVariante?: string[];
  detalles: Detalle[];
  estadoDetalle: string | null;
  precioAnterior: Centavos | null;
};

type ErrorFila = "nombre" | "precio" | "cantidad" | "costo" | "condicion" | "precioAnterior" | "variante" | "variantes" | "faltaVariante";
export type ResultadoFila =
  | { ok: true; fila: FilaImportable }
  | { ok: false; errores: ErrorFila[] };

function detalle(nombre: string, valor: string): Detalle | null {
  const v = valor.trim().slice(0, MAX_VALOR_DETALLE);
  return v ? { nombre: nombre.slice(0, MAX_NOMBRE_DETALLE), valor: v } : null;
}

/** Valida una fila del archivo según el mapeo. Cantidad vacía = 1; costo vacío = sin costo; condición vacía = nuevo. */
export function validarFila(celdas: string[], mapeo: Mapeo): ResultadoFila {
  const leer = (campo: Campo) => (mapeo[campo] === undefined ? "" : (celdas[mapeo[campo]!] ?? "").trim());
  const errores: ErrorFila[] = [];

  const nombre = leer("nombre").slice(0, MAX_NOMBRE);
  if (!nombre) errores.push("nombre");

  const precio = leerDolares(leer("precio"));
  if (precio === null) errores.push("precio");

  const textoCantidad = leer("cantidad");
  const cantidad = textoCantidad === "" ? 1 : Number(textoCantidad);
  if (!Number.isInteger(cantidad) || cantidad < 1) errores.push("cantidad");

  const textoCosto = leer("costo");
  const costo = textoCosto === "" ? null : leerDolares(textoCosto);
  if (textoCosto !== "" && costo === null) errores.push("costo");

  const condicion = mapeo.condicion === undefined ? "nuevo" : leerCondicion(leer("condicion"));
  if (condicion === null) errores.push("condicion");

  const textoAnterior = leer("precioAnterior");
  const precioAnterior = textoAnterior === "" ? null : leerDolares(textoAnterior);
  if (textoAnterior !== "" && (precioAnterior === null || (precio !== null && precioAnterior <= precio))) {
    errores.push("precioAnterior");
  }

  if (errores.length) return { ok: false, errores };

  const usado = condicion === "usado";
  const talla = leer("talla") || undefined;
  const color = leer("color") || undefined;
  const varianteColumna = leer("variante") || undefined;
  const detalles = [
    detalle("Talla", talla ?? ""),
    detalle("Color", color ?? ""),
    detalle("Material", leer("material")),
  ].filter((d): d is Detalle => d !== null);

  return {
    ok: true,
    fila: {
      nombre,
      precio: precio!,
      cantidad,
      costo,
      descripcion: leer("descripcion").slice(0, MAX_DESCRIPCION) || undefined,
      condicion: condicion!,
      categoria: leer("categoria") || undefined,
      marca: leer("marca") || undefined,
      talla,
      color,
      varianteColumna,
      etiqueta: null,
      detalles,
      estadoDetalle: usado ? leer("estado").slice(0, MAX_ESTADO) || null : null,
      precioAnterior,
    },
  };
}

const MAX_ETIQUETA = 40;

export function etiquetaDe(fila: FilaImportable): string | null {
  if (fila.varianteColumna) return fila.varianteColumna.slice(0, MAX_ETIQUETA);
  const partes = [fila.talla, fila.color].filter((p): p is string => !!p);
  if (!partes.length) return null;
  return partes.join(SEPARADOR_VARIANTE).slice(0, MAX_ETIQUETA);
}

/**
 * Varias filas con el mismo nombre y talla/color/variante se vuelven un producto con variantes.
 * Una sola fila, aunque tenga talla, sigue siendo un producto suelto (la talla queda en la ficha).
 */
export function resolverVariantes(validadas: ResultadoFila[]): ResultadoFila[] {
  const porNombre = new Map<string, number[]>();
  validadas.forEach((v, i) => {
    if (!v.ok) return;
    const lista = porNombre.get(normalizar(v.fila.nombre)) ?? [];
    lista.push(i);
    porNombre.set(normalizar(v.fila.nombre), lista);
  });

  const out = validadas.map((v) => (v.ok ? { ok: true as const, fila: { ...v.fila } } : v));

  for (const indices of porNombre.values()) {
    const de = (i: number) => (out[i].ok ? out[i].fila : null);
    const conEtiqueta = indices.filter((i) => {
      const fila = de(i);
      return fila && etiquetaDe(fila);
    });
    if (conEtiqueta.length < 2) continue;

    const unicas = new Map<string, number>();
    const duplicadas: number[] = [];
    for (const i of conEtiqueta) {
      const clave = etiquetaDe(de(i)!)!.toLowerCase();
      if (unicas.has(clave)) duplicadas.push(i);
      else unicas.set(clave, i);
    }
    for (const i of duplicadas) out[i] = { ok: false, errores: ["variante"] };
    if (unicas.size < 2) continue;

    const grupo = crypto.randomUUID();
    const indicesGrupo = [...unicas.values()].slice(0, MAXIMO_VARIANTES);
    const opciones = opcionesDe(indicesGrupo.map((i) => de(i)!));
    for (const i of [...unicas.values()].slice(MAXIMO_VARIANTES)) {
      out[i] = { ok: false, errores: ["variantes"] };
    }
    const enGrupo = new Set(indicesGrupo);
    for (const i of indices) {
      const v = out[i];
      if (!v.ok) continue;
      if (!enGrupo.has(i)) {
        out[i] = { ok: false, errores: ["faltaVariante"] };
        continue;
      }
      const desdeColumna = !!v.fila.varianteColumna;
      v.fila.etiqueta = etiquetaDe(v.fila);
      v.fila.grupo = grupo;
      v.fila.opcionesVariante = opciones;
      if (!desdeColumna) {
        v.fila.detalles = v.fila.detalles.filter((d) => d.nombre !== "Talla" && d.nombre !== "Color");
      }
    }
  }
  return out;
}

function opcionesDe(miembros: FilaImportable[]): string[] {
  if (miembros.some((m) => m.varianteColumna)) return ["Variante"];
  return [
    miembros.some((m) => m.talla) ? "Talla" : null,
    miembros.some((m) => m.color) ? "Color" : null,
  ].filter((o): o is string => o !== null);
}

/** Nombre que se guarda: con la etiqueta pegada si es variante. */
export function nombreParaGuardar(fila: FilaImportable): string {
  if (!fila.etiqueta) return fila.nombre;
  const full = nombreConVariante(fila.nombre, fila.etiqueta);
  if (full.length <= MAX_NOMBRE) return full;
  const maxBase = MAX_NOMBRE - SEPARADOR_VARIANTE.length - fila.etiqueta.length;
  return nombreConVariante(fila.nombre.slice(0, Math.max(1, maxBase)), fila.etiqueta);
}
