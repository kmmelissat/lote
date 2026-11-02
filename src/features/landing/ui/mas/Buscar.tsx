import { Icon } from "@/components/ui/Icon";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { textos } from "@/lib/textos";
import { BotonLanding, contenedor, Mini } from "../comun";
import { Aparece } from "./Aparece";
import { PUNTOS } from "./piezasLanding";

const t = textos.landing;

export function Buscar() {
  const b = t.buscar;
  return (
    <section id="marketplace" className="relative scroll-mt-24 overflow-x-clip bg-mango py-16 md:py-28" aria-labelledby="buscar-mas">
      <div aria-hidden="true" className={`pointer-events-none absolute inset-0 opacity-[0.08] ${PUNTOS}`} />
      <div className={`${contenedor} relative grid grid-cols-1 items-center gap-12 md:grid-cols-[1.2fr_0.8fr]`}>
        <Aparece className="flex flex-col items-start gap-6">
          <span className="-rotate-2 rounded-full border-2 border-teal-oscuro bg-celeste px-4 py-1.5 text-sm font-bold text-teal-oscuro shadow-dura-chica">
            {b.etiqueta}
          </span>
          <h2 id="buscar-mas" className="text-[40px] font-extrabold leading-[1.02] tracking-[-0.03em] text-teal-oscuro md:text-[64px]">
            {b.titulo}
          </h2>
          <p className="max-w-xl text-[18px] font-medium leading-relaxed text-teal-oscuro/85">{b.texto}</p>
          <form
            action="/marketplace"
            role="search"
            className="flex w-full max-w-xl flex-col gap-3 rounded-[28px] border-[3px] border-teal-oscuro bg-white p-3 shadow-[6px_6px_0_0_var(--color-teal-oscuro)] md:p-4"
          >
            <label className="flex h-14 items-center gap-3 rounded-full border-2 border-teal-oscuro bg-crema px-4">
              <Icon nombre="buscar" className="size-5 shrink-0 text-teal-oscuro/70" />
              <span className="sr-only">{b.productos}</span>
              <input
                type="search"
                name="q"
                placeholder={b.placeholder}
                className="h-full min-w-0 flex-1 bg-transparent text-base font-medium text-teal-oscuro outline-none placeholder:text-teal-oscuro/50 md:text-lg"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border-2 border-teal-oscuro bg-limon px-5 text-base font-bold text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none sm:flex-none"
              >
                <Icon nombre="buscar" className="size-4" />
                {b.productos}
              </button>
              <button
                type="submit"
                name="vista"
                value="tiendas"
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border-2 border-teal-oscuro bg-celeste px-5 text-base font-bold text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none sm:flex-none"
              >
                <Icon nombre="tienda" className="size-4" />
                {b.tiendas}
              </button>
            </div>
          </form>
          <BotonLanding href="/marketplace" variante="claro" className="!h-14 !px-8 !text-lg">
            {b.ir}
          </BotonLanding>
        </Aparece>
        <Aparece delay={0.12} className="relative hidden md:block" aria-hidden="true">
          <div className="relative mx-auto flex w-72 flex-col gap-4">
            <div className="-rotate-3 rounded-[28px] border-[3px] border-teal-oscuro bg-white p-4 shadow-[8px_8px_0_0_var(--color-teal-oscuro)]">
              <div className="flex items-center gap-3">
                <Mini src="/landing/chaqueta.webp" />
                <span className="min-w-0">
                  <span className="block truncate font-extrabold">Chaqueta negra M</span>
                  <span className="text-sm text-texto-2">$25.00 · Velvet Cases</span>
                </span>
              </div>
            </div>
            <div className="ml-8 rotate-2 rounded-[28px] border-[3px] border-teal-oscuro bg-white p-4 shadow-[8px_8px_0_0_var(--color-teal-oscuro)]">
              <div className="flex items-center gap-3">
                <Mini src="/landing/disco.webp" />
                <span className="min-w-0">
                  <span className="block truncate font-extrabold">CD Michael Jackson</span>
                  <span className="text-sm text-texto-2">$33.50 · MG Vinyls</span>
                </span>
              </div>
            </div>
            <div className="-ml-2 -rotate-2 rounded-[28px] border-[3px] border-teal-oscuro bg-limon p-4 shadow-[8px_8px_0_0_var(--color-teal-oscuro)]">
              <div className="flex items-center gap-3">
                <Mini src="/landing/llaveros.webp" />
                <span className="min-w-0">
                  <span className="block truncate font-extrabold">Llaveros</span>
                  <span className="text-sm text-texto-2">$3.00 · Ternuritos</span>
                </span>
              </div>
            </div>
          </div>
          <LotitoMas nombre="asoma" className="absolute -bottom-4 -right-2 w-32 rotate-6 md:w-40" />
        </Aparece>
      </div>
    </section>
  );
}
