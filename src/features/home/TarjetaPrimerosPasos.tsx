import Link from "next/link";
import { Gorila } from "@/components/ui/Gorila";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import type { PasoInicial } from "./primerosPasos";
import { TARJETA } from "@/components/ui/tarjeta";

const t = textos.inicio.primerosPasos;

const enlaces: Record<PasoInicial["clave"], string> = {
  producto: "/productos/nuevo",
  pago: "/ajustes/pagos",
  pedido: "/pedidos/nuevo",
};

/** Para un negocio nuevo es lo más grande de Inicio: barra de avance y cada paso como una acción con su botón. */
export function TarjetaPrimerosPasos({ pasos }: { pasos: PasoInicial[] }) {
  const hechos = pasos.filter((p) => p.hecho).length;
  const siguiente = pasos.find((p) => !p.hecho)?.clave;
  return (
    <section
      aria-labelledby="primeros-pasos"
      className={`${TARJETA} relative flex flex-col gap-4 bg-crema`}
    >
      <Gorila className="absolute right-4 top-4 size-16 text-rosa md:size-20" />
      <div className="pr-20 md:pr-24">
        <h2 id="primeros-pasos" className="text-xl font-bold">
          {t.titulo}
        </h2>
        <p className="text-texto-2">{t.subtitulo}</p>
      </div>

      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={pasos.length}
          aria-valuenow={hechos}
          aria-label={t.titulo}
          className="h-3 flex-1 overflow-hidden rounded-full border-2 border-teal-oscuro bg-white"
        >
          <div className="h-full bg-mango transition-[width] duration-500" style={{ width: `${(hechos / pasos.length) * 100}%` }} />
        </div>
        <span className="text-sm font-bold">{t.avance(hechos, pasos.length)}</span>
      </div>

      <ol className="flex flex-col gap-2">
        {pasos.map((p) => (
          <li
            key={p.clave}
            className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-teal-oscuro/15 bg-white px-3 py-3"
          >
            <span
              aria-hidden="true"
              className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro ${
                p.hecho ? "bg-teal text-white" : "bg-white"
              }`}
            >
              {p.hecho && <Icon nombre="check" className="size-4" />}
            </span>
            <span className="flex min-w-0 flex-1 basis-48 flex-col">
              <span className={p.hecho ? "text-texto-2 line-through" : "font-medium"}>
                {t.pasos[p.clave].titulo}
                {p.hecho && <span className="sr-only"> ({t.listo})</span>}
              </span>
              {!p.hecho && <span className="text-sm text-texto-2">{t.pasos[p.clave].texto}</span>}
            </span>
            {!p.hecho && (
              <Link
                href={enlaces[p.clave]}
                className={`inline-flex h-10 max-md:min-h-11 items-center gap-1 rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold text-teal-oscuro transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura-chica ${
                  p.clave === siguiente ? "bg-mango" : "bg-white"
                }`}
              >
                {t.pasos[p.clave].accion}
                <span aria-hidden="true">→</span>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
