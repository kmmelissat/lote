import { Estrellas } from "@/components/ui/Estrellas";
import { formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { ResumenResenas } from "../repositorio";

const t = textos.vitrina.resenas;

/** Lo que dicen quienes ya compraron: el promedio arriba y cada reseña como una nota pegada. Sin reseñas no se muestra nada. */
export function Resenas({ resumen }: { resumen: ResumenResenas }) {
  if (!resumen.total) return null;
  return (
    <section aria-labelledby="resenas" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <h2 id="resenas" className="text-xl font-bold">
          {t.titulo}
        </h2>
        <p className="flex items-center gap-2">
          <Estrellas valor={resumen.promedio} />
          <span className="font-bold tabular-nums">{resumen.promedio.toFixed(1)}</span>
          <span className="text-sm text-texto-2">{t.cuantas(resumen.total)}</span>
          <span className="sr-only">{t.lectura(resumen.promedio.toFixed(1), resumen.total)}</span>
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {resumen.resenas.map((r, i) => (
          <li key={`${r.nombre}-${r.creadoEn.getTime()}-${i}`} className="flex flex-col gap-2 rounded-[20px] border border-teal-oscuro/20 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <Estrellas valor={r.estrellas} className="size-4" />
              <span className="sr-only">{t.estrellasDe(r.estrellas)}</span>
              <span className="text-xs text-texto-2">{formatearFecha(r.creadoEn)}</span>
            </div>
            {r.texto && <p className="leading-relaxed">{r.texto}</p>}
            <p className="mt-auto text-sm font-bold">{r.nombre}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
