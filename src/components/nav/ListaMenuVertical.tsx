import { ruta as rutaDe } from "@/lib/ruta";
import type { Route } from "next";
import Link from "next/link";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { activaEn, FICHA_SECCION, gruposMenu, type Pestana } from "./menu";
import { AbrirVitrina, Insignia } from "./PiezasMenu";

const t = textos.nav;

const FILA =
  "flex min-h-11 w-full items-center gap-3 rounded-[14px] border px-2 text-sm font-medium text-teal-oscuro transition-colors group-data-[cerrado]:mx-auto group-data-[cerrado]:size-12 group-data-[cerrado]:min-h-0 group-data-[cerrado]:justify-center group-data-[cerrado]:px-0";

const TITULO =
  "px-2 text-xs font-bold uppercase tracking-wide text-teal group-data-[cerrado]:hidden";

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
  enCamino = 0,
  slug = "",
  esDuena = false,
}: {
  items: Pestana[];
  ruta: string | null;
  porAtender?: number;
  urgente?: boolean;
  enCamino?: number;
  slug?: string;
  esDuena?: boolean;
}) {
  const porHref = new Map(items.map((p) => [p.href, p]));

  const fila = (nombre: NombreIcono, etiqueta: string, activa: boolean, fondo: string, derecha?: React.ReactNode) => (
    <>
      <span
        className={`flex size-8 shrink-0 items-center justify-center transition-colors group-data-[cerrado]:size-10 ${activa ? fondo : "text-texto-2 group-hover/fila:text-teal-oscuro"}`}
      >
        <Icon nombre={nombre} className="size-5" />
      </span>
      <span className="flex-1 truncate group-data-[cerrado]:hidden">{etiqueta}</span>
      {derecha}
    </>
  );

  const externo = (clave: string, href: Route, etiqueta: string, nombre: NombreIcono) => (
    <li key={clave}>
      <Link
        href={href}
        target="_blank"
        rel="noreferrer"
        title={etiqueta}
        className={`group/fila ${FILA} border-transparent hover:bg-superficie/70`}
      >
        {fila(nombre, etiqueta, false, FICHA_SECCION[clave] ?? "text-texto-2", <Icon nombre="enlace" className="size-4 shrink-0 text-texto-2 group-data-[cerrado]:hidden" />)}
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
            className="flex flex-col gap-1.5 group-data-[cerrado]:border-t group-data-[cerrado]:border-linea group-data-[cerrado]:pt-3 group-data-[cerrado]:first:border-t-0 group-data-[cerrado]:first:pt-0"
          >
            <h2 className={TITULO}>{g.titulo}</h2>
            <ul className="flex flex-col gap-0.5">
              {filas.map((p) => {
                const activa = ruta !== null && activaEn(ruta, p.href);
                const fondo = FICHA_SECCION[p.href] ?? "text-texto-2";
                return (
                  <li key={p.href} className="relative">
                    <Link
                      href={p.href}
                      aria-current={activa ? "page" : undefined}
                      title={p.etiqueta}
                      className={`group/fila ${FILA} ${activa ? "activa border-transparent bg-superficie font-bold shadow-xs group-data-[cerrado]:bg-transparent group-data-[cerrado]:shadow-none" : "border-transparent hover:bg-superficie/70"}`}
                    >
                      {fila(
                        p.icono,
                        p.etiqueta,
                        activa,
                        fondo,
                        p.href === "/pedidos" ? (
                          <Insignia n={porAtender} urgente={urgente} enCamino={enCamino} />
                        ) : null,
                      )}
                    </Link>
                    {p.href === "/ajustes/tienda" && slug ? (
                      <AbrirVitrina
                        slug={slug}
                        className="absolute right-px top-0 flex h-11 w-8 items-center justify-center text-texto-2 hover:text-teal group-data-[cerrado]:hidden"
                      />
                    ) : null}
                  </li>
                );
              })}
              {esNegocio ? (
                <>
                  {slug && !esDuena && externo("/vitrina", rutaDe(`/c/${slug}`), t.vitrina, "tienda")}
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
