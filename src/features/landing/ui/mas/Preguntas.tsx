import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { contenedor } from "../comun";
import { Aparece, ApareceCaja, ApareceGrupo } from "./Aparece";

const t = textos.landing;

export function Preguntas() {
  const p = t.preguntas;
  return (
    <section id="preguntas" className="relative scroll-mt-24 overflow-x-clip py-16 md:py-24" aria-labelledby="preguntas-mas">
      <div className={`${contenedor} flex max-w-3xl flex-col gap-10`}>
        <Aparece className="flex flex-col items-center gap-3 text-center">
          <h2 id="preguntas-mas" className="font-logo text-[36px] font-semibold leading-[1.1] text-teal-oscuro md:text-[52px]">
            {p.titulo}
          </h2>
          <p className="text-lg leading-relaxed text-texto-2">{p.intro}</p>
        </Aparece>
        <ApareceGrupo as="div" className="flex flex-col">
          {p.items.map((i) => (
            <ApareceCaja key={i.p}>
              <details className="group border-b border-linea">
                <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 font-logo text-[22px] font-medium text-teal-oscuro md:text-2xl [&::-webkit-details-marker]:hidden">
                  {i.p}
                  <span className="shrink-0 text-rosa transition-transform duration-200 group-open:rotate-45">
                    <Icon nombre="mas" className="size-6" strokeWidth={2.5} />
                  </span>
                </summary>
                <p className="pb-6 text-[17px] leading-relaxed text-texto-2">{i.r}</p>
              </details>
            </ApareceCaja>
          ))}
        </ApareceGrupo>
      </div>
    </section>
  );
}
