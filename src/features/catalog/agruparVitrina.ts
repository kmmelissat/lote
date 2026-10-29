import { nombreBase } from "@/domain";
import { modeloDe } from "./opciones";
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
};

/** Junta en una sola tarjeta las variantes de un mismo grupo; los productos sin grupo van cada uno por su lado. */
export function agruparParaVitrina(productos: ProductoPublico[]): TarjetaVitrina[] {
  const tarjetas: TarjetaVitrina[] = [];
  const porGrupo = new Map<string, TarjetaVitrina>();

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
    existente.precioMinimo = Math.min(existente.precioMinimo, p.precio);
    existente.precioMaximo = Math.max(existente.precioMaximo, p.precio);
    if (!existente.fotos.length) existente.fotos = p.fotos;
    existente.opciones += 1;
    if (modelo && !existente.modelos.some((m) => m.toLowerCase() === modelo.toLowerCase())) existente.modelos.push(modelo);
  }
  return tarjetas;
}
