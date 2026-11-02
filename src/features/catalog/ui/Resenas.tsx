import { Estrellas } from "@/components/ui/Estrellas";
import { formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { ResumenResenas } from "../repositorio";

const t = textos.vitrina.resenas;

/**
 * Lo que dicen quienes ya compraron: a la izquierda el promedio con cuántas reseñas dieron cada cantidad de estrellas, a la
 * derecha cada reseña en su tarjeta. El desglose solo sale cuando están todas cargadas (la ficha trae las últimas 20):
 * con más, sería una cuenta a medias. Sin reseñas no se muestra nada.
 */
export function Resenas({ resumen }: { resumen: ResumenResenas }) {
  if (!resumen.total) return null;
  const completo = resumen.resenas.length === resumen.total;
  const por = (n: number) => resumen.resenas.filter((r) => r.estrellas === n).length;
  return (
    <section aria-labelledby="resenas" className="flex flex-col gap-4">
      <h2 id="resenas" className="font-logo text-2xl font-semibold leading-tight">
        {t.titulo}
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[13rem_1fr] md:gap-8">
        <div className="flex flex-col gap-1.5">
          <p className="font-logo text-6xl font-semibold leading-none tabular-nums text-teal">{resumen.promedio.toFixed(1)}</p>
          <Estrellas valor={resumen.promedio} />
          <p className="text-sm text-texto-2">{t.cuantas(resumen.total)}</p>
          <span className="sr-only">{t.lectura(resumen.promedio.toFixed(1), resumen.total)}</span>
          {completo && (
            <ul aria-hidden="true" className="mt-2 flex flex-col gap-1 text-xs text-texto-2">
              {[5, 4, 3, 2, 1].map((n) => (
                <li key={n} className="grid grid-cols-[0.75rem_1fr] items-center gap-2">
                  <span className="tabular-nums">{n}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-borde">
                    <span className="block h-full rounded-full bg-accion" style={{ width: `${(por(n) / resumen.total) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {resumen.resenas.map((r, i) => (
            <li
              key={`${r.nombre}-${r.creadoEn.getTime()}-${i}`}
              className={`flex flex-col gap-2 rounded-[22px] border-2 border-teal-oscuro p-5 ${i % 2 === 0 ? "bg-white" : "bg-crema"}`}
            >
              <Estrellas valor={r.estrellas} className="size-4" />
              <span className="sr-only">{t.estrellasDe(r.estrellas)}</span>
              {r.texto && <p className="leading-relaxed">{r.texto}</p>}
              <p className="mt-auto flex items-center gap-2.5 pt-1 text-sm font-bold">
                <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-teal-fondo font-bold text-teal">
                  {r.nombre.trim().charAt(0).toUpperCase() || "?"}
                </span>
                <span className="min-w-0 truncate">
                  {r.nombre} <span className="font-medium text-texto-2">· {formatearFecha(r.creadoEn)}</span>
                </span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
