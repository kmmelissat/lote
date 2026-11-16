import { textos } from "@/lib/textos";
import { contenedor } from "../comun";
import { Aparece } from "./Aparece";

const t = textos.landing;

const tarjeta = "absolute flex flex-col gap-1.5 rounded-[24px] bg-white p-5 shadow-[0_14px_34px_-16px_rgba(1,60,71,0.25)] max-md:static max-md:w-full";

export function Problema() {
  const p = t.problema;
  return (
    <section className="relative py-12 md:py-20" aria-labelledby="problema-mas">
      <div className="px-4 md:px-6">
        <Aparece className="rounded-[40px] bg-ficha-lila py-16 md:rounded-[56px] md:py-24">
          <div className={`${contenedor} grid items-center gap-12 md:grid-cols-2`}>
            <div className="flex flex-col gap-5">
              <h2 id="problema-mas" className="font-logo text-[36px] font-semibold leading-[1.1] text-teal-oscuro md:text-[52px]">
                {p.titulo}
              </h2>
              <p className="max-w-md text-lg leading-relaxed text-teal-oscuro/85 md:text-xl">{p.texto}</p>
            </div>
            <div className="relative flex flex-col gap-3 md:block md:h-72">
              <div className={`${tarjeta} left-0 top-0 w-64 md:-rotate-3`}>
                <small className="text-xs font-semibold text-texto-2">{p.antesEtiqueta}</small>
                <b className="text-xl font-bold text-teal-oscuro">{p.antesDato}</b>
              </div>
              <div className={`${tarjeta} right-0 top-24 w-64`}>
                <small className="text-xs font-semibold text-texto-2">{p.ahoraEtiqueta}</small>
                <b className="text-xl font-bold text-teal-oscuro">{p.ahoraDato}</b>
                <small className="text-xs font-semibold text-texto-2">{p.ahoraDetalle}</small>
              </div>
            </div>
          </div>
        </Aparece>
      </div>
    </section>
  );
}
