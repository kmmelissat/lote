import { textos } from "@/lib/textos";
import { contenedor } from "../comun";
import { Aparece, ApareceGrupo, ApareceItem } from "./Aparece";

const t = textos.landing;

const PRINCIPIO = [
  { fondo: "bg-ficha-amarillo", nota: "bg-white", monito: "thumbsup" as const, giro: "" },
  { fondo: "bg-ficha-rosa", nota: "bg-ficha-amarillo", monito: "celular" as const, giro: "" },
  { fondo: "bg-ficha-celeste", nota: "bg-white", monito: "calculadora" as const, giro: "" },
];

export function Principios() {
  const p = t.principios;
  return (
    <section className="relative overflow-x-clip bg-white py-16 md:py-28" aria-labelledby="principios-mas">
      <div className={`${contenedor} relative flex flex-col gap-14`}>
        <Aparece className="flex max-w-2xl flex-col gap-3">
          <h2 id="principios-mas" className="font-logo text-[36px] font-semibold leading-[1.1] text-teal-oscuro md:text-[52px]">
            {p.titulo}
          </h2>
          <p className="text-[18px] font-medium leading-relaxed text-teal-oscuro/85">{p.intro}</p>
        </Aparece>
        <ApareceGrupo className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {p.items.map((i, n) => (
            <ApareceItem
              key={i.titulo}
              className={`relative flex flex-col gap-4 rounded-[28px] border border-linea p-6 pb-16 shadow-xs ${PRINCIPIO[n].fondo} ${PRINCIPIO[n].giro}`}
            >
              <span className="text-[56px] font-bold leading-none tracking-tighter text-teal-oscuro/25">{String(n + 1).padStart(2, "0")}</span>
              <h3 className="-mt-2 text-[26px] font-bold leading-tight text-teal-oscuro">{i.titulo}</h3>
              <p className="text-[17px] leading-relaxed text-teal-oscuro/85">{i.texto}</p>
              <figure className={`mt-auto p-4 shadow-xs ${n % 2 ? "" : ""} ${PRINCIPIO[n].nota}`}>
                <blockquote className="text-[16px] font-semibold leading-snug">«{i.cita}»</blockquote>
                <figcaption className="mt-2 text-sm font-bold">{i.quien}</figcaption>
              </figure>
            </ApareceItem>
          ))}
        </ApareceGrupo>
      </div>
    </section>
  );
}
