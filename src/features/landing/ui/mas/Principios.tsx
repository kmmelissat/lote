import { LotitoMas } from "@/components/ui/LotitoMas";
import { textos } from "@/lib/textos";
import { contenedor } from "../comun";
import { Aparece, ApareceGrupo, ApareceItem } from "./Aparece";

const t = textos.landing;

const PRINCIPIO = [
  { fondo: "bg-limon", nota: "bg-white", monito: "thumbsup" as const, giro: "-rotate-2" },
  { fondo: "bg-rosa", nota: "bg-limon", monito: "celular" as const, giro: "rotate-1" },
  { fondo: "bg-celeste", nota: "bg-white", monito: "calculadora" as const, giro: "-rotate-1" },
];

export function Principios() {
  const p = t.principios;
  return (
    <section className="relative overflow-x-clip bg-crema py-16 md:py-28" aria-labelledby="principios-mas">
      <div className={`${contenedor} relative flex flex-col gap-14`}>
        <Aparece className="flex max-w-2xl flex-col gap-3">
          <h2 id="principios-mas" className="text-[40px] font-extrabold leading-[1.02] tracking-[-0.03em] text-teal-oscuro md:text-[64px]">
            {p.titulo}
          </h2>
          <p className="text-[18px] font-medium leading-relaxed text-teal-oscuro/85">{p.intro}</p>
        </Aparece>
        <ApareceGrupo className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {p.items.map((i, n) => (
            <ApareceItem
              key={i.titulo}
              className={`relative flex flex-col gap-4 rounded-[28px] border-[3px] border-teal-oscuro p-6 pb-16 shadow-[8px_8px_0_0_var(--color-teal-oscuro)] ${PRINCIPIO[n].fondo} ${PRINCIPIO[n].giro}`}
            >
              <span className="text-[56px] font-extrabold leading-none tracking-tighter text-teal-oscuro/25">{String(n + 1).padStart(2, "0")}</span>
              <h3 className="-mt-2 text-[26px] font-extrabold leading-tight text-teal-oscuro">{i.titulo}</h3>
              <p className="text-[17px] leading-relaxed text-teal-oscuro/85">{i.texto}</p>
              <figure className={`mt-auto p-4 shadow-[4px_4px_0_0_rgba(0,56,68,0.25)] ${n % 2 ? "rotate-2" : "-rotate-2"} ${PRINCIPIO[n].nota}`}>
                <blockquote className="text-[16px] font-semibold leading-snug">«{i.cita}»</blockquote>
                <figcaption className="mt-2 text-sm font-bold">{i.quien}</figcaption>
              </figure>
              <LotitoMas nombre={PRINCIPIO[n].monito} className="absolute -bottom-4 right-3 w-20 md:w-28" />
            </ApareceItem>
          ))}
        </ApareceGrupo>
      </div>
    </section>
  );
}
