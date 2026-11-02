import Link from "next/link";
import { DEPARTAMENTOS } from "@/lib/departamentos";
import { textos } from "@/lib/textos";
import type { Rubro } from "../rubros";

const t = textos.explorar;

const campo =
  "h-10 w-full rounded-[12px] border-2 border-borde-control bg-white px-3 text-sm focus:border-teal";
const fila =
  "flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium";
const casilla = "size-5 shrink-0 accent-teal";

export type FiltrosPanel = {
  busqueda: string;
  /** El rubro elegido, o vacío */
  categoria: string;
  /** La categoría del catálogo elegida dentro del rubro, o vacío */
  sub: string;
  orden: string;
  min: string;
  max: string;
  departamento: string;
  gratis: boolean;
  oferta: boolean;
};

/**
 * Los filtros del Marketplace: rubro (con cuántos hay en cada uno), precio, entrega y ofertas. Es un formulario
 * de siempre (GET): se marca lo que se quiere y se aplica, sin JavaScript, y queda en la dirección para compartir.
 * El rubro son enlaces, así cada uno conserva el resto de los filtros.
 */
export function PanelFiltros({
  filtros,
  rubros,
  enlaceRubro,
  enlaceCategoria,
  limpiar,
}: {
  filtros: FiltrosPanel;
  rubros: Rubro[];
  enlaceRubro: (id: string) => { href: string; rel?: string; scroll?: false };
  /** Una categoría dentro del rubro elegido ("" = todo el rubro) */
  enlaceCategoria: (nombre: string) => { href: string; rel?: string; scroll?: false };
  /** A dónde lleva "Quitar filtros" (conserva solo la búsqueda y el orden) */
  limpiar: string | null;
}) {
  const f = filtros;
  const total = rubros.reduce((n, r) => n + r.productos, 0);
  const rubro = (activo: boolean) =>
    `flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 text-sm ${activo ? "bg-limon font-bold" : "font-medium hover:bg-white"}`;
  return (
    <div className="flex flex-col gap-5">
      {rubros.length > 0 && (
        <nav aria-label={t.panel.rubro}>
          <h3 className="mb-1 font-logo text-base">{t.panel.rubro}</h3>
          <ul className="-mx-3 flex flex-col">
            <li>
              <Link
                {...enlaceRubro("")}
                aria-current={f.categoria ? undefined : "true"}
                className={rubro(!f.categoria)}
              >
                {t.panel.todosLosRubros}
                <span className="text-xs tabular-nums text-texto-2">
                  {total}
                </span>
              </Link>
            </li>
            {rubros.map((r) => (
              <li key={r.id}>
                <Link
                  {...enlaceRubro(r.id)}
                  aria-current={f.categoria === r.id ? "true" : undefined}
                  className={rubro(f.categoria === r.id)}
                >
                  {r.nombre}
                  <span className="text-xs tabular-nums text-texto-2">
                    {r.productos}
                  </span>
                </Link>
                {/* Las categorías del rubro elegido, un nivel adentro */}
                {f.categoria === r.id && r.categorias.length > 1 && (
                  <ul aria-label={t.panel.categoriasDe(r.nombre)} className="mb-1 ml-3 flex flex-col border-l-2 border-teal-oscuro/20">
                    <li>
                      <Link {...enlaceCategoria("")} aria-current={f.sub ? undefined : "true"} className={rubro(!f.sub)}>
                        {t.panel.todoElRubro}
                        <span className="text-xs tabular-nums text-texto-2">{r.productos}</span>
                      </Link>
                    </li>
                    {r.categorias.map((c) => (
                      <li key={c.categoria}>
                        <Link {...enlaceCategoria(c.categoria)} aria-current={f.sub === c.categoria ? "true" : undefined} className={rubro(f.sub === c.categoria)}>
                          {c.categoria}
                          <span className="text-xs tabular-nums text-texto-2">{c.productos}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}

      <form action="/marketplace" className="flex flex-col gap-5">
        {f.busqueda && <input type="hidden" name="q" value={f.busqueda} />}
        {f.categoria && (
          <input type="hidden" name="categoria" value={f.categoria} />
        )}
        {f.sub && <input type="hidden" name="sub" value={f.sub} />}
        {f.orden !== "recientes" && (
          <input type="hidden" name="orden" value={f.orden} />
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-logo text-base">{t.rangoPrecio}</legend>
          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1 text-xs text-texto-2">
              {t.precioMin}
              <input
                name="min"
                inputMode="decimal"
                pattern="\d*([.,]\d{0,2})?"
                defaultValue={f.min}
                placeholder="$0"
                className={campo}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs text-texto-2">
              {t.precioMax}
              <input
                name="max"
                inputMode="decimal"
                pattern="\d*([.,]\d{0,2})?"
                defaultValue={f.max}
                placeholder="$100"
                className={campo}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 font-logo text-base">
            {t.panel.entrega}
          </legend>
          <label className="flex flex-col gap-1 text-xs text-texto-2">
            {t.panel.departamento}
            <select
              name="depto"
              defaultValue={f.departamento}
              className={campo}
            >
              <option value="">{t.panel.todoElPais}</option>
              {DEPARTAMENTOS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className={fila}>
            <input
              type="checkbox"
              name="gratis"
              value="1"
              defaultChecked={f.gratis}
              className={casilla}
            />
            {t.panel.envioGratis}
          </label>
        </fieldset>

        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 font-logo text-base">
            {t.panel.mostrar}
          </legend>
          <label className={fila}>
            <input
              type="checkbox"
              name="oferta"
              value="1"
              defaultChecked={f.oferta}
              className={casilla}
            />
            {t.panel.soloOferta}
          </label>
        </fieldset>

        <div className="flex items-center justify-between gap-2">
          {limpiar ? (
            <Link
              href={limpiar}
              rel="nofollow"
              scroll={false}
              className="text-sm font-bold text-teal underline"
            >
              {t.limpiar}
            </Link>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className="inline-flex h-11 items-center rounded-full border-2 border-teal-oscuro bg-mango px-6 text-sm font-bold"
          >
            {t.aplicar}
          </button>
        </div>
      </form>
    </div>
  );
}
