import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { contenedor, Globo } from "../comun";
import { Aparece, ApareceCaja, ApareceGrupo } from "./Aparece";

const t = textos.landing;

export function Preguntas() {
  const p = t.preguntas;
  return (
    <section id="preguntas" className="relative scroll-mt-24 overflow-x-clip bg-white py-16 md:py-28" aria-labelledby="preguntas-mas">
      <div className={`${contenedor} grid grid-cols-1 gap-12 md:grid-cols-[1fr_1.4fr] md:gap-16`}>
        <Aparece className="flex flex-col gap-4 md:sticky md:top-24 md:self-start">
          <h2 id="preguntas-mas" className="font-logo text-[36px] font-semibold leading-[1.1] text-teal-oscuro md:text-[52px]">
            {p.titulo}
          </h2>
          <p className="text-[18px] font-medium leading-relaxed text-teal-oscuro/85">{p.intro}</p>
          <div className="hidden items-end gap-2 md:flex">
            <Globo className="">{p.globo}</Globo>
          </div>
        </Aparece>
        <ApareceGrupo as="div" className="flex flex-col gap-4">
          {p.items.map((i, n) => (
            <ApareceCaja key={i.p}>
              <details
                className={`group rounded-[24px] border border-linea bg-white px-5 py-1 shadow-xs open:bg-ficha-amarillo ${n % 2 ? "" : ""}`}
              >
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-[18px] font-bold text-teal-oscuro [&::-webkit-details-marker]:hidden">
                  {i.p}
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-linea bg-ficha-amarillo transition-transform duration-200 group-open:rotate-45">
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
