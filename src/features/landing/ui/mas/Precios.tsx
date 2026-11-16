import { textos } from "@/lib/textos";
import { contenedor } from "../comun";
import { Aparece } from "./Aparece";
import { PlanesPrecios } from "./PlanesPrecios";

const p = textos.landing.precios;

export function Precios({ conSesion }: { conSesion: boolean }) {
  return (
    <section id="precios" className="relative scroll-mt-24 overflow-x-clip py-16 md:py-28" aria-labelledby="precios-mas">
      <div className={`${contenedor} relative flex flex-col gap-12`}>
        <Aparece className="flex max-w-2xl flex-col gap-3">
          <h2 id="precios-mas" className="font-logo text-[36px] font-semibold leading-[1.1] text-teal-oscuro md:text-[52px]">
            {p.titulo}
          </h2>
          <p className="text-[18px] font-medium leading-relaxed text-teal-oscuro/85">{p.intro}</p>
        </Aparece>
        <PlanesPrecios conSesion={conSesion} />
        <p className="text-sm font-medium text-teal-oscuro/75">{p.nota}</p>
      </div>
    </section>
  );
}
