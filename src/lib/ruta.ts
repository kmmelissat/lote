import type { Route } from "next";

/**
 * Una ruta armada con datos (`/productos/${codigo}`) para guardarla donde se espera un `Route`: el genérico la valida
 * contra las páginas que existen (con typedRoutes, un error de tipeo no compila) y recién después se ensancha.
 * A diferencia de `as Route`, que acepta cualquier texto.
 */
export const ruta = <T extends string>(href: Route<T>): Route => href as Route;

/** La ruta con sus parámetros (`?q=…&saldo=1`), o sola si no queda ninguno. La ruta se valida; los parámetros no. */
export function conBusqueda(base: Route, params: URLSearchParams | string): Route {
  const s = params.toString().replace(/^\?/, "");
  return (s ? `${base}?${s}` : base) as Route;
}
