import type { ReactNode } from "react";
import { Monito, type MONITOS } from "./Monito";

/** Cuando no hay nada que mostrar: el monito se asoma, dice qué pasa y, si se puede, ofrece una acción. */
export function EmptyState({
  titulo,
  texto,
  accion,
  monito = "asoma",
}: {
  titulo?: string;
  texto: string;
  accion?: ReactNode;
  monito?: keyof typeof MONITOS;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[24px] border-2 border-dashed border-teal-oscuro bg-crema px-6 py-10 text-center">
      <Monito nombre={monito} className="w-20 text-rosa" />
      {titulo && <h2 className="text-lg font-bold">{titulo}</h2>}
      <p className="max-w-sm text-texto-2">{texto}</p>
      {accion}
    </div>
  );
}
