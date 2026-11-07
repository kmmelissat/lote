import { storeThemeVars } from "@/lib/temaTienda";
import type { TarjetaVitrina } from "../agruparVitrina";
import type { ProductoExplorar } from "../explorar";
import { TarjetaDeVitrina } from "./TarjetaDeVitrina";

export type MarcaDeTienda = { color: string; logo: string | null };

// Con cuántas unidades se avisa "Quedan N" (la tienda lo configura; en el Marketplace es fijo)
const POCAS_UNIDADES = 5;

// Los colores de Lote, no los de cada tienda
const COLORES_LOTE = storeThemeVars(null);

/** Lo que el Marketplace sabe de un producto, con la forma que pide la tarjeta de la vitrina. */
function comoTarjeta(p: ProductoExplorar): TarjetaVitrina {
  return {
    codigo: p.codigo,
    nombre: p.nombre,
    categoria: p.categoria,
    fotos: p.foto ? [p.foto] : [],
    precioMinimo: p.precioMinimo,
    precioMaximo: p.precioMaximo,
    disponibles: p.disponibles,
    apartado: false,
    opciones: p.opciones,
    modelos: [],
    precioAnterior: p.precioAnterior ?? null,
    nuevo: false,
    estrellas: p.estrellas && p.resenas ? { promedio: p.estrellas, total: p.resenas } : null,
    variantes: [],
    nombresOpciones: [],
  };
}

/** La tarjeta de un producto en el Marketplace: la misma de la vitrina de la tienda, con una línea más que dice de qué tienda es. */
export function TarjetaProducto({ p, marca, eager = false }: { p: ProductoExplorar; marca: MarcaDeTienda; eager?: boolean; sinBorde?: boolean }) {
  return (
    <div style={COLORES_LOTE} className="h-full">
      <TarjetaDeVitrina
        slug={p.tiendaSlug}
        p={comoTarjeta(p)}
        umbral={POCAS_UNIDADES}
        envio={null}
        // El Marketplace no sabe si la tienda deja comprar ni las opciones de cada variante
        puedeComprar={false}
        prioridad={eager}
        tienda={{ nombre: p.tiendaNombre, logo: marca.logo }}
      />
    </div>
  );
}
