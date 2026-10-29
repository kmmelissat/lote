import { useEffect, useMemo, useState } from "react";
import { datosDelCarrito } from "./actions/carrito";
import { useCarrito } from "./carrito";
import { combinarCarrito, type LineaConDatos, type ProductoDelCarrito } from "./lineasCarrito";

/** El carrito con los datos de ahora (precio y stock). `estado` dice si todavía carga o si falló. */
export function useCarritoConDatos(slug: string): { lineas: LineaConDatos[]; estado: "cargando" | "listo" | "error" } {
  const guardadas = useCarrito(slug);
  const codigos = guardadas.map((l) => l.codigo);
  const clave = codigos.join(",");
  const [productos, setProductos] = useState<ProductoDelCarrito[] | null>(null);
  const [fallo, setFallo] = useState(false);

  // Se pide al servidor solo cuando cambian los productos; cambiar una cantidad no vuelve a pedir nada.
  useEffect(() => {
    if (!clave) return;
    let vigente = true;
    datosDelCarrito(slug, clave.split(",").map(Number))
      .then((d) => {
        if (!vigente) return;
        setProductos(d);
        setFallo(false);
      })
      .catch(() => vigente && setFallo(true));
    return () => {
      vigente = false;
    };
  }, [slug, clave]);

  const lineas = useMemo(() => combinarCarrito(guardadas, productos ?? []), [guardadas, productos]);
  if (!clave) return { lineas: [], estado: "listo" };
  if (fallo && !productos) return { lineas: [], estado: "error" };
  return { lineas, estado: productos ? "listo" : "cargando" };
}
