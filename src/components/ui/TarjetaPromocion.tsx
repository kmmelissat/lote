import type { ReactNode } from "react";
import { Card } from "./Card";

const TONOS_SELLO = { pack: "bg-limon", llevas_pagas: "bg-rosa", oferta: "bg-celeste" } as const;
const TONOS_ESTADO = { vigente: "bg-teal-fondo", programada: "bg-perla", apagada: "bg-gris-fondo", vencida: "bg-gris-fondo" } as const;

/**
 * Una promoción o una oferta en la lista: el sello con lo que ofrece ("2x1", "$25.00", "−20 %") pegado como etiqueta, el
 * estado, el nombre y qué cubre. `pie` lleva las acciones (encender, borrar, cancelar).
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
    <Card className={`flex h-full flex-col gap-3 ${callada ? "bg-fondo" : ""}`}>
      <div className="flex items-start gap-3">
        <span
          className={`grid min-h-14 min-w-14 shrink-0 -rotate-3 place-items-center rounded-2xl border-2 border-teal-oscuro px-2 text-lg font-bold tabular-nums leading-none shadow-dura-chica ${callada ? "bg-superficie" : TONOS_SELLO[tipo]}`}
        >
          {sello}
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TONOS_ESTADO[estado]}`}>{textoEstado}</span>
          <h3 className="line-clamp-2 font-bold leading-tight">{titulo}</h3>
        </div>
      </div>
      {precio && (
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="text-base font-bold tabular-nums">{precio.ahora}</span>
          {precio.antes && <span className="tabular-nums text-texto-2 line-through">{precio.antes}</span>}
          {precio.ahorro && <span className="font-medium text-teal">{precio.ahorro}</span>}
        </p>
      )}
      {cubre && <p className="line-clamp-3 text-sm text-texto-2">{cubre}</p>}
      {fechas && <p className="text-sm text-texto-2">{fechas}</p>}
      <div className="mt-auto flex items-center gap-2 border-t border-borde pt-2">{pie}</div>
    </Card>
  );
}
