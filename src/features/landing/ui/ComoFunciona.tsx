import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { textos } from "@/lib/textos";
import { contenedor, Miniatura, parrafo, tituloSeccion } from "./comun";

const t = textos.landing.como;

const marco = "rounded-[24px] border-2 border-teal-oscuro bg-superficie p-4 shadow-dura-chica";

function Paso1() {
  const p = t.pasos[0];
  return (
    <div className={`${marco} flex flex-col gap-3`}>
      <p className="max-w-[90%] self-end rounded-2xl rounded-br-md bg-teal px-4 py-2 text-white">{p.chat}</p>
      <Icon nombre="flecha" className="size-5 self-center text-teal-oscuro" />
      <div className="flex items-center gap-3 rounded-2xl border-2 border-borde p-3">
        <Miniatura icono="camisa" tono="rosa" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{p.ficha.nombre}</span>
          <span className="text-sm text-texto-2">
            {p.ficha.precio} · {p.ficha.costo}
          </span>
        </span>
        <StatusChip estado="disponible" />
      </div>
    </div>
  );
}

function Paso2() {
  const p = t.pasos[1];
  return (
    <div className={`${marco} flex flex-col gap-3`}>
      <p className="truncate rounded-full border-2 border-borde bg-fondo px-4 py-2 text-sm font-medium">{p.enlace}</p>
      <div className="flex items-center gap-3 rounded-2xl border-2 border-borde p-3">
        <Miniatura icono="disco" tono="limon" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">CD Michael Jackson</span>
          <span className="text-sm text-texto-2">$33.50</span>
        </span>
        <span className="rounded-full border-2 border-teal-oscuro bg-mango px-4 py-1 text-sm font-bold text-teal-oscuro">{p.boton}</span>
      </div>
    </div>
  );
}

function Paso3() {
  const p = t.pasos[2];
  return (
    <div className={`${marco} flex flex-col gap-4`}>
      <div className="flex items-center justify-between">
        <span className="font-bold">{p.pedido}</span>
        <span className="rounded-full border-2 border-teal-oscuro bg-limon px-3 py-0.5 text-sm font-bold">{p.ganancia}</span>
      </div>
      <ol className="flex items-center">
        {p.pasos.map((nombre, i) => (
          <li key={nombre} className="flex flex-1 flex-col items-center gap-1 text-center text-sm last:flex-none">
            <div className="flex w-full items-center">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro ${
                  i < 2 ? "bg-teal text-white" : "bg-superficie"
                }`}
              >
                {i < 2 && <Icon nombre="check" className="size-4" />}
              </span>
              {i < p.pasos.length - 1 && <span className="h-0.5 flex-1 bg-teal-oscuro" />}
            </div>
            <span className="font-medium">{nombre}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const visuales = [<Paso1 key="1" />, <Paso2 key="2" />, <Paso3 key="3" />];

export function ComoFunciona() {
  return (
    <section id="como" className="scroll-mt-16 bg-crema py-16 md:py-24" aria-labelledby="como-titulo">
      <div className={`${contenedor} revelar flex flex-col gap-12`}>
        <h2 id="como-titulo" className={tituloSeccion}>
          {t.titulo}
        </h2>
        <ol className="relative grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          {/* La línea punteada que une los tres números */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1000 60"
            preserveAspectRatio="none"
            className="absolute left-[8%] top-0 hidden h-12 w-[66%] md:block"
          >
            <path
              d="M0 30 C 120 -10, 260 70, 500 30 S 860 -10, 1000 30"
              fill="none"
              stroke="var(--color-teal-oscuro)"
              strokeWidth="3"
              strokeDasharray="2 12"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {t.pasos.map((p, n) => (
            <li key={p.titulo} className="relative flex flex-col gap-4">
              <span className="flex size-12 items-center justify-center rounded-full border-2 border-teal-oscuro bg-mango text-xl font-bold text-teal-oscuro shadow-dura-chica">
                {n + 1}
              </span>
              <h3 className="text-[24px] font-bold leading-tight text-teal-oscuro">{p.titulo}</h3>
              <p className={parrafo}>{p.texto}</p>
              <div className="mt-auto" aria-hidden="true">
                {visuales[n]}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
