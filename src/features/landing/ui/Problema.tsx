import { Gorila } from "@/components/ui/Gorila";
import { textos } from "@/lib/textos";
import { contenedor, Nota } from "./comun";

const t = textos.landing.problema;

// Cada nota va de un color y un poco torcida, como pegadas a mano
const NOTAS = ["-rotate-2 bg-limon text-teal-oscuro", "rotate-1 bg-rosa text-teal-oscuro", "-rotate-1 bg-crema text-teal-oscuro"];

export function Problema() {
  return (
    <section className="relative overflow-hidden bg-teal-oscuro py-12 text-white md:py-24" aria-labelledby="problema">
      <Gorila className="pointer-events-none absolute -right-16 top-8 size-72 -rotate-12 text-white/5 md:size-[26rem]" />
      <div className={`${contenedor} revelar relative flex flex-col gap-12`}>
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 id="problema" className="text-[34px] font-bold leading-[1.08] tracking-tight md:text-[48px]">
            {t.titulo}
          </h2>
          <p className="text-[17px] leading-relaxed text-white/80 md:text-[18px]">{t.intro}</p>
        </div>
        {/* En el celular se desliza de lado (más corto que tres bloques en fila); en pantalla ancha son tres columnas */}
        <ul
          tabIndex={0}
          aria-label={t.carrusel}
          className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 py-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 md:py-0 [&::-webkit-scrollbar]:hidden"
        >
          {t.items.map((i, n) => (
            <li key={i.titulo} className="flex w-[82%] shrink-0 snap-center flex-col gap-4 md:w-auto">
              <p className="text-[68px] font-bold leading-none tracking-tighter text-mango md:text-[104px]">{i.dato}</p>
              <h3 className="text-[22px] font-bold leading-tight">{i.titulo}</h3>
              <p className="text-[17px] leading-relaxed text-white/80">{i.texto}</p>
              <div className="mt-auto pt-2">
                <Nota texto={i.cita} quien={i.quien} clase={NOTAS[n]} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
