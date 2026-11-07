import Link from "next/link";
import { urlSitio } from "@/lib/sitio";
import { textos } from "@/lib/textos";
import { rutaRubro } from "../explorar";
import type { Rubro } from "../rubros";

const t = textos.explorar.sobre;

const foco = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro";

/**
 * El pie de Explorar: qué es, los rubros como enlaces limpios y compartir.
 * Le da a la página texto de verdad para los buscadores (todo el texto está en la página, aunque esté plegado) y a la persona, algo que leer si no encontró nada.
 */
export function SobreExplorar({ rubro, rubros }: { rubro?: Rubro; rubros: Rubro[] }) {
  const url = `${urlSitio}${rubro ? rutaRubro(rubro.id) : "/marketplace"}`;
  const redes = [
    { nombre: t.redes.whatsapp, href: `https://wa.me/?text=${encodeURIComponent(`${t.mensajeCompartir} ${url}`)}` },
    { nombre: t.redes.facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { nombre: t.redes.x, href: `https://x.com/intent/post?text=${encodeURIComponent(t.mensajeCompartir)}&url=${encodeURIComponent(url)}` },
  ];
  const [primero, ...resto] = [...(rubro ? [t.categoria(rubro.nombre)] : []), ...t.parrafos];
  const parrafo = "max-w-[760px] text-[15px] leading-[1.6] text-[#35525a]";

  return (
    <section aria-labelledby="sobre-explorar" className="mt-8 flex flex-col gap-6 border-t border-borde pt-8">
      <div className="flex flex-col gap-3">
        <h2 id="sobre-explorar" className="font-logo text-[22px] font-bold leading-tight">
          {t.titulo}
        </h2>
        <p className={parrafo}>{primero}</p>
        {resto.length > 0 && (
          <details className="group">
            <summary className={`inline-flex min-h-11 cursor-pointer list-none items-center rounded text-sm font-bold text-ambar-texto hover:underline ${foco} [&::-webkit-details-marker]:hidden`}>
              <span className="group-open:hidden">{t.leerMas}</span>
              <span className="hidden group-open:inline">{t.leerMenos}</span>
            </summary>
            <div className="mt-1 flex flex-col gap-3">
              {resto.map((p) => (
                <p key={p} className={parrafo}>
                  {p}
                </p>
              ))}
            </div>
          </details>
        )}
      </div>

      {rubros.length > 0 && (
        <nav aria-labelledby="categorias-explorar" className="flex flex-col gap-2">
          <h3 id="categorias-explorar" className="text-base font-bold">
            {t.categoriasTitulo}
          </h3>
          <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rubros.map((r) => (
              <li key={r.id}>
                <Link href={rutaRubro(r.id)} className={`inline-flex min-h-9 items-center rounded text-sm font-semibold text-teal-oscuro hover:underline ${foco}`}>
                  {t.descripciones[r.id] ?? r.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-texto-2">
        <p>{t.compartirTitulo}:</p>
        <ul className="flex flex-wrap gap-x-4">
          {redes.map((r) => (
            <li key={r.nombre}>
              <a href={r.href} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-9 items-center rounded font-semibold text-teal-oscuro hover:underline ${foco}`}>
                {r.nombre}
                <span className="sr-only">{t.nuevaPestana}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
