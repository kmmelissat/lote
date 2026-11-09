import type { ReactNode } from "react";

const TONOS_SELLO = {
  pack: "bg-ficha-amarillo text-chip-texto-amarillo",
  llevas_pagas: "bg-ficha-rosa text-chip-texto-rosa",
  oferta: "bg-ficha-celeste text-chip-texto-celeste",
} as const;
const TONOS_ESTADO = {
  vigente: "border-ficha-verde bg-ficha-verde/60 text-chip-texto-verde",
  programada: "border-ficha-celeste bg-ficha-celeste/60 text-chip-texto-celeste",
  apagada: "border-linea bg-gris-100 text-texto-2",
  vencida: "border-linea bg-gris-100 text-texto-2",
} as const;

/**
 * Una promoción o una oferta en la lista (Punch): el sello con lo que ofrece ("2x1", "$25.00", "−20 %") en una ficha de color,
 * el estado como chip, el nombre y qué cubre. `pie` lleva las acciones (encender, borrar, cancelar).
 */
export function TarjetaPromocion({
  tipo,
  sello,
  estado,
  textoEstado,
  titulo,
  precio,
  cubre,
  fechas,
  pie,
}: {
  tipo: keyof typeof TONOS_SELLO;
  sello: string;
  estado: keyof typeof TONOS_ESTADO;
  textoEstado: string;
  titulo: string;
  /** El precio con la promoción y el de antes, si se puede decir */
  precio?: { ahora: string; antes: string | null; ahorro: string | null };
  cubre?: string;
  fechas: string | null;
  pie: ReactNode;
}) {
  const callada = estado === "apagada" || estado === "vencida";
  return (
    <div className={`flex h-full flex-col gap-3 rounded-3xl border border-linea p-5 shadow-xs ${callada ? "bg-gris-50" : "bg-superficie"}`}>
      <div className="flex items-start gap-3">
        <span
          className={`grid min-h-12 min-w-12 shrink-0 place-items-center rounded-[14px] px-2.5 text-base font-semibold tabular-nums leading-none ${callada ? "bg-gris-100 text-texto-2" : TONOS_SELLO[tipo]}`}
        >
          {sello}
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
          <span className={`rounded-lg border px-2 py-0.5 text-xs font-medium ${TONOS_ESTADO[estado]}`}>{textoEstado}</span>
          <h3 className="line-clamp-2 font-semibold leading-tight text-teal-oscuro">{titulo}</h3>
        </div>
      </div>
      {precio && (
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="text-lg font-semibold tabular-nums text-teal-oscuro">{precio.ahora}</span>
          {precio.antes && <span className="tabular-nums text-texto-2 line-through">{precio.antes}</span>}
          {precio.ahorro && <span className="font-medium text-chip-texto-verde">{precio.ahorro}</span>}
        </p>
      )}
      {cubre && <p className="line-clamp-3 text-sm text-texto-2">{cubre}</p>}
      {fechas && <p className="text-sm text-texto-2">{fechas}</p>}
      <div className="mt-auto flex items-center gap-2 border-t border-linea pt-3">{pie}</div>
    </div>
  );
}
