import type { Route } from "next";
import Link from "next/link";
import { DEPARTAMENTOS } from "@/lib/departamentos";
import { textos } from "@/lib/textos";
import type { Rubro } from "../rubros";
import { DialogoFiltros } from "./DialogoFiltros";
import type { Filtros } from "./enlacesExplorar";

const t = textos.explorar;
export const ID_FILTROS = "filtros-explorar";

const titulo = "text-[15px] font-bold";
const campo = "h-10 w-full rounded-[12px] border border-borde-control bg-white px-3 text-sm focus:border-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro";
const foco = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro";
const enlaceFila = (activo: boolean) => `flex min-h-11 items-center justify-between gap-2 rounded text-sm hover:underline lg:min-h-9 ${foco} ${activo ? "font-bold" : "font-medium"}`;

type Enlace = { href: Route; rel?: string; scroll?: false };

/**
 * Los filtros de la vista de categoría y búsqueda: categoría (con cuántos hay), precio, entrega y ofertas. La categoría son enlaces
 * y el resto un formulario de siempre (GET), así que usa los mismos filtros y la misma dirección de siempre.
 */
export function PanelFiltros({
  f,
  rubros,
  enlaceRubro,
  enlaceSub,
}: {
  f: Filtros;
  rubros: Rubro[];
  enlaceRubro: (id: string) => Enlace;
  enlaceSub: (nombre: string) => Enlace;
}) {
  const total = rubros.reduce((n, r) => n + r.productos, 0);
  const conteo = (n: number) => <span className="text-xs tabular-nums text-texto-2">{n}</span>;

  return (
    <aside aria-label={t.barra.filtros}>
      <DialogoFiltros id={ID_FILTROS}>
        <div className="flex flex-col gap-[22px]">
          {rubros.length > 0 && (
            <nav aria-labelledby="filtro-categoria">
              <h2 id="filtro-categoria" className={`${titulo} mb-1`}>
                {t.panel.categoria}
              </h2>
              <ul className="flex flex-col">
                <li>
                  <Link {...enlaceRubro("")} aria-current={f.categoria ? undefined : "true"} className={enlaceFila(!f.categoria)}>
                    {t.panel.todosLosRubros}
                    {conteo(total)}
                  </Link>
                </li>
                {rubros.map((r) => (
                  <li key={r.id}>
                    <Link {...enlaceRubro(r.id)} aria-current={f.categoria === r.id && !f.sub ? "true" : undefined} className={enlaceFila(f.categoria === r.id && !f.sub)}>
                      {r.nombre}
                      {conteo(r.productos)}
                    </Link>
                    {f.categoria === r.id && r.categorias.length > 1 && (
                      <ul aria-label={t.panel.categoriasDe(r.nombre)} className="ml-3.5 flex flex-col">
                        {r.categorias.map((c) => (
                          <li key={c.categoria}>
                            <Link {...enlaceSub(c.categoria)} aria-current={f.sub === c.categoria ? "true" : undefined} className={enlaceFila(f.sub === c.categoria)}>
                              {c.categoria}
                              {conteo(c.productos)}
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

          <form action="/marketplace" className="flex flex-col gap-[22px]">
            {f.busqueda && <input type="hidden" name="q" value={f.busqueda} />}
            {f.categoria && <input type="hidden" name="categoria" value={f.categoria} />}
            {f.sub && <input type="hidden" name="sub" value={f.sub} />}
            {f.orden !== "recientes" && <input type="hidden" name="orden" value={f.orden} />}

            <fieldset className="flex flex-col gap-2">
              <legend className={`${titulo} mb-1`}>{t.rangoPrecio}</legend>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
                <label className="flex flex-col gap-1 text-xs text-texto-2">
                  {t.precioMin}
                  <input name="min" inputMode="decimal" pattern="\d*([.,]\d{0,2})?" defaultValue={f.min} placeholder="$0" className={campo} />
                </label>
                <span aria-hidden="true" className="flex h-10 items-center text-sm text-texto-2">–</span>
                <label className="flex flex-col gap-1 text-xs text-texto-2">
                  {t.precioMax}
                  <input name="max" inputMode="decimal" pattern="\d*([.,]\d{0,2})?" defaultValue={f.max} placeholder="$100" className={campo} />
                </label>
              </div>
            </fieldset>

            <fieldset className="flex flex-col">
              <legend className={`${titulo} mb-1`}>{t.panel.entrega}</legend>
              <label className="mb-2 flex flex-col gap-1 text-xs text-texto-2">
                {t.panel.departamento}
                <select name="depto" defaultValue={f.depto} className={campo}>
                  <option value="">{t.panel.todoElPais}</option>
                  {DEPARTAMENTOS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
                <input type="checkbox" name="gratis" value="1" defaultChecked={f.gratis} className="casilla-lote" />
                {t.panel.envioGratis}
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
                <input type="checkbox" name="oferta" value="1" defaultChecked={f.oferta} className="casilla-lote" />
                {t.panel.soloOferta}
              </label>
            </fieldset>

            <button type="submit" className={`inline-flex h-11 w-full items-center justify-center rounded-full border border-teal-oscuro bg-mango px-6 text-sm font-bold ${foco}`}>
              {t.aplicar}
            </button>
          </form>
        </div>
      </DialogoFiltros>
    </aside>
  );
}
