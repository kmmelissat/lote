import Link from "next/link";
import { Baby, CakeSlice, ChevronDown, Disc3, LayoutGrid, PawPrint, Shapes, Shirt, Smartphone, Sparkles, Sprout, type LucideIcon } from "lucide-react";
import { textos } from "@/lib/textos";
import type { Rubro, RubroId } from "../rubros";

const t = textos.explorar;

/** Cada rubro con su ícono y su color, para reconocerlo de un vistazo (como en un marketplace). */
const ESTILO: Record<RubroId, { Icono: LucideIcon; fondo: string }> = {
  ropa: { Icono: Shirt, fondo: "bg-rosa-palido" },
  belleza: { Icono: Sparkles, fondo: "bg-rosa-fondo" },
  comida: { Icono: CakeSlice, fondo: "bg-perla" },
  hogar: { Icono: Sprout, fondo: "bg-teal-fondo" },
  tecnologia: { Icono: Smartphone, fondo: "bg-celeste-palido" },
  musica: { Icono: Disc3, fondo: "bg-limon" },
  mascotas: { Icono: PawPrint, fondo: "bg-ambar/30" },
  ninos: { Icono: Baby, fondo: "bg-rosa/30" },
  otros: { Icono: Shapes, fondo: "bg-gris-fondo" },
};

// En escritorio se ven estas y el resto va en "Más"; en el celular se desliza la fila entera
const VISIBLES = 6;

const tarjeta = (activa: boolean, fondo: string) =>
  `group flex h-14 shrink-0 snap-start items-center gap-2.5 rounded-[18px] border-2 border-teal-oscuro py-2 pl-2 pr-4 transition-[transform,box-shadow] duration-150 lg:w-full ${
    activa ? "bg-teal-oscuro text-white shadow-dura-chica" : `${fondo} hover:-translate-y-0.5 hover:shadow-dura-chica`
  }`;

function Contenido({ Icono, nombre }: { Icono: LucideIcon; nombre: string }) {
  return (
    <>
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white text-teal-oscuro">
        <Icono className="size-5" strokeWidth={2.2} />
      </span>
      <span className="whitespace-nowrap text-sm font-bold leading-tight lg:whitespace-normal">{nombre}</span>
    </>
  );
}

/** La fila de categorías de Explorar: tarjetas con ícono y color, no un botón más. */
export function TarjetasRubro({ rubros, activo, enlace }: { rubros: Rubro[]; activo: string; enlace: (rubro: string) => { href: string; rel?: string } }) {
  // Si la elegida está entre las que van en "Más", pasa a la vista
  const elegida = rubros.findIndex((r) => r.id === activo);
  const orden = elegida >= VISIBLES ? [...rubros.slice(0, VISIBLES - 1), rubros[elegida], ...rubros.slice(VISIBLES - 1).filter((r) => r.id !== activo)] : rubros;
  const resto = orden.slice(VISIBLES);

  return (
    <nav aria-label={t.categorias}>
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 pt-1 [scrollbar-width:none] md:mx-0 md:px-0 lg:overflow-visible">
        <li className="shrink-0 lg:min-w-0 lg:flex-1">
          <Link {...enlace("")} aria-current={!activo ? "page" : undefined} className={tarjeta(!activo, "bg-white")}>
            <Contenido Icono={LayoutGrid} nombre={t.todo} />
          </Link>
        </li>
        {orden.map((r, i) => (
          <li key={r.id} className={`shrink-0 lg:min-w-0 lg:flex-1 ${i >= VISIBLES ? "lg:hidden" : ""}`}>
            <Link {...enlace(r.id)} aria-current={activo === r.id ? "page" : undefined} className={tarjeta(activo === r.id, ESTILO[r.id].fondo)}>
              <Contenido Icono={ESTILO[r.id].Icono} nombre={r.nombre} />
            </Link>
          </li>
        ))}
        {resto.length > 0 && (
          <li className="relative hidden lg:block lg:min-w-0 lg:flex-1">
            <details className="group/mas h-full">
              <summary className={`${tarjeta(false, "bg-white")} h-full cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
                <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white">
                  <ChevronDown className="size-5 transition-transform group-open/mas:rotate-180" strokeWidth={2.2} />
                </span>
                <span className="text-sm font-bold leading-tight">{t.masCategorias}</span>
              </summary>
              <ul className="absolute right-0 z-20 mt-2 flex w-60 flex-col gap-0.5 rounded-[20px] border-2 border-teal-oscuro bg-white p-2 shadow-dura">
                {resto.map((r) => {
                  const { Icono } = ESTILO[r.id];
                  return (
                    <li key={r.id}>
                      <Link {...enlace(r.id)} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold hover:bg-crema">
                        <Icono aria-hidden="true" className="size-5 text-teal" />
                        {r.nombre}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          </li>
        )}
      </ul>
    </nav>
  );
}
