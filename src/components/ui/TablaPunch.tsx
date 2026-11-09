import type { ReactNode } from "react";

export type ColumnaTabla<T> = {
  id: string;
  /** Lo que dice el encabezado. Con `etiquetaOculta`, solo lo lee un lector de pantalla (columnas de acciones). */
  encabezado: string;
  celda: (fila: T) => ReactNode;
  alinear?: "izquierda" | "derecha";
  /** Para que no se estire de más: una clase `max-w-*` o `w-*` */
  ancho?: string;
  /** No se pone en una sola línea (por defecto el texto largo se corta con puntos suspensivos si la celda lleva `truncate`) */
  sinCorte?: boolean;
  etiquetaOculta?: boolean;
};

type Props<T> = {
  /** Qué lista es, para lectores de pantalla */
  etiqueta: string;
  columnas: ColumnaTabla<T>[];
  filas: T[];
  clave: (fila: T) => string;
  /**
   * Cómo se ve cada fila cuando no cabe la tabla (celular o columna angosta): una lista apilada. Se decide por el ancho
   * del propio contenedor, no el de la pantalla, porque con el menú lateral abierto cabe menos.
   */
  apilada: (fila: T) => ReactNode;
};

/**
 * La tabla de Punch: tarjeta blanca con borde fino, encabezado gris claro, filas separadas por una línea y hover gris.
 * Cifras a la derecha. Cuando no hay lugar para las columnas se convierte en una lista apilada con `apilada`.
 * Es de servidor: las celdas pueden ser enlaces, chips o botones de cliente.
 */
export function TablaPunch<T>({ etiqueta, columnas, filas, clave, apilada }: Props<T>) {
  return (
    <div className="@container">
      <div className="hidden overflow-hidden rounded-3xl border border-linea bg-superficie shadow-xs @2xl:block">
        <table aria-label={etiqueta} className="w-full text-left text-sm">
          <thead className="border-b border-linea bg-gris-50 text-xs text-texto-2">
            <tr>
              {columnas.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className={`px-4 py-3 font-medium first:pl-5 last:pr-5 ${c.alinear === "derecha" ? "text-right" : ""}`}
                >
                  {c.etiquetaOculta ? <span className="sr-only">{c.encabezado}</span> : c.encabezado}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={clave(f)} className="border-t border-linea transition-colors first:border-t-0 hover:bg-gris-50">
                {columnas.map((c) => (
                  <td
                    key={c.id}
                    className={`px-4 py-3 align-middle first:pl-5 last:pr-5 ${c.alinear === "derecha" ? "text-right tabular-nums" : ""} ${c.ancho ?? ""} ${c.sinCorte ? "whitespace-nowrap" : ""}`}
                  >
                    {c.celda(f)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul aria-label={etiqueta} className="overflow-hidden rounded-3xl border border-linea bg-superficie shadow-xs @2xl:hidden">
        {filas.map((f) => (
          <li key={clave(f)} className="relative border-t border-linea px-4 py-3 transition-colors first:border-t-0 hover:bg-gris-50">
            {apilada(f)}
          </li>
        ))}
      </ul>
    </div>
  );
}
