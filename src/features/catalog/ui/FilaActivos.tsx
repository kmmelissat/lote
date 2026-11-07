import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { textos } from "@/lib/textos";
import { BotonFiltros } from "./DialogoFiltros";
import { enlaceExplorar, type Filtros } from "./enlacesExplorar";
import { ID_FILTROS } from "./PanelFiltros";

const t = textos.explorar;

const base = "inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-bold text-teal-oscuro transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro md:h-9";

/** Lo que está puesto en los filtros, con a dónde lleva quitarlo. */
function activosDe(f: Filtros) {
  const sin = (cambio: Partial<Filtros>) => enlaceExplorar({ ...f, ...cambio, pagina: 1 });
  const lista: { texto: string; quitar: ReturnType<typeof enlaceExplorar> }[] = [];
  if (f.busqueda) lista.push({ texto: `“${f.busqueda}”`, quitar: sin({ busqueda: "" }) });
  if (f.sub) lista.push({ texto: f.sub, quitar: sin({ sub: "" }) });
  if (f.min || f.max) {
    const texto = f.min && f.max ? t.fila.entre(f.min, f.max) : f.max ? t.fila.hasta(f.max) : t.fila.desde(f.min);
    lista.push({ texto, quitar: sin({ min: "", max: "" }) });
  }
  if (f.depto) lista.push({ texto: f.depto, quitar: sin({ depto: "" }) });
  if (f.gratis) lista.push({ texto: t.panel.envioGratis, quitar: sin({ gratis: false }) });
  if (f.oferta) lista.push({ texto: t.panel.soloOferta, quitar: sin({ oferta: false }) });
  return lista;
}

/**
 * La única fila encima del grid en la vista de categoría y búsqueda: los filtros puestos (amarillos, con ×), los accesos rápidos de
 * precio que no estén puestos, "Limpiar filtros", y a la derecha cuántos hay y cómo ordenar. En pantallas chicas lleva el botón "Filtros".
 */
export function FilaActivos({ f, limpiar, derecha }: { f: Filtros; limpiar: Route | null; derecha: ReactNode }) {
  const activos = activosDe(f);
  const hasta = (tope: string) => enlaceExplorar({ ...f, min: "", max: tope, pagina: 1 });
  const rapidos = [
    { texto: t.rapidos.hasta10, tope: "10" },
    { texto: t.rapidos.hasta25, tope: "25" },
  ].filter((r) => !(f.max === r.tope && !f.min));
  // Los filtros del panel que no se ven como botón en la fila
  const enPanel = [f.min || f.max, f.depto, f.gratis, f.oferta].filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <BotonFiltros para={ID_FILTROS} activos={enPanel} />
      <ul className="-mx-4 flex max-w-[calc(100%+2rem)] items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:max-w-none md:flex-wrap md:overflow-visible md:px-0">
        {activos.map((a) => (
          <li key={a.texto} className="shrink-0">
            <Link {...a.quitar} className={`${base} border-teal-oscuro bg-limon`}>
              {a.texto}
              <span aria-hidden="true">×</span>
              <span className="sr-only">{t.fila.quitar}</span>
            </Link>
          </li>
        ))}
        {rapidos.map((r) => (
          <li key={r.texto} className="shrink-0">
            <Link {...hasta(r.tope)} className={`${base} border-[#b9c7c9] bg-white hover:bg-teal-fondo/50`}>
              {r.texto}
            </Link>
          </li>
        ))}
        {limpiar && (
          <li className="shrink-0">
            <Link href={limpiar} rel="nofollow" scroll={false} className="inline-flex min-h-11 items-center rounded px-1 text-sm font-bold text-teal underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro">
              {t.barra.limpiar}
            </Link>
          </li>
        )}
      </ul>
      <div className="flex shrink-0 items-center gap-3 md:ml-auto">{derecha}</div>
    </div>
  );
}
