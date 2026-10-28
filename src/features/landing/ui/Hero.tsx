import { textos } from "@/lib/textos";
import { BotonLanding } from "./comun";
import { HeroAnimado } from "./HeroAnimado";

const t = textos.landing.hero;

export function Hero({ conSesion }: { conSesion: boolean }) {
  return (
    <section className="overflow-hidden bg-crema">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-12 md:grid-cols-[1.05fr_1fr] md:gap-8 md:px-8 md:py-20">
        <div className="flex flex-col items-start gap-6">
          <span className="rounded-full border-2 border-teal-oscuro bg-rosa-palido px-4 py-1.5 text-sm font-bold text-teal-oscuro">
            {t.etiqueta}
          </span>
          <h1 className="text-[44px] font-bold leading-[1.02] tracking-[-0.03em] text-teal-oscuro md:text-[72px]">
            {t.tituloInicio}{" "}
            <span className="bg-[linear-gradient(transparent_58%,var(--color-limon)_58%)] [box-decoration-break:clone]">
              {t.tituloMarca}
            </span>
          </h1>
          <p className="max-w-lg text-[18px] leading-relaxed text-teal-oscuro/80 md:text-[20px]">{t.texto}</p>
          <div className="flex flex-wrap gap-3">
            <BotonLanding href={conSesion ? "/inicio" : "/login"}>{conSesion ? textos.landing.irAlPanel : textos.landing.empezar}</BotonLanding>
            <BotonLanding href="#como" variante="claro">
              {t.verComo}
            </BotonLanding>
          </div>
          <p className="text-sm text-teal-oscuro/70">{t.nota}</p>
        </div>

        <div>
          <HeroAnimado />
          <p className="mt-3 text-center text-xs text-teal-oscuro/70">{t.ejemplo}</p>
        </div>
      </div>

      <div className="border-t-2 border-teal-oscuro/15">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-4 text-sm md:px-8">
          <span className="text-teal-oscuro/70">{t.fuente}</span>
          {t.emprendimientos.map((e) => (
            <span key={e} className="rounded-full border-2 border-teal-oscuro bg-superficie px-3 py-0.5 font-bold text-teal-oscuro">
              {e}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
