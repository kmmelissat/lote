import { Icon } from "@/components/ui/Icon";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { textos } from "@/lib/textos";
import { BotonLanding, contenedor } from "../comun";
import { Aparece, ApareceCaja, ApareceGrupo } from "./Aparece";

const t = textos.landing;

export function Precios({ conSesion }: { conSesion: boolean }) {
  const p = t.precios;
  return (
    <section id="precios" className="relative scroll-mt-24 overflow-x-clip bg-limon py-16 md:py-28" aria-labelledby="precios-mas">
      <div className={`${contenedor} relative flex flex-col gap-14`}>
        <Aparece className="flex max-w-2xl flex-col gap-3">
          <h2 id="precios-mas" className="text-[40px] font-extrabold leading-[1.02] tracking-[-0.03em] text-teal-oscuro md:text-[64px]">
            {p.titulo}
          </h2>
          <p className="text-[18px] font-medium leading-relaxed text-teal-oscuro/85">{p.intro}</p>
        </Aparece>
        <ApareceGrupo as="div" className="grid grid-cols-1 items-stretch gap-10 md:grid-cols-2">
          <ApareceCaja as="article" className="relative flex flex-col gap-6 rounded-[32px] border-[3px] border-teal-oscuro bg-white p-8 pb-20 shadow-[10px_10px_0_0_var(--color-teal-oscuro)] md:-rotate-1">
            <span className="absolute -top-5 left-6 -rotate-3 rounded-full border-[3px] border-teal-oscuro bg-mango px-4 py-1 text-sm font-extrabold text-teal-oscuro shadow-dura-chica">
              {p.recomendado}
            </span>
            <p className="mt-4 font-extrabold text-teal-oscuro">{p.gratis.nombre}</p>
            <p className="text-[88px] font-extrabold leading-none tracking-tighter text-teal-oscuro">{p.gratis.precio}</p>
            <p className="text-[17px] font-medium leading-relaxed text-teal-oscuro/85">{p.gratis.texto}</p>
            <ul className="flex flex-col gap-2.5">
              {p.gratis.lista.map((l) => (
                <li key={l} className="flex gap-2.5 text-[17px] font-medium">
                  <Icon nombre="check" className="mt-0.5 size-5 shrink-0 text-teal" strokeWidth={2.5} />
                  {l}
                </li>
              ))}
            </ul>
            <p className="text-sm font-medium text-teal-oscuro/70">{p.gratis.nota}</p>
            <BotonLanding href={conSesion ? "/inicio" : "/login"} className="mt-auto !h-14 !px-8 !text-lg">
              {conSesion ? t.irAlPanel : t.empezar}
            </BotonLanding>
            <LotitoMas nombre="thumbsup" className="absolute -bottom-3 right-4 w-20 md:w-28" />
          </ApareceCaja>
          <ApareceCaja as="article" className="relative flex flex-col gap-6 rounded-[32px] border-[3px] border-dashed border-teal-oscuro bg-crema p-8 md:rotate-1">
            <span className="absolute -top-5 left-6 rotate-2 rounded-full border-[3px] border-teal-oscuro bg-celeste px-4 py-1 text-sm font-extrabold text-teal-oscuro shadow-dura-chica">
              {p.proximamente}
            </span>
            <p className="mt-4 font-extrabold text-teal-oscuro">{p.pago.nombre}</p>
            <p className="text-[40px] font-extrabold leading-tight tracking-tight text-teal-oscuro">{p.pago.precio}</p>
            <p className="text-[17px] font-medium leading-relaxed text-teal-oscuro/85">{p.pago.texto}</p>
            <ul className="flex flex-col gap-2.5">
              {p.pago.lista.map((l) => (
                <li key={l} className="flex gap-2.5 text-[17px] font-medium">
                  <Icon nombre="check" className="mt-0.5 size-5 shrink-0 text-teal" strokeWidth={2.5} />
                  {l}
                </li>
              ))}
            </ul>
            <p className="mt-auto text-sm font-medium text-teal-oscuro/70">{p.pago.nota}</p>
          </ApareceCaja>
        </ApareceGrupo>
      </div>
    </section>
  );
}
