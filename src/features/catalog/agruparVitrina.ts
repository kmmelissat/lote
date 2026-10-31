import { nombreBase } from "@/domain";
import { modeloDe, type OpcionVariante } from "./opciones";
import type { ProductoPublico } from "./repositorio";

export type TarjetaVitrina = {
  /** El código al que lleva la tarjeta: el de la primera variante con unidades libres, o el primero si no hay */
  codigo: number;
  nombre: string;
  categoria: string | null;
  fotos: string[];
  precioMinimo: number;
  precioMaximo: number;
  disponibles: number;
  /** Nada libre pero con algún apartado vigente */
  apartado: boolean;
  /** Cuántas opciones tiene; 1 es un producto normal */
  opciones: number;
  /** Los modelos de celular de sus variantes ("iPhone 16", "iPhone 17 Pro Max"), para filtrar la vitrina */
  modelos: string[];
  /** El precio de antes de la variante más barata, si está en oferta */
  precioAnterior: number | null;
  /** Se creó hace poco (alguna de sus variantes) */
  nuevo: boolean;
  /** Reseñas publicadas; null si todavía no tiene */
  estrellas: { promedio: number; total: number } | null;
  /** Sus variantes, para mostrar las tallas o colores en la tarjeta */
  variantes: OpcionVariante[];
  /** Cómo se llama cada opción de la variante ("Talla", "Color"); vacío si no se guardó */
  nombresOpciones: string[];
};

/** Un producto se marca "Nuevo" durante estos días desde que se creó */
export const DIAS_NUEVO = 14;
const DIA_MS = 86_400_000;

/** Junta en una sola tarjeta las variantes de un mismo grupo; los productos sin grupo van cada uno por su lado. */
export function agruparParaVitrina(
  productos: ProductoPublico[],
  /** Las reseñas por código de producto (ver obtenerEstrellas); sin ellas las tarjetas salen sin estrellas */
  estrellas: ReadonlyMap<number, { promedio: number; total: number }> = new Map(),
  ahora: number = Date.now(),
): TarjetaVitrina[] {
  const tarjetas: TarjetaVitrina[] = [];
  const porGrupo = new Map<string, TarjetaVitrina>();
  const esNuevo = (p: ProductoPublico) => !!p.creadoEn && ahora - p.creadoEn.getTime() < DIAS_NUEVO * DIA_MS;
  const enOferta = (p: ProductoPublico) => (p.precioAnterior !== null && p.precioAnterior > p.precio ? p.precioAnterior : null);

  for (const p of productos) {
    const hay = p.disponibles > 0;
    const modelo = modeloDe(p.variante, p.opciones);
    const existente = p.grupo ? porGrupo.get(p.grupo) : undefined;
    if (!existente) {
      const t: TarjetaVitrina = {
        codigo: p.codigo,
        nombre: nombreBase(p.nombre, p.variante),
        categoria: p.categoria,
        fotos: p.fotos,
        precioMinimo: p.precio,
        precioMaximo: p.precio,
        disponibles: p.disponibles,
        apartado: !hay && p.apartado,
        opciones: 1,
        modelos: [],
        precioAnterior: enOferta(p),
        nuevo: esNuevo(p),
        estrellas: estrellas.get(p.codigo) ?? null,
        variantes: p.variante ? [{ codigo: p.codigo, variante: p.variante, disponibles: p.disponibles }] : [],
        nombresOpciones: p.opciones,
      };
      if (modelo) t.modelos.push(modelo);
      tarjetas.push(t);
      if (p.grupo) porGrupo.set(p.grupo, t);
      continue;
    }
    // La tarjeta lleva a la primera variante que se puede apartar; si ninguna, a la primera.
    if (hay && existente.disponibles === 0) existente.codigo = p.codigo;
    existente.disponibles += p.disponibles;
    existente.apartado = existente.disponibles === 0 && (existente.apartado || p.apartado);
    // La oferta que se muestra es la de la variante más barata: es la que dice "desde"
    if (p.precio < existente.precioMinimo) existente.precioAnterior = enOferta(p);
    existente.precioMinimo = Math.min(existente.precioMinimo, p.precio);
    existente.precioMaximo = Math.max(existente.precioMaximo, p.precio);
    if (!existente.fotos.length) existente.fotos = p.fotos;
    existente.opciones += 1;
    existente.nuevo ||= esNuevo(p);
    existente.estrellas ??= estrellas.get(p.codigo) ?? null;
    if (p.variante) existente.variantes.push({ codigo: p.codigo, variante: p.variante, disponibles: p.disponibles });
    if (modelo && !existente.modelos.some((m) => m.toLowerCase() === modelo.toLowerCase())) existente.modelos.push(modelo);
  }
  return tarjetas;
}
