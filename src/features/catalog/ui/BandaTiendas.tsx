import type { Route } from "next";
import Link from "next/link";
import { textos } from "@/lib/textos";
import type { TiendaExplorar } from "../explorar";
import { LogoTienda } from "./MarcaTienda";

const t = textos.explorar.todasBanda;
const AVATARES = 5;

/** La banda amarilla que invita a ver todas las tiendas: cinco avatares encimados, el resto en un "+N", y el botón. */
export function BandaTiendas({ tiendas, destino }: { tiendas: TiendaExplorar[]; destino: { href: Route; rel?: string; scroll?: false } }) {
  const vistas = tiendas.slice(0, AVATARES);
  const resto = tiendas.length - vistas.length;
  const circulo = "flex size-11 shrink-0 md:size-14 items-center justify-center rounded-full border-[3px] border-limon";

  return (
    <section aria-labelledby="banda-tiendas" className="flex flex-col gap-5 rounded-3xl bg-limon p-5 text-teal-oscuro md:p-8 md:flex-row md:items-center md:gap-8">
      <div aria-hidden="true" className="flex items-center pl-3.5">
        {vistas.map((tienda) => (
          <LogoTienda key={tienda.slug} logo={tienda.logo} nombre={tienda.nombre} className={`${circulo} -ml-3.5 bg-white !rounded-full !text-xl`} />
        ))}
        {resto > 0 && <span className={`${circulo} -ml-3.5 bg-teal-oscuro text-sm font-bold text-white`}>+{resto}</span>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 id="banda-tiendas" className="line-clamp-2 font-logo text-xl font-bold md:text-2xl leading-tight">
          {t.titulo(tiendas.length)}
        </h2>
        <p className="text-sm max-md:hidden">{t.linea}</p>
      </div>
      <Link {...destino} className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-full bg-teal-oscuro px-6 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro md:w-auto">
        {t.boton}
      </Link>
    </section>
  );
}
