import { Icon } from "@/components/ui/Icon";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { textos } from "@/lib/textos";
import { contenedor, Globo } from "../comun";
import { Aparece, ApareceCaja, ApareceGrupo } from "./Aparece";

const t = textos.landing;

export function Preguntas() {
  const p = t.preguntas;
  return (
    <section id="preguntas" className="relative scroll-mt-24 overflow-x-clip bg-celeste-palido py-16 md:py-28" aria-labelledby="preguntas-mas">
      <div className={`${contenedor} grid grid-cols-1 gap-12 md:grid-cols-[1fr_1.4fr] md:gap-16`}>
        <Aparece className="flex flex-col gap-4 md:sticky md:top-24 md:self-start">
          <h2 id="preguntas-mas" className="text-[40px] font-extrabold leading-[1.02] tracking-[-0.03em] text-teal-oscuro md:text-[64px]">
            {p.titulo}
          </h2>
          <p className="text-[18px] font-medium leading-relaxed text-teal-oscuro/85">{p.intro}</p>
          <div className="hidden items-end gap-2 md:flex">
            <LotitoMas nombre="saluda" className="w-32 -rotate-6 md:w-40" />
            <Globo className="rotate-2">Si no está acá, preguntame.</Globo>
          </div>
        </Aparece>
        <ApareceGrupo as="div" className="flex flex-col gap-4">
          {p.items.map((i, n) => (
            <ApareceCaja key={i.p}>
              <details
                className={`group rounded-[24px] border-[3px] border-teal-oscuro bg-white px-5 py-1 shadow-[4px_4px_0_0_var(--color-teal-oscuro)] open:bg-limon ${n % 2 ? "rotate-1" : "-rotate-1"}`}
              >
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-[18px] font-extrabold text-teal-oscuro [&::-webkit-details-marker]:hidden">
                  {i.p}
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-[3px] border-teal-oscuro bg-mango transition-transform duration-200 group-open:rotate-45">
                    <Icon nombre="mas" className="size-4" strokeWidth={2.5} />
                  </span>
                </summary>
                <p className="pb-5 text-[17px] font-medium leading-relaxed text-teal-oscuro/85">{i.r}</p>
              </details>
            </ApareceCaja>
          ))}
        </ApareceGrupo>
      </div>
    </section>
  );
}
