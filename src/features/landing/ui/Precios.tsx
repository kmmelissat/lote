import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { BotonLanding, contenedor, parrafo, tituloSeccion } from "./comun";

const t = textos.landing.precios;

function Lista({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((l) => (
        <li key={l} className="flex gap-2.5 text-[17px]">
          <Icon nombre="check" className="mt-0.5 size-5 shrink-0 text-teal" strokeWidth={2.5} />
          {l}
        </li>
      ))}
    </ul>
  );
}

export function Precios() {
  return (
    <section id="precios" className="scroll-mt-16 bg-superficie py-12 md:py-24" aria-labelledby="precios-titulo">
      <div className={`${contenedor} revelar flex flex-col gap-12`}>
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 id="precios-titulo" className={tituloSeccion}>
            {t.titulo}
          </h2>
          <p className={parrafo}>{t.intro}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <article className="relative flex flex-col gap-6 rounded-[28px] border-2 border-teal-oscuro bg-superficie p-7 shadow-dura">
            <span className="absolute -top-4 left-6 -rotate-2 rounded-full border-2 border-teal-oscuro bg-mango px-4 py-1 text-sm font-bold text-teal-oscuro">
              {t.recomendado}
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold">{t.gratis.nombre}</h3>
              <p className="text-[56px] font-bold leading-none tracking-tight text-teal-oscuro">{t.gratis.precio}</p>
              <p className={`${parrafo} mt-2`}>{t.gratis.texto}</p>
            </div>
            <Lista items={t.gratis.lista} />
            <p className="text-sm text-teal-oscuro/70">{t.gratis.nota}</p>
            <BotonLanding href="/login" className="mt-auto">
              {textos.landing.empezar}
            </BotonLanding>
          </article>

          <article className="relative flex flex-col gap-6 rounded-[28px] border-2 border-dashed border-teal-oscuro/40 bg-fondo p-7">
            <span className="absolute -top-4 left-6 flex items-center gap-1.5 rounded-full border-2 border-teal-oscuro/40 bg-superficie px-4 py-1 text-sm font-bold text-teal-oscuro/80">
              <Icon nombre="candado" className="size-4" />
              {t.proximamente}
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-teal-oscuro/80">{t.pago.nombre}</h3>
              <p className="text-[34px] font-bold leading-tight tracking-tight text-teal-oscuro/80">{t.pago.precio}</p>
              <p className={`${parrafo} mt-2`}>{t.pago.texto}</p>
            </div>
            <Lista items={t.pago.lista} />
            <p className="mt-auto text-sm text-teal-oscuro/70">{t.pago.nota}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
