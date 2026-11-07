import { textos } from "@/lib/textos";
import { BotonLanding } from "../comun";
import { Aparece } from "./Aparece";
import { HeroEscena } from "./HeroEscena";

const t = textos.landing;

export function Hero({ conSesion }: { conSesion: boolean }) {
  return (
    <section className="relative bg-celeste-palido">
      {/* Primera pantalla: el hero entero, sin la cinta. El espacio de abajo es solo
          la mitad de la cinta, para que el borde quede debajo del pliegue. */}
      <div className="relative flex min-h-svh flex-col justify-center">
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-7 px-5 pb-12 pt-36 min-[880px]:gap-2 min-[880px]:px-10 min-[880px]:pb-16 min-[880px]:pt-32">
          <Aparece alCargar className="relative flex max-w-[760px] flex-col items-center gap-3 text-center min-[880px]:gap-3.5">
            <span className="-rotate-2 rounded-full border border-teal-oscuro bg-celeste px-4 py-1.5 text-sm font-bold text-teal-oscuro shadow-dura-chica">
              {t.hero.etiqueta}
            </span>
            <h1 className="flex flex-col items-center gap-2 text-[38px] font-extrabold leading-[1.04] tracking-[-0.04em] text-teal-oscuro min-[880px]:text-[56px]">
              <span>{t.hero.tituloInicio}</span>
              <span className="-rotate-1 whitespace-nowrap rounded-[16px] border border-teal-oscuro bg-rosa px-3 py-0.5 text-[31px] text-crema shadow-[5px_5px_0_0_var(--color-teal-oscuro)] min-[880px]:text-[46px]">
                {t.hero.tituloMarca}
              </span>
            </h1>
            <p className="max-w-lg text-[17px] font-medium leading-relaxed text-teal-oscuro min-[880px]:max-w-2xl min-[880px]:text-[19px]">{t.hero.texto}</p>
            <BotonLanding href={conSesion ? "/inicio" : "/login"} variante="mango" className="mt-1 !h-14 w-full max-w-sm !px-8 !text-lg min-[880px]:w-auto">
              {conSesion ? t.irAlPanel : t.empezar}
            </BotonLanding>
            <p className="text-sm font-medium text-teal-oscuro/80">{t.hero.nota}</p>
          </Aparece>
          <Aparece alCargar delay={0.15} className="relative w-full min-w-0 min-[880px]:-mt-2">
            <HeroEscena />
            <p className="mt-2 text-center text-xs font-medium text-teal-oscuro/80">{t.hero.ejemplo}</p>
          </Aparece>
        </div>
      </div>
      <div className="h-[calc(2rem+4.5vw)]" aria-hidden="true" />
    </section>
  );
}
