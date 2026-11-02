import { LotitoMas } from "@/components/ui/LotitoMas";
import { textos } from "@/lib/textos";
import { contenedor } from "../comun";
import { Aparece, ApareceGrupo, ApareceItem } from "./Aparece";
import { PUNTOS } from "./piezasLanding";

const t = textos.landing;

const NOTAS = ["-rotate-2 bg-limon", "rotate-2 bg-rosa", "-rotate-1 bg-celeste"];
const TARJETAS = ["-rotate-2", "rotate-1", "-rotate-1"];

export function Problema() {
  const p = t.problema;
  return (
    <section
      className="relative z-10 bg-rosa-palido pb-16 pt-28 md:pb-28 md:pt-36"
      aria-labelledby="problema-mas"
    >
      <div aria-hidden="true" className={`absolute inset-0 opacity-[0.07] ${PUNTOS}`} />
      <div className={`${contenedor} relative flex flex-col gap-14`}>
        <Aparece className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 id="problema-mas" className="text-[40px] font-extrabold leading-[1.02] tracking-[-0.03em] text-teal-oscuro md:text-[64px]">
              {p.titulo}
            </h2>
            <p className="text-[18px] font-medium leading-relaxed text-teal-oscuro/85">{p.intro}</p>
          </div>
          <LotitoMas nombre="calculadora" className="w-28 rotate-6 md:w-36" />
        </Aparece>
        <ApareceGrupo className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {p.items.map((i, n) => (
            <ApareceItem
              key={i.titulo}
              className={`relative flex flex-col gap-4 rounded-[28px] border-[3px] border-teal-oscuro bg-white p-6 shadow-[8px_8px_0_0_var(--color-teal-oscuro)] md:transition-transform md:duration-200 md:hover:rotate-0 md:hover:-translate-y-1 ${TARJETAS[n]}`}
            >
              <span className="absolute -top-6 right-5 rotate-6 rounded-2xl border-[3px] border-teal-oscuro bg-mango px-4 py-1 text-[34px] font-extrabold leading-tight text-teal-oscuro shadow-dura-chica">
                {i.dato}
              </span>
              <h3 className="mt-6 text-[24px] font-extrabold leading-tight text-teal-oscuro">{i.titulo}</h3>
              <p className="text-[17px] leading-relaxed text-teal-oscuro/85">{i.texto}</p>
              <figure className={`mt-auto p-4 shadow-[4px_4px_0_0_rgba(0,56,68,0.25)] ${NOTAS[n]}`}>
                <blockquote className="text-[17px] font-semibold leading-snug">«{i.cita}»</blockquote>
                <figcaption className="mt-2 text-sm font-bold">{i.quien}</figcaption>
              </figure>
            </ApareceItem>
          ))}
        </ApareceGrupo>
      </div>
    </section>
  );
}
