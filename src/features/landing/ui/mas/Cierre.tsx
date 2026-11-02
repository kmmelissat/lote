import { LotitoMas } from "@/components/ui/LotitoMas";
import { textos } from "@/lib/textos";
import { BotonLanding, contenedor, Mini } from "../comun";
import { Aparece } from "./Aparece";
import { Sello } from "./piezasLanding";

const t = textos.landing;

export function Cierre({ conSesion }: { conSesion: boolean }) {
  return (
    <section className="relative overflow-x-clip bg-teal-oscuro py-16 text-white md:py-28" aria-labelledby="cierre-mas">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[radial-gradient(var(--color-limon)_1.2px,transparent_1.3px)] [background-size:22px_22px]"
      />
      <div className={`${contenedor} relative grid grid-cols-1 items-center gap-10 md:grid-cols-[1.15fr_0.85fr] md:gap-8`}>
        <Aparece className="relative z-10 flex flex-col items-start gap-7">
          <h2 id="cierre-mas" className="flex flex-col items-start gap-3 text-[40px] font-extrabold leading-[1.02] tracking-[-0.04em] md:text-[56px]">
            <span>{t.cierre.tituloInicio}</span>
            <span className="origin-left -rotate-1 rounded-[16px] border-[3px] border-limon bg-limon px-3 py-1 text-[28px] text-teal-oscuro shadow-[5px_5px_0_0_var(--color-mango)] sm:text-[34px] md:text-[44px] lg:text-[48px]">
              {t.cierre.tituloMarca}
            </span>
          </h2>
          <p className="max-w-lg text-[18px] font-medium leading-relaxed text-white/90 md:text-[21px]">{t.cierre.texto}</p>
          <div className="flex flex-wrap items-center gap-5">
            <BotonLanding href={conSesion ? "/inicio" : "/login"} enOscuro className="!h-14 !px-8 !text-lg">
              {conSesion ? t.irAlPanel : t.empezar}
            </BotonLanding>
            <Sello clave="cierre" texto="GRATIS PARA EMPEZAR" className="size-20 rotate-12 md:size-24" />
          </div>
        </Aparece>
        <Aparece delay={0.12} className="relative mx-auto flex h-52 w-full max-w-sm items-end justify-center md:h-72">
          <Mini src="/landing/chaqueta.webp" className="absolute left-6 top-2 aspect-square w-16 -rotate-12 md:w-20" />
          <Mini src="/landing/disco.webp" className="absolute right-4 top-8 aspect-square w-14 rotate-12 md:w-16" />
          <LotitoMas nombre="thumbsup" className="relative z-10 w-48 animate-asomar md:w-72" />
        </Aparece>
      </div>
    </section>
  );
}
