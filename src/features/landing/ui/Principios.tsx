import { Gorila } from "@/components/ui/Gorila";
import { textos } from "@/lib/textos";
import { contenedor, Globo, Nota, parrafo, tarjeta, tituloSeccion } from "./comun";

const t = textos.landing.principios;

export function Principios() {
  return (
    <section className="bg-rosa-palido py-12 md:py-24" aria-labelledby="principios">
      <div className={`${contenedor} revelar flex flex-col gap-10`}>
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 id="principios" className={tituloSeccion}>
            {t.titulo}
          </h2>
          <p className={parrafo}>{t.intro}</p>
        </div>
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {t.items.map((i) => (
            <li key={i.titulo} className={`${tarjeta} flex flex-col gap-4 bg-superficie`}>
              <h3 className="text-[22px] font-bold leading-tight">{i.titulo}</h3>
              <p className={parrafo}>{i.texto}</p>
              <div className="mt-auto pt-2">
                {i.cita && i.quien ? (
                  <Nota texto={i.cita} quien={i.quien} clase="rotate-1 bg-rosa text-teal-oscuro" />
                ) : (
                  <div aria-hidden="true" className="flex items-end gap-3">
                    <Gorila className="size-16 shrink-0 text-teal" />
                    <Globo className="mb-4">{t.gorila}</Globo>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
