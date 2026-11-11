import type { ReactNode } from "react";
import { LotitoMas, type PoseLotito } from "./LotitoMas";

/** Cuando no hay nada que mostrar: Punch, el de la landing, se asoma, dice qué pasa y, si se puede, ofrece una acción. */
export function EmptyState({
  titulo,
  texto,
  accion,
  monito = "asoma",
}: {
  titulo?: string;
  texto: string;
  accion?: ReactNode;
  /** `null` para no mostrar a Punch */
  monito?: PoseLotito | null;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[24px] border border-dashed border-borde-control bg-superficie px-6 py-10 text-center">
      {monito && <LotitoMas nombre={monito} className="w-24" />}
      {titulo && <h2 className="text-lg font-bold">{titulo}</h2>}
      <p className="max-w-sm text-texto-2">{texto}</p>
      {accion}
    </div>
  );
}
