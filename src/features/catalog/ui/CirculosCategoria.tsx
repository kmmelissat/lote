import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Baby,
  CakeSlice,
  Car,
  Disc3,
  Dumbbell,
  Gem,
  HeartPulse,
  Palette,
  PartyPopper,
  PawPrint,
  Pencil,
  Shapes,
  Shirt,
  Smartphone,
  Sparkles,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import { urlFoto } from "@/lib/fotos";
import { textos } from "@/lib/textos";
import { AbrirCategorias } from "./AbrirCategorias";
import type { Rubro, RubroId } from "../rubros";

const t = textos.explorar;

/** Cada rubro con su ícono y un fondo suave, para reconocerlo de un vistazo. */
export const ESTILO: Record<RubroId, { Icono: LucideIcon; fondo: string }> = {
  ropa: { Icono: Shirt, fondo: "bg-rosa/30" },
  belleza: { Icono: Sparkles, fondo: "bg-rosa-palido" },
  comida: { Icono: CakeSlice, fondo: "bg-limon/50" },
  hogar: { Icono: Sprout, fondo: "bg-celeste/30" },
  tecnologia: { Icono: Smartphone, fondo: "bg-celeste-palido" },
  musica: { Icono: Disc3, fondo: "bg-mango/25" },
  mascotas: { Icono: PawPrint, fondo: "bg-teal-fondo" },
  ninos: { Icono: Baby, fondo: "bg-rosa-palido" },
  joyeria: { Icono: Gem, fondo: "bg-celeste-palido" },
  arte: { Icono: Palette, fondo: "bg-limon/50" },
  papeleria: { Icono: Pencil, fondo: "bg-teal-fondo" },
  deportes: { Icono: Dumbbell, fondo: "bg-celeste/30" },
  salud: { Icono: HeartPulse, fondo: "bg-rosa/30" },
  fiestas: { Icono: PartyPopper, fondo: "bg-mango/25" },
  autos: { Icono: Car, fondo: "bg-teal-fondo" },
  otros: { Icono: Shapes, fondo: "bg-teal-fondo" },
};

const item = "group flex w-[72px] flex-col items-center gap-2 text-center sm:w-full lg:w-[110px]";
const nombre = "line-clamp-2 max-w-[110px] text-xs font-bold leading-tight text-teal-oscuro md:text-[13px] lg:text-sm lg:font-semibold";

/** "Comprá por categoría": una fila de círculos, uno por rubro, que lleva al mismo filtro que los demás enlaces de categoría. */
export function CirculosCategoria({
  rubros,
  enlace,
  verTodas,
  fotos = {},
}: {
  rubros: Rubro[];
  enlace: (rubro: string) => { href: Route; rel?: string; scroll?: false };
  /** A dónde lleva el último círculo */
  verTodas: string;
  /** La foto del producto más reciente de cada rubro (si no hay, va el ícono) */
  fotos?: Partial<Record<RubroId, string>>;
}) {
  return (
    <section aria-labelledby="circulos-titulo" className="flex flex-col gap-[14px]">
      <h2 id="circulos-titulo" className="font-logo text-[22px] font-bold leading-tight">
        {t.circulos.titulo}
      </h2>
      {/* Celular: scroll horizontal con ítems de 72px; 640–1023px: 5 columnas en dos filas; desde 1024px: las 10 columnas a todo el ancho */}
      <ul className="-mx-4 flex snap-x scroll-px-4 gap-[14px] overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-x-3 sm:gap-y-5 sm:mb-7 sm:overflow-visible sm:px-0 lg:flex lg:snap-x lg:gap-6 lg:overflow-x-auto lg:px-1 lg:py-1 lg:mb-0">
        {rubros.map((r) => {
          const { Icono, fondo } = ESTILO[r.id];
          return (
            <li key={r.id} className="shrink-0 snap-start sm:flex sm:shrink sm:justify-center lg:shrink-0">
              <Link {...enlace(r.id)} className={item}>
                {/* Un anillo de 3px del color suave de la categoría (naranja al pasar el mouse); adentro, la foto o el ícono */}
                <span aria-hidden="true" className={`flex size-16 items-center justify-center rounded-full p-[3px] transition-[transform,background-color] duration-150 group-hover:-translate-y-1 group-hover:bg-accion sm:size-[68px] lg:size-24 ${fotos[r.id] ? fondo : ""}`}>
                  <span className={`relative flex size-full items-center justify-center overflow-hidden rounded-full text-teal-oscuro ${fondo}`}>
                    {fotos[r.id] ? (
                      <Image src={urlFoto(fotos[r.id]!)} alt="" fill sizes="96px" className="object-cover" />
                    ) : (
                      <Icono className="size-6 sm:size-7 lg:size-9" strokeWidth={2} />
                    )}
                  </span>
                </span>
                <span className={nombre}>{r.nombre}</span>
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 snap-start sm:flex sm:shrink sm:justify-center lg:shrink-0">
          {/* Celular: abre el menú de categorías a pantalla completa; desde 640px baja a la lista de productos */}
          <AbrirCategorias className={`${item} sm:hidden`}>
            <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full border border-teal-oscuro text-teal-oscuro transition-colors group-hover:bg-teal-fondo">
              <ArrowRight className="size-6" strokeWidth={2} />
            </span>
            <span className={nombre}>{t.circulos.verTodas}</span>
          </AbrirCategorias>
          <a href={verTodas} className={`${item} max-sm:hidden`}>
            <span aria-hidden="true" className="flex size-[68px] items-center justify-center rounded-full border border-teal-oscuro text-teal-oscuro transition-[transform,background-color] group-hover:-translate-y-1 group-hover:bg-teal-fondo lg:size-24">
              <ArrowRight className="size-7 lg:size-8" strokeWidth={2} />
            </span>
            <span className={nombre}>{t.circulos.verTodas}</span>
          </a>
        </li>
      </ul>
    </section>
  );
}
