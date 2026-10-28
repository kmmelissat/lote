import { textos } from "@/lib/textos";
import { BotonLanding, contenedor, Monito } from "./comun";

const t = textos.landing;

export function Cierre({ conSesion }: { conSesion: boolean }) {
  return (
    <section className="bg-superficie py-12 md:py-24" aria-labelledby="cierre">
      <div className={`${contenedor} revelar`}>
        <div className="relative overflow-hidden rounded-[32px] border-2 border-teal-oscuro bg-teal-oscuro p-7 pb-24 text-white shadow-[6px_6px_0_0_var(--color-mango)] md:p-16 md:pb-16">
          <div className="relative z-10 flex max-w-2xl flex-col items-start gap-5">
            <h2 id="cierre" className="text-[38px] font-bold leading-[1.05] tracking-tight md:text-[56px]">
              {t.cierre.titulo}
            </h2>
            <p className="text-[18px] leading-relaxed text-white/85">{t.cierre.texto}</p>
            <BotonLanding href={conSesion ? "/inicio" : "/login"} enOscuro>
              {conSesion ? t.irAlPanel : t.empezar}
            </BotonLanding>
          </div>
          {/* El monito se asoma desde abajo del bloque */}
          <Monito nombre="thumbsup" className="absolute -bottom-2 right-3 z-0 w-24 animate-asomar text-rosa md:right-14 md:w-56" />
        </div>
      </div>
    </section>
  );
}
