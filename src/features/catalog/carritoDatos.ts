import { useEffect, useMemo, useState } from "react";
import { datosDelCarrito } from "./actions/carrito";
import { lineasDe } from "./carritoReglas";
import { useCarrito } from "./carrito";
import { combinarCarrito, type LineaConDatos, type ProductoDelCarrito } from "./lineasCarrito";

/** El carrito con los datos de ahora (precio y stock). `estado` dice si todavía carga o si falló. */
export function useCarritoConDatos(slug: string, inicial?: { texto: string; productos: ProductoDelCarrito[] }): { lineas: LineaConDatos[]; estado: "cargando" | "listo" | "error" } {
  const guardadas = useCarrito(slug, inicial?.texto);
  const codigos = guardadas.map((l) => l.codigo);
  const clave = codigos.join(",");
  const [productos, setProductos] = useState<ProductoDelCarrito[] | null>(inicial?.productos ?? null);
  const [fallo, setFallo] = useState(false);

  // Se pide al servidor solo cuando cambian los productos; cambiar una cantidad no vuelve a pedir nada.
  useEffect(() => {
    if (!clave) return;
    // Lo que el servidor ya trajo para estos mismos productos no se vuelve a pedir
    if (inicial && clave === lineasDe(inicial.texto).map((l) => l.codigo).join(",")) return;
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
  }, [slug, clave, inicial]);

  const lineas = useMemo(() => combinarCarrito(guardadas, productos ?? []), [guardadas, productos]);
  if (!clave) return { lineas: [], estado: "listo" };
  if (fallo && !productos) return { lineas: [], estado: "error" };
  return { lineas, estado: productos ? "listo" : "cargando" };
}
