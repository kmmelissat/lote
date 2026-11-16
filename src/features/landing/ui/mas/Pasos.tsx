import { textos } from "@/lib/textos";
import { contenedor } from "../comun";
import { Aparece, ApareceGrupo, ApareceItem } from "./Aparece";

const t = textos.landing;

const FONDO = ["bg-ficha-celeste", "bg-ficha-rosa", "bg-ficha-amarillo"];

export function Pasos() {
  return (
    <section id="como" className="relative scroll-mt-24 py-16 md:py-24" aria-labelledby="como-mas">
      <div className={`${contenedor} flex flex-col gap-12`}>
        <Aparece className="flex justify-center">
          <h2 id="como-mas" className="text-center font-logo text-[36px] font-semibold leading-[1.1] text-teal-oscuro md:text-[52px]">
            {t.como.titulo}
          </h2>
        </Aparece>
        <ApareceGrupo className="grid gap-4 md:grid-cols-3">
          {t.como.pasos.map((p, n) => (
            <ApareceItem key={p.titulo} className={`rounded-[36px] p-8 ${FONDO[n]}`}>
              <span className="font-logo text-6xl font-semibold leading-none text-teal-oscuro">{n + 1}</span>
              <h3 className="mb-2.5 mt-2 font-logo text-[25px] font-semibold leading-tight text-teal-oscuro">{p.titulo}</h3>
              <p className="text-base leading-relaxed text-teal-oscuro/85">{p.texto}</p>
            </ApareceItem>
          ))}
        </ApareceGrupo>
      </div>
    </section>
  );
}
