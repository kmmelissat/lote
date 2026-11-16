import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { textos } from "@/lib/textos";
import { contenedor, Mini } from "../comun";
import { Aparece, ApareceGrupo, ApareceItem } from "./Aparece";

const t = textos.landing;

const GIRO_PASO = ["", "", ""] as const;
const FONDO_PASO = ["bg-ficha-celeste", "bg-ficha-rosa", "bg-ficha-amarillo"] as const;

function MockPaso({ n }: { n: 0 | 1 | 2 }) {
  const p = t.como.pasos;
  if (n === 0) {
    const s = p[0];
    return (
      <div className="relative flex flex-col gap-3 rounded-[20px] border border-linea bg-white p-4 pt-6">
        <p className="max-w-[92%] self-end rounded-2xl rounded-br-md bg-teal px-3 py-2 text-sm font-bold text-white">{s.chat}</p>
        <Icon nombre="flecha" className="size-5 self-center text-teal-oscuro" />
        <div className="flex items-center gap-3 rounded-2xl border border-linea bg-gris-50 p-3">
          <Mini src="/landing/chaqueta.webp" />
          <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <span className="block w-full truncate font-bold">{s.ficha.nombre}</span>
            <span className="text-sm text-texto-2">
              {s.ficha.precio} · {s.ficha.costo}
            </span>
            <StatusChip publico estado="disponible" />
          </span>
        </div>
      </div>
    );
  }
  if (n === 1) {
    const s = p[1];
    return (
      <div className="flex flex-col gap-3 rounded-[20px] border border-linea bg-white p-4">
        <p className="truncate rounded-full border border-linea bg-gris-50 px-4 py-2 text-sm font-bold">{s.enlace}</p>
        <div className="flex items-center gap-3 rounded-2xl border border-linea bg-gris-50 p-3">
          <Mini src="/landing/disco.webp" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold">CD Michael Jackson</span>
            <span className="text-sm text-texto-2">$33.50</span>
          </span>
          <span className="rounded-full border border-linea bg-ficha-amarillo px-3 py-1 text-sm font-bold">{s.boton}</span>
        </div>
      </div>
    );
  }
  const s = p[2];
  return (
    <div className="relative flex flex-col gap-4 rounded-[20px] border border-linea bg-white p-4 pt-6">
      <div className="flex items-center justify-between">
        <span className="font-bold">{s.pedido}</span>
        <span className="rounded-full border border-linea bg-ficha-amarillo px-3 py-0.5 text-sm font-bold">{s.ganancia}</span>
      </div>
      <ol className="flex items-center">
        {s.pasos.map((nombre, i) => (
          <li key={nombre} className="flex flex-1 flex-col items-center gap-1 text-center text-sm last:flex-none">
            <div className="flex w-full items-center">
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border border-linea ${i < 2 ? "bg-teal text-white" : "bg-white"}`}>
                {i < 2 && <Icon nombre="check" className="size-4" />}
              </span>
              {i < s.pasos.length - 1 && <span className="h-0.5 flex-1 bg-teal-oscuro" />}
            </div>
            <span className="font-bold">{nombre}</span>
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-linea bg-ficha-amarillo px-3 py-2 text-sm font-bold">
        <span>{t.funciones.balance.total[0]}</span>
        <span className="tabular-nums">{t.funciones.balance.total[1]}</span>
      </div>
    </div>
  );
}

export function Pasos() {
  const c = t.como;
  return (
    <section id="como" className="relative scroll-mt-24 overflow-x-clip bg-gris-50 py-16 md:py-28" aria-labelledby="como-mas">
      <div className={`${contenedor} relative flex flex-col gap-12`}>
        <Aparece className="flex items-end justify-between gap-4">
          <h2 id="como-mas" className="font-logo text-[36px] font-semibold leading-[1.1] text-teal-oscuro md:text-[52px]">
            {c.titulo}
          </h2>
        </Aparece>
        <ApareceGrupo as="ol" className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          <svg aria-hidden="true" viewBox="0 0 1000 60" preserveAspectRatio="none" className="absolute left-[10%] top-6 hidden h-10 w-[64%] md:block">
            <path
              d="M0 30 C 120 -12, 260 72, 500 30 S 860 -12, 1000 30"
              fill="none"
              stroke="#c5d3d3"
              strokeWidth="3"
              strokeDasharray="2 12"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {c.pasos.map((p, n) => (
            <ApareceItem key={p.titulo} className={`relative flex flex-col gap-4 rounded-[28px] border border-linea p-5 shadow-xs ${FONDO_PASO[n]} ${GIRO_PASO[n]}`}>
              <span className={`flex size-12 items-center justify-center rounded-full border border-linea text-xl font-bold text-teal-oscuro shadow-xs ${["bg-ficha-amarillo", "bg-ficha-rosa", "bg-ficha-amarillo"][n]}`}>
                {n + 1}
              </span>
              <h3 className="text-[24px] font-bold leading-tight text-teal-oscuro">{p.titulo}</h3>
              <p className="text-[16px] font-medium leading-relaxed text-teal-oscuro/85">{p.texto}</p>
              <div className="mt-auto" aria-hidden="true">
                <MockPaso n={n as 0 | 1 | 2} />
              </div>
            </ApareceItem>
          ))}
        </ApareceGrupo>
      </div>
    </section>
  );
}
