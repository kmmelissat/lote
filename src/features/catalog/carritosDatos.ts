import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { totalAhorro, type AhorroPromocion } from "@/domain";
import { ahorroDelCarrito, cargarCarritos, type CarritoCargado } from "./actions/carrito";
import { guardarBase, leerBase, leerCarrito, reemplazarCarrito, useCarritosGuardados } from "./carrito";
import { unirTresVias, type LineaCarrito } from "./carritoReglas";
import { marcarReconocido, reintentarGuardado } from "./guardadoCarrito";
import { combinarCarrito, lineasComprables, type LineaConDatos } from "./lineasCarrito";

export type CarritoDeTienda = {
  slug: string;
  tienda: { nombre: string; logo: string | null; color: string | null } | null;
  lineas: LineaConDatos[];
  ahorros: AhorroPromocion[];
  ahorro: number;
  estado: "cargando" | "listo" | "error";
};

type Datos = NonNullable<CarritoCargado["datos"]>;
type Estado = { clave: string; datos: Datos } | "error";

const claveDe = (lineas: LineaCarrito[]) => lineas.map((l) => l.codigo).join(",");
const igual = (a: LineaCarrito[], b: LineaCarrito[]) => {
  const orden = (ls: LineaCarrito[]) => JSON.stringify([...ls].sort((x, y) => x.codigo - y.codigo));
  return orden(a) === orden(b);
};

/**
 * Los carritos de TODAS las tiendas con los datos de ahora, traídos del servidor en una sola llamada (`cargarCarritos`) apenas
 * se monta el encabezado, para que el panel ya esté listo al abrirlo. Lo guardado en el servidor se une con el carrito de este
 * navegador (`unirTresVias`: lo que se cambió aquí gana; lo que cambió otro aparato, también lo quitado, llega) y se copia al
 * navegador. Una tienda que falla no afecta a las demás.
 */
export function useTodosLosCarritos(): { carritos: CarritoDeTienda[]; reintentar: (slug: string) => void; cargando: boolean } {
  const guardados = useCarritosGuardados();
  const [datos, setDatos] = useState<Record<string, Estado>>({});
  const [ahorros, setAhorros] = useState<Record<string, AhorroPromocion[]>>({});
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState<Record<string, number>>({});
  const enCurso = useRef(new Set<string>());

  const recibir = useCallback((resultado: CarritoCargado[], pedidos: string[], fusionar: boolean, reconocido: boolean) => {
    if (fusionar) marcarReconocido(reconocido);
    const claves: Record<string, string> = {};
    for (const r of resultado) {
      const locales = leerCarrito(r.slug);
      let lineas = locales;
      if (fusionar && reconocido) {
        lineas = unirTresVias(leerBase(r.slug), locales, r.servidor);
        if (!igual(lineas, locales)) reemplazarCarrito(r.slug, lineas);
        // Si este aparato sabe algo que el servidor no, se le avisa; si ya coinciden, queda anotado
        if (igual(lineas, r.servidor)) guardarBase(r.slug, lineas);
        else reintentarGuardado(r.slug);
      }
      claves[r.slug] = claveDe(lineas);
    }
    setDatos((d) => {
      const siguiente = { ...d };
      for (const slug of pedidos) delete siguiente[slug];
      for (const r of resultado) siguiente[r.slug] = r.datos ? { clave: claves[r.slug], datos: r.datos } : "error";
      return siguiente;
    });
  }, []);

  // Al montar: todo de una vez
  useEffect(() => {
    let vigente = true;
    const locales = guardados.map((g) => ({ slug: g.slug, lineas: g.lineas }));
    cargarCarritos(locales)
      .then((r) => vigente && recibir(r.carritos, locales.map((l) => l.slug), true, r.reconocido))
      .catch(() => vigente && setDatos(Object.fromEntries(locales.map((l) => [l.slug, "error" as const]))))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
    // Solo al montar: después, cada tienda se actualiza sola abajo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Después: una tienda se vuelve a pedir si cambian sus productos (o si se pide reintentar)
  const claveProductos = guardados.map((g) => `${g.slug}:${claveDe(g.lineas)}:${intento[g.slug] ?? 0}`).join("|");
  useEffect(() => {
    if (cargando) return;
    for (const g of guardados) {
      const previo = datos[g.slug];
      if (previo === "error" && !(intento[g.slug] ?? 0)) continue;
      if (previo && previo !== "error" && previo.clave === claveDe(g.lineas)) continue;
      if (previo === "error" && enCurso.current.has(`${g.slug}:${intento[g.slug]}`)) continue;
      enCurso.current.add(`${g.slug}:${intento[g.slug] ?? 0}`);
      cargarCarritos([{ slug: g.slug, lineas: g.lineas }], false)
        .then((r) => recibir(r.carritos.length ? r.carritos : [{ slug: g.slug, servidor: [], datos: null }], [g.slug], false, r.reconocido))
        .catch(() => setDatos((d) => ({ ...d, [g.slug]: "error" })));
    }
    // `datos` no va: se actualiza aquí mismo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargando, claveProductos]);

  // Promociones: se calculan al terminar de cargar y de nuevo al cambiar una cantidad
  const claveCantidades = guardados.map((g) => `${g.slug}:${g.lineas.map((l) => `${l.codigo}x${l.cantidad}`).join(",")}`).join("|");
  useEffect(() => {
    if (cargando) return;
    let vigente = true;
    const espera = setTimeout(() => {
      for (const g of guardados) {
        void ahorroDelCarrito(g.slug, g.lineas)
          .catch(() => [] as AhorroPromocion[])
          .then((a) => vigente && setAhorros((previo) => ({ ...previo, [g.slug]: a })));
      }
    }, 250);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargando, claveCantidades]);

  const reintentar = useCallback((slug: string) => {
    setIntento((i) => ({ ...i, [slug]: (i[slug] ?? 0) + 1 }));
  }, []);

  const carritos = useMemo<CarritoDeTienda[]>(
    () =>
      guardados.map((g) => {
        const d = datos[g.slug];
        if (d === "error") return { slug: g.slug, tienda: null, lineas: [], ahorros: [], ahorro: 0, estado: "error" };
        if (!d) return { slug: g.slug, tienda: null, lineas: [], ahorros: [], ahorro: 0, estado: "cargando" };
        const lineas = combinarCarrito(g.lineas, d.datos.productos);
        const deLaTienda = ahorros[g.slug] ?? [];
        const ahorro = lineasComprables(lineas).length ? totalAhorro(deLaTienda) : 0;
        return { slug: g.slug, tienda: d.datos.tienda, lineas, ahorros: deLaTienda, ahorro, estado: "listo" };
      }),
    [guardados, datos, ahorros],
  );

  return { carritos, reintentar, cargando };
}
