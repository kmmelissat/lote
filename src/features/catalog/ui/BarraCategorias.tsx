import type { Route } from "next";
import Link from "next/link";
import { textos } from "@/lib/textos";

const t = textos.explorar;

type Enlace = { href: Route; rel?: string; scroll?: false };

const enlaceClase = (activa: boolean) =>
  `inline-flex h-9 items-center whitespace-nowrap text-sm font-semibold text-teal-oscuro underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro ${activa ? "underline decoration-accion decoration-2" : ""}`;

/**
 * La franja delgada (36px) bajo el encabezado, solo en escritorio: a la izquierda los tres mensajes de confianza, en texto
 * simple con un punto entre ellos, y a la derecha "Todas las tiendas" y "Ofertas".
 */
export function BarraCategorias({
  enOferta,
  enTiendas,
  enlaceOfertas,
  enlaceTiendas,
}: {
  enOferta: boolean;
  enTiendas: boolean;
  enlaceOfertas: Enlace;
  enlaceTiendas: Enlace;
}) {
  return (
    <div className="flex h-9 items-center justify-between gap-6 max-md:hidden">
      <ul aria-label={t.mercadito.motivos} className="flex items-center gap-2 text-sm text-texto-2">
        {t.mercadito.chips.map((chip, i) => (
          <li key={chip} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">·</span>}
            {chip}
          </li>
        ))}
      </ul>
      <nav aria-label={t.barraCategorias.aria} className="flex items-center gap-5">
        <Link {...enlaceTiendas} aria-current={enTiendas ? "page" : undefined} className={enlaceClase(enTiendas)}>
          {t.barraCategorias.todasLasTiendas}
        </Link>
        <Link {...enlaceOfertas} aria-current={enOferta ? "page" : undefined} className={enlaceClase(enOferta)}>
          {t.barraCategorias.ofertas}
        </Link>
      </nav>
    </div>
  );
}
