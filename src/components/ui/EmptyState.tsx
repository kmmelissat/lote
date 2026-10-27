import type { ReactNode } from "react";

export function EmptyState({
  titulo,
  texto,
  accion,
}: {
  titulo?: string;
  texto: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-tarjeta border border-dashed border-borde bg-teal-fondo/40 px-6 py-12 text-center">
      {titulo && <h2 className="text-lg font-bold">{titulo}</h2>}
      <p className="max-w-sm text-texto-2">{texto}</p>
      {accion}
    </div>
  );
}
