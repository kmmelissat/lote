import { textos } from "@/lib/textos";
import { BotonLanding } from "../comun";
import { Aparece } from "./Aparece";
import { HeroAnimadoMas } from "./HeroAnimadoMas";
import { PUNTOS, Sello } from "./piezasLanding";

const t = textos.landing;

export function Hero({ conSesion }: { conSesion: boolean }) {
  return (
    <section className="relative bg-limon">
      <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden opacity-[0.08] ${PUNTOS}`} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -left-48 top-10 size-[26rem] rounded-full bg-[radial-gradient(circle,var(--color-rosa)_0%,transparent_70%)] opacity-80 blur-2xl" />
        <span className="absolute -right-56 top-6 size-[28rem] rounded-full bg-[radial-gradient(circle,var(--color-celeste)_0%,transparent_70%)] opacity-80 blur-2xl" />
        <span className="absolute -bottom-28 -left-20 size-96 rounded-full bg-[radial-gradient(circle,var(--color-teal)_0%,transparent_70%)] opacity-50 blur-2xl" />
      </div>
      {/* Primera pantalla: el hero entero, sin la cinta. El espacio de abajo es solo
          la mitad de la cinta, para que el borde quede debajo del pliegue. */}
      <div className="relative flex min-h-svh flex-col justify-center">
        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-5 py-24 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-16 md:px-10 md:py-28">
        <Aparece alCargar className="relative flex flex-col items-start gap-7">
          <span className="-rotate-2 rounded-full border-2 border-teal-oscuro bg-celeste px-4 py-1.5 text-sm font-bold text-teal-oscuro shadow-dura-chica">
            {t.hero.etiqueta}
          </span>
          <h1 className="flex flex-col items-start gap-3 text-[40px] font-extrabold leading-[1.02] tracking-[-0.04em] text-teal-oscuro md:text-[56px]">
            <span>{t.hero.tituloInicio}</span>
            <span className="origin-left whitespace-nowrap -rotate-1 rounded-[16px] border-[3px] border-teal-oscuro bg-rosa px-3 py-1 text-[28px] text-crema shadow-[5px_5px_0_0_var(--color-teal-oscuro)] sm:text-[34px] md:text-[44px] lg:text-[48px]">
              {t.hero.tituloMarca}
            </span>
          </h1>
          <p className="max-w-lg text-[18px] font-medium leading-relaxed text-teal-oscuro md:text-[21px]">{t.hero.texto}</p>
          <div className="flex flex-wrap items-center gap-4">
            <BotonLanding href={conSesion ? "/inicio" : "/login"} variante="teal" className="!h-14 !px-8 !text-lg">
              {conSesion ? t.irAlPanel : t.empezar}
            </BotonLanding>
            <BotonLanding href="#como" variante="claro" className="!h-14 !px-7 !text-lg">
              {t.hero.verComo}
            </BotonLanding>
          </div>
          <p className="text-sm font-medium text-teal-oscuro/80">{t.hero.nota}</p>
          <Sello clave="hero" texto="GRATIS PARA EMPEZAR" color="var(--color-celeste, #8fd6f4)" className="absolute right-2 top-0 hidden size-20 rotate-12 md:block lg:-right-2 lg:-top-6 lg:size-24" />
        </Aparece>
        <Aparece alCargar delay={0.15} className="relative min-w-0">
          <HeroAnimadoMas />
          <p className="mt-3 text-center text-xs font-medium text-teal-oscuro/80">{t.hero.ejemplo}</p>
        </Aparece>
        </div>
      </div>
      <div className="h-[calc(2rem+4.5vw)]" aria-hidden="true" />
    </section>
  );
}
