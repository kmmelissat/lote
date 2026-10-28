export type PasoInicial = {
  clave: "producto" | "pago" | "pedido";
  hecho: boolean;
};

/**
 * Los primeros pasos de un negocio nuevo, en el orden en que conviene hacerlos. Se marcan solos
 * según lo que ya existe: nadie tiene que tildar nada.
 */
export function primerosPasos(estado: {
  tieneProductos: boolean;
  tieneMetodoPago: boolean;
  tienePedidos: boolean;
}): PasoInicial[] {
  return [
    { clave: "producto", hecho: estado.tieneProductos },
    { clave: "pago", hecho: estado.tieneMetodoPago },
    { clave: "pedido", hecho: estado.tienePedidos },
  ];
}

export const faltanPasos = (pasos: PasoInicial[]): boolean => pasos.some((p) => !p.hecho);
