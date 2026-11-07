import { formatearDolares } from "@/lib/formato";
import { ruta } from "@/lib/ruta";
import { textos } from "@/lib/textos";
import type { TarjetaVitrina } from "../agruparVitrina";
import type { PromocionExplorar } from "../explorar";
import type { MarcaDeTienda } from "./TarjetaProducto";
import { TarjetaDeVitrina } from "./TarjetaDeVitrina";
import { storeThemeVars } from "@/lib/temaTienda";

const t = textos.explorar;
const COLORES_LOTE = storeThemeVars(null);

/** Un pack o "llevá y pagá" del Marketplace, con la forma que pide la tarjeta de la vitrina. */
function comoTarjeta(p: PromocionExplorar): TarjetaVitrina {
  return {
    codigo: 0,
    nombre: p.nombre,
    categoria: null,
    fotos: p.fotos,
    precioMinimo: p.precios?.ahora ?? 0,
    precioMaximo: p.precios?.ahora ?? 0,
    disponibles: 1,
    apartado: false,
    opciones: 1,
    modelos: [],
    precioAnterior: p.precios && p.precios.antes > p.precios.ahora ? p.precios.antes : null,
    nuevo: false,
    estrellas: null,
    variantes: [],
    nombresOpciones: [],
  };
}

/** La tarjeta de un pack o "llevá y pagá": la misma del grid, con su badge, qué incluye y cuánto se ahorra. */
export function TarjetaPromocion({ p, marca }: { p: PromocionExplorar; marca: MarcaDeTienda; sinBorde?: boolean }) {
  return (
    <div style={COLORES_LOTE} className="h-full">
      <TarjetaDeVitrina
        slug={p.tiendaSlug}
        p={comoTarjeta(p)}
        umbral={0}
        envio={null}
        puedeComprar={false}
        prioridad={false}
        tienda={{ nombre: p.tiendaNombre, logo: marca.logo }}
        promocion={{
          href: ruta(`/c/${p.tiendaSlug}`),
          badge: p.tipo === "pack" ? t.promo.pack : t.promo.llevasPagas(p.lleva ?? 0, p.paga ?? 0),
          descripcion: p.productos.length ? t.promo.incluye(p.productos.join(", ")) : null,
          ahorro: p.precios && p.precios.antes > p.precios.ahora ? t.promo.ahorras(formatearDolares(p.precios.antes - p.precios.ahora)) : null,
          conPrecio: !!p.precios,
        }}
      />
    </div>
  );
}
