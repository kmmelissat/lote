import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { urlSitio } from "@/lib/sitio";
import { textos } from "@/lib/textos";
import { rutaRubro } from "../explorar";
import type { Rubro } from "../rubros";

const t = textos.explorar.sobre;

const boton =
  "inline-flex h-10 items-center gap-2 rounded-full border-2 border-teal-oscuro bg-white px-4 text-sm font-bold transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura-chica";

/**
 * El pie de Explorar: qué es, los rubros como enlaces limpios y compartir.
 * Le da a la página texto de verdad para los buscadores y a la persona, algo que leer si no encontró nada.
 */
export function SobreExplorar({ rubro, rubros }: { rubro?: Rubro; rubros: Rubro[] }) {
  const url = `${urlSitio}${rubro ? rutaRubro(rubro.id) : "/marketplace"}`;
  const redes = [
    { nombre: t.redes.whatsapp, href: `https://wa.me/?text=${encodeURIComponent(`${t.mensajeCompartir} ${url}`)}` },
    { nombre: t.redes.facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { nombre: t.redes.x, href: `https://x.com/intent/post?text=${encodeURIComponent(t.mensajeCompartir)}&url=${encodeURIComponent(url)}` },
  ];

  return (
    <section aria-labelledby="sobre-explorar" className="mt-6 grid grid-cols-1 gap-4 border-t-2 border-dashed border-teal-oscuro/20 pt-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-3">
        <h2 id="sobre-explorar" className="text-2xl font-bold leading-tight">
          {t.titulo}
        </h2>
        {rubro && <p className="leading-relaxed text-texto-2">{t.categoria(rubro.nombre)}</p>}
        {t.parrafos.map((p) => (
          <p key={p} className="leading-relaxed text-texto-2">
            {p}
          </p>
        ))}

        {rubros.length > 0 && (
          <nav aria-labelledby="categorias-explorar" className="mt-2 flex flex-col gap-2">
            <h3 id="categorias-explorar" className="font-bold">
              {t.categoriasTitulo}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {rubros.map((r) => (
                <li key={r.id}>
                  <Link href={rutaRubro(r.id)} className="text-sm font-bold text-teal underline underline-offset-4">
                    {r.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-[24px] border-2 border-teal-oscuro bg-white p-5">
          <h3 className="font-bold">{t.compartirTitulo}</h3>
          <p className="text-sm text-texto-2">{t.compartirTexto}</p>
          <ul className="flex flex-wrap gap-2">
            {redes.map((r) => (
              <li key={r.nombre}>
                <a href={r.href} target="_blank" rel="noopener noreferrer" className={boton}>
                  <Icon nombre="enlace" className="size-4" />
                  {r.nombre}
                  <span className="sr-only">{t.nuevaPestana}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
