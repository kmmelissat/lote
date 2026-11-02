"use client";

import Link from "next/link";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { activaEn, FONDO_SECCION, gruposMenu, PINTA_HOVER_SECCION, type Pestana } from "./menu";
import { AbrirVitrina, Insignia } from "./PiezasMenu";

const t = textos.nav;

const FILA =
  "flex min-h-11 w-full items-center gap-3 rounded-xl border-2 px-2.5 text-sm font-bold text-teal-oscuro transition-colors group-data-[cerrado]:justify-center group-data-[cerrado]:px-0";

const TITULO =
  "w-fit -rotate-1 rounded-sm border-2 border-teal-oscuro bg-superficie px-1.5 py-0.5 font-logo text-[11px] uppercase tracking-widest text-teal-oscuro group-data-[cerrado]:hidden";

/**
 * El menú lateral de escritorio: una lista agrupada (Vender, Finanzas, Tu negocio) donde cada ícono va en un cuadrito del color
 * de su sección. La fila activa se pinta entera de ese color y, al pasar el mouse, las demás se pintan a la mitad. Lo que abre
 * afuera (Marketplace, la vitrina) va al final de "Tu negocio", con su flechita. Recogido quedan solo los íconos, blancos y el de la sección activa de color, con una raya punteada
 * donde antes iba el título de cada grupo.
 */
export function ListaMenuVertical({
  items,
  ruta,
  porAtender = 0,
  urgente = false,
  slug = "",
  esDuena = false,
}: {
  items: Pestana[];
  ruta: string | null;
  porAtender?: number;
  urgente?: boolean;
  slug?: string;
  esDuena?: boolean;
}) {
  const porHref = new Map(items.map((p) => [p.href, p]));

  const fila = (nombre: NombreIcono, etiqueta: string, activa: boolean, fondo: string, derecha?: React.ReactNode) => (
    <>
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-teal-oscuro ${activa ? `${fondo} group-not-data-[cerrado]:bg-superficie` : `${fondo} group-data-[cerrado]:bg-superficie`}`}
      >
        <Icon nombre={nombre} className="size-5" />
      </span>
      <span className="flex-1 truncate group-data-[cerrado]:hidden">{etiqueta}</span>
      {derecha}
    </>
  );

  const externo = (clave: string, href: string, etiqueta: string, nombre: NombreIcono) => (
    <li key={clave}>
      <Link
        href={href}
        target="_blank"
        rel="noreferrer"
        title={etiqueta}
        className={`${FILA} border-transparent ${PINTA_HOVER_SECCION[clave] ?? ""}`}
      >
        {fila(nombre, etiqueta, false, FONDO_SECCION[clave] ?? "bg-superficie", <Icon nombre="enlace" className="size-4 shrink-0 text-texto-2 group-data-[cerrado]:hidden" />)}
        <span className="sr-only">{textos.explorar.sobre.nuevaPestana}</span>
      </Link>
    </li>
  );

  return (
    <div className="flex flex-col gap-5 group-data-[cerrado]:gap-3">
      {gruposMenu.map((g) => {
        const esNegocio = g.titulo === t.grupos.negocio;
        const filas = g.rutas.flatMap((r) => porHref.get(r) ?? []);
        if (filas.length === 0 && !esNegocio) return null;
        return (
          <section
            key={g.titulo}
            aria-label={g.titulo}
            className="flex flex-col gap-1.5 group-data-[cerrado]:border-t-2 group-data-[cerrado]:border-dashed group-data-[cerrado]:border-teal-oscuro/30 group-data-[cerrado]:pt-3 group-data-[cerrado]:first:border-t-0 group-data-[cerrado]:first:pt-0"
          >
            <h2 className={TITULO}>{g.titulo}</h2>
            <ul className="flex flex-col gap-1">
              {filas.map((p) => {
                const activa = ruta !== null && activaEn(ruta, p.href);
                const fondo = FONDO_SECCION[p.href] ?? "bg-superficie";
                return (
                  <li key={p.href} className="relative">
                    <Link
                      href={p.href}
                      aria-current={activa ? "page" : undefined}
                      title={p.etiqueta}
                      className={`${FILA} ${activa ? `border-teal-oscuro ${fondo} group-data-[cerrado]:border-transparent group-data-[cerrado]:bg-transparent` : `border-transparent ${PINTA_HOVER_SECCION[p.href] ?? ""}`}`}
                    >
                      {fila(p.icono, p.etiqueta, activa, fondo, p.href === "/pedidos" ? <Insignia n={porAtender} urgente={urgente} /> : null)}
                    </Link>
                    {p.href === "/ajustes/tienda" && slug ? (
                      <AbrirVitrina
                        slug={slug}
                        className="absolute right-1 top-0 flex size-11 items-center justify-center text-texto-2 hover:text-teal group-data-[cerrado]:hidden"
                      />
                    ) : null}
                  </li>
                );
              })}
              {esNegocio ? (
                <>
                  {slug && !esDuena && externo("/vitrina", `/c/${slug}`, t.vitrina, "tienda")}
                  {externo("/marketplace", "/marketplace", t.explorar, "explorar")}
                </>
              ) : null}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
