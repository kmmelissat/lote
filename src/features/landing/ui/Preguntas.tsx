import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { contenedor, Monito, parrafo, tituloSeccion } from "./comun";

const t = textos.landing.preguntas;

export function Preguntas() {
  return (
    <section id="preguntas" className="scroll-mt-16 bg-crema py-12 md:py-24" aria-labelledby="preguntas-titulo">
      <div className={`${contenedor} revelar grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.5fr] md:gap-16`}>
        <div className="flex flex-col gap-4 md:sticky md:top-24 md:self-start">
          <h2 id="preguntas-titulo" className={tituloSeccion}>
            {t.titulo}
          </h2>
          <p className={parrafo}>{t.intro}</p>
          <Monito nombre="saluda" className="hidden w-28 -rotate-6 text-mango md:block" />
        </div>
        <div className="flex flex-col gap-3">
          {t.items.map((i) => (
            <details key={i.p} className="group rounded-[20px] border-2 border-teal-oscuro bg-superficie px-5 py-1 open:shadow-dura-chica">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-bold [&::-webkit-details-marker]:hidden">
                {i.p}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-limon transition-transform duration-200 group-open:rotate-45">
                  <Icon nombre="mas" className="size-4" strokeWidth={2.5} />
                </span>
              </summary>
              <p className={`${parrafo} pb-4`}>{i.r}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
