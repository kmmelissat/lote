import type { Route } from "next";
import Link from "next/link";
import { textos } from "@/lib/textos";
import type { RubroId } from "../rubros";

const t = textos.explorar;

/** Los rubros que van en la barra, en este orden; el resto de rubros están en el menú "Categorías". */
export const RUBROS_EN_BARRA: readonly RubroId[] = ["tecnologia", "belleza", "comida", "ropa", "musica", "hogar"];

type Enlace = { href: Route; rel?: string; scroll?: false };

const base = "relative inline-flex h-11 items-center whitespace-nowrap border-b-[3px] px-1 text-sm font-bold text-teal-oscuro transition-colors";
const clase = (activa: boolean) => `${base} ${activa ? "border-accion" : "border-transparent hover:border-teal-oscuro/20"}`;

/**
 * La barra de categorías de texto, debajo del encabezado: Todo, los rubros principales, Ofertas y, a la derecha, el
 * enlace a todas las tiendas. La activa lleva subrayado naranja.
 */
export function BarraCategorias({
  rubros,
  activo,
  enOferta,
  enTiendas,
  enlaceRubro,
  enlaceOfertas,
  enlaceTiendas,
}: {
  rubros: { id: RubroId; nombre: string }[];
  /** El rubro elegido, o vacío */
  activo: string;
  enOferta: boolean;
  enTiendas: boolean;
  enlaceRubro: (rubro: string) => Enlace;
  enlaceOfertas: Enlace;
  enlaceTiendas: Enlace;
}) {
  const enBarra = RUBROS_EN_BARRA.flatMap((id) => rubros.find((r) => r.id === id) ?? []);
  const todo = !activo && !enOferta && !enTiendas;

  return (
    <nav aria-label={t.barraCategorias.aria} className="-mx-4 border-b border-teal-oscuro/15 px-4 max-md:hidden md:-mx-8 md:px-8 xl:-mx-12 xl:px-12">
      <ul className="flex items-center gap-5 overflow-x-auto [scrollbar-width:none]">
        <li className="shrink-0">
          <Link {...enlaceRubro("")} aria-current={todo ? "page" : undefined} className={clase(todo)}>
            {t.todo}
          </Link>
        </li>
        {enBarra.map((r) => {
          const actual = activo === r.id && !enOferta && !enTiendas;
          return (
            <li key={r.id} className="shrink-0">
              <Link {...enlaceRubro(r.id)} aria-current={actual ? "page" : undefined} className={clase(actual)}>
                {r.nombre}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0">
          <Link {...enlaceOfertas} aria-current={enOferta ? "page" : undefined} className={clase(enOferta)}>
            {t.barraCategorias.ofertas}
          </Link>
        </li>
        <li className="ml-auto shrink-0 pl-2">
          <Link {...enlaceTiendas} aria-current={enTiendas ? "page" : undefined} className={clase(enTiendas)}>
            {t.barraCategorias.todasLasTiendas}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
