export type ClavePaso = "producto" | "tienda" | "pago" | "compartir" | "pedido";

export type PasoInicial = {
  clave: ClavePaso;
  hecho: boolean;
};

/** Adónde lleva cada paso. Compartir se hace desde la tarjeta de Inicio, con sus botones. */
export const ENLACES_PASOS: Record<ClavePaso, string> = {
  producto: "/productos/nuevo",
  tienda: "/ajustes/tienda",
  pago: "/ajustes/pagos",
  compartir: "/inicio",
  pedido: "/pedidos/nuevo",
};

/** Las cookies donde el navegador recuerda lo que no queda guardado en la base. */
export const COOKIE_COMPARTIO = "lote-compartio";
export const COOKIE_PASOS_VISTOS = "lote-pasos-vistos";

/**
 * Los primeros pasos de un negocio nuevo, en el orden en que conviene hacerlos. Se marcan solos
 * según lo que ya existe: nadie tiene que tildar nada. Sin vitrina, los pasos de la tienda y de
 * compartirla no aplican.
 */
export function primerosPasos(estado: {
  tieneProductos: boolean;
  tieneLogo: boolean;
  tieneMetodoPago: boolean;
  compartio: boolean;
  tienePedidos: boolean;
  vitrinaActiva: boolean;
}): PasoInicial[] {
  const pasos: PasoInicial[] = [
    { clave: "producto", hecho: estado.tieneProductos },
    { clave: "tienda", hecho: estado.tieneLogo },
    { clave: "pago", hecho: estado.tieneMetodoPago },
    { clave: "compartir", hecho: estado.compartio },
    { clave: "pedido", hecho: estado.tienePedidos },
  ];
  return estado.vitrinaActiva ? pasos : pasos.filter((p) => p.clave !== "tienda" && p.clave !== "compartir");
}

export const faltanPasos = (pasos: PasoInicial[]): boolean => pasos.some((p) => !p.hecho);

/**
 * Lo que la cookie dice que ya estaba hecho la última vez (`negocioId:producto,pago`). null si la tarjeta
 * nunca se vio en este navegador (o es de otro negocio): entonces no hay nada que celebrar todavía.
 */
export function pasosVistos(cookie: string | undefined, negocioId: string): ClavePaso[] | null {
  const [id, lista = ""] = (cookie ?? "").split(":");
  if (id !== negocioId) return null;
  return lista ? (lista.split(",") as ClavePaso[]) : [];
}

/**
 * La tarjeta se muestra mientras falte algo y, una sola vez más, cuando se completa todo: para
 * despedirse con el "¡Todo listo!" en vez de desaparecer de golpe.
 */
export function mostrarPasos(pasos: PasoInicial[], vistos: ClavePaso[] | null): boolean {
  return pasos.length > 0 && (faltanPasos(pasos) || pasos.some((p) => !(vistos ?? []).includes(p.clave)));
}
