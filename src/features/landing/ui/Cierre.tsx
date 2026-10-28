import { Gorila } from "@/components/ui/Gorila";
import { textos } from "@/lib/textos";
import { BotonLanding, contenedor } from "./comun";

const t = textos.landing;

export function Cierre({ conSesion }: { conSesion: boolean }) {
  return (
    <section className="bg-superficie py-16 md:py-24" aria-labelledby="cierre">
      <div className={`${contenedor} revelar`}>
        <div className="relative overflow-hidden rounded-[32px] border-2 border-teal-oscuro bg-teal-oscuro p-8 text-white shadow-[6px_6px_0_0_var(--color-mango)] md:p-16">
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
          <Gorila className="absolute -bottom-2 right-4 z-0 size-36 animate-asomar text-rosa md:right-14 md:size-64" />
        </div>
      </div>
    </section>
  );
}
