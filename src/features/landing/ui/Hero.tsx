import { textos } from "@/lib/textos";
import { BotonLanding, Monito } from "./comun";
import { HeroAnimado } from "./HeroAnimado";

const t = textos.landing.hero;

// Cada nombre va como una etiqueta pegada, de un color y un poco torcida
const ETIQUETAS = [
  "-rotate-2 bg-limon",
  "rotate-1 bg-rosa",
  "-rotate-1 bg-crema",
  "rotate-2 bg-mango",
  "-rotate-1 bg-rosa-palido",
];

export function Hero({ conSesion }: { conSesion: boolean }) {
  return (
    <section className="overflow-hidden bg-crema">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-12 pt-28 md:grid-cols-[1.05fr_1fr] md:gap-8 md:px-8 md:pb-20 md:pt-32">
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

      <div className="border-t-2 border-teal-oscuro bg-superficie">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:gap-8 md:px-8">
          <p className="flex items-center gap-2 text-[15px] font-bold text-teal-oscuro md:max-w-[14rem]">
            <Monito nombre="saluda" className="w-7 shrink-0 text-rosa" />
            {t.fuente}
          </p>
          <ul className="flex flex-wrap gap-x-3 gap-y-3">
            {t.emprendimientos.map((e, i) => (
              <li
                key={e}
                className={`rounded-full border-2 border-teal-oscuro px-4 py-1 text-[15px] font-bold text-teal-oscuro shadow-dura-chica transition-transform duration-150 ease-out hover:-translate-y-0.5 ${ETIQUETAS[i % ETIQUETAS.length]}`}
              >
                {e}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
