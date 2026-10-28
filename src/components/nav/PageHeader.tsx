import type { ReactNode } from "react";

export function PageHeader({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold">{titulo}</h1>
        <p className="text-texto-2">{descripcion}</p>
      </div>
      {accion}
    </header>
  );
}
