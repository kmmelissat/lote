import { nombreBase, nombreVisible, normalizarTexto, type Centavos } from "@/domain";
import { estadoDePromocion } from "@/features/promotions/descripcion";
import type { Promocion } from "@/features/promotions/repositorio";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { MetodoMostrador, ProductoMostrador } from "./repositorio";

export const METODOS: MetodoMostrador[] = [
  "efectivo",
  "transferencia",
];
export const ICONO_METODO = {
  efectivo: "efectivo",
  transferencia: "banco",
} as const;

export type Linea = { productoId: string; cantidad: number };
/** Lo que se guardó: una venta, un apartado o un contra entrega. `problemas` es lo que no salió aunque quedó guardado. */
export type Recibo = {
  codigo: number;
  total: number;
  cambio: number | null;
  clase: "venta" | "apartado" | "contra";
  /** Ya está pagado pero falta entregarlo (retiro o envío) */
  pendienteDeEntrega: boolean;
  problemas: string[];
};

export const normalizar = normalizarTexto;
export const nombreCompleto = (p: ProductoMostrador) => nombreVisible(p.nombre, p.variante);

/** ¿El producto coincide con lo escrito en la búsqueda (ya normalizado)? */
export const coincide = (p: ProductoMostrador, q: string) =>
  normalizar(`${p.nombre} ${p.variante ?? ""} ${p.codigo}`).includes(q);

/** La promoción vigente de un producto: la etiqueta corta ("2x1", "Pack") y con qué otros productos va, si va con otros. */
export type PromocionMostrador = { etiqueta: string; detalle: string | null };

const enLista = (nombres: string[]) => new Intl.ListFormat("es", { type: "conjunction" }).format(nombres);

/** La promoción vigente de cada producto, por código. Si lo cubren varias, la primera. */
export function promocionesPorCodigo(promociones: readonly Promocion[], hoy: string): Map<number, PromocionMostrador> {
  const t = textos.mostrador;
  const tp = textos.promociones;
  const porCodigo = new Map<number, PromocionMostrador>();
  for (const pr of promociones) {
    if (estadoDePromocion(pr, hoy) !== "vigente") continue;
    for (const p of pr.productos) {
      if (porCodigo.has(p.codigo)) continue;
      if (pr.tipo === "llevas_pagas") {
        // Se mezcla cualquier variante: las del mismo producto no se nombran, solo los otros productos
        const propia = nombreBase(p.nombre, p.variante);
        const otros = [...new Set(pr.productos.map((o) => nombreBase(o.nombre, o.variante)))].filter((b) => b !== propia);
        porCodigo.set(p.codigo, {
          etiqueta: t.promoLlevasPagas(pr.lleva ?? 0, pr.paga ?? 0),
          detalle: otros.length ? t.promoSeCombina(enLista(otros)) : null,
        });
        continue;
      }
      // En un pack cada producto es fijo, variante incluida: se nombra exacto lo que hay que juntar
      const precio = formatearDolares(pr.precioPack ?? 0);
      const otros = pr.productos
        .filter((o) => o.codigo !== p.codigo)
        .map((o) => tp.cantidadDe(o.cantidad, nombreVisible(o.nombre, o.variante)));
      const conQue = p.cantidad > 1 ? [t.promoDeEste(p.cantidad), ...otros] : otros;
      porCodigo.set(p.codigo, {
        etiqueta: t.promoPack,
        detalle: otros.length ? t.promoPackCon(enLista(conQue), precio) : t.promoPackSolo(p.cantidad, precio),
      });
    }
  }
  return porCodigo;
}

/** Una tarjeta de la grilla: un producto suelto, o un producto con las variantes que quedaron después de buscar. */
export type TarjetaMostrador = {
  clave: string;
  /** Con una sola variante, el nombre completo; con varias, sin la variante */
  nombre: string;
  foto: string | undefined;
  miembros: ProductoMostrador[];
  precioMin: Centavos;
  precioMax: Centavos;
  /** El precio de antes de la más barata, si está en oferta */
  precioAnterior: Centavos | null;
  /** El mayor porcentaje de rebaja entre sus variantes; 0 si ninguna está en oferta */
  descuento: number;
  promocion: PromocionMostrador | null;
  disponibles: number;
};

/** Cuánto por ciento se rebajó un precio, redondeado; 0 si no hay precio de antes. */
export const porcentajeDeRebaja = (p: Pick<ProductoMostrador, "precio" | "precioAnterior">) =>
  p.precioAnterior ? Math.round((1 - p.precio / p.precioAnterior) * 100) : 0;

/** Junta las variantes de cada producto en una tarjeta, en el orden en que aparece la primera de cada grupo. */
export function agruparEnTarjetas(productos: readonly ProductoMostrador[]): TarjetaMostrador[] {
  const grupos = new Map<string, ProductoMostrador[]>();
  for (const p of productos) {
    const clave = p.grupo ?? p.id;
    grupos.set(clave, [...(grupos.get(clave) ?? []), p]);
  }
  return [...grupos].map(([clave, todos]) => {
    const miembros = [...todos].sort((a, b) => a.codigo - b.codigo);
    const precios = miembros.map((m) => m.precio);
    const masBarata = miembros.reduce((a, b) => (b.precio < a.precio ? b : a));
    return {
      clave,
      nombre:
        miembros.length === 1
          ? nombreCompleto(miembros[0])
          : nombreBase(miembros[0].nombre, miembros[0].variante),
      foto: miembros.find((m) => m.foto)?.foto,
      miembros,
      precioMin: Math.min(...precios),
      precioMax: Math.max(...precios),
      precioAnterior: masBarata.precioAnterior,
      descuento: Math.max(...miembros.map(porcentajeDeRebaja)),
      promocion: promocionDelGrupo(miembros),
      disponibles: miembros.reduce((s, m) => s + m.disponibles, 0),
    };
  });
}

/**
 * La promoción que se anuncia en la tarjeta de un producto con variantes. Si las cubre a todas por igual, la de cualquiera;
 * si solo cubre algunas, se dice cuáles, para no prometer la promo en las que no entran.
 */
function promocionDelGrupo(miembros: ProductoMostrador[]): PromocionMostrador | null {
  const conPromo = miembros.filter((m) => m.promocion);
  const primera = conPromo[0]?.promocion;
  if (!primera) return null;
  const todasIguales = conPromo.length === miembros.length && conPromo.every((m) => m.promocion?.detalle === primera.detalle);
  if (todasIguales) return primera;
  const t = textos.mostrador;
  if (conPromo.length === miembros.length) return { etiqueta: primera.etiqueta, detalle: t.promoCadaUna };
  const etiquetaDe = (m: ProductoMostrador) => m.variante ?? nombreCompleto(m);
  if (conPromo.length === 1)
    return { etiqueta: primera.etiqueta, detalle: t.promoSoloEn(etiquetaDe(conPromo[0]), primera.detalle ?? primera.etiqueta) };
  return { etiqueta: primera.etiqueta, detalle: t.promoEnVariantes(enLista(conPromo.map(etiquetaDe))) };
}
