import { formatearDolares } from "@/lib/formato";
import type { AhorroPromocion } from "@/domain";

/** Las promociones que se aplicaron a un pedido, una por renglón, con lo que ahorran. Nada si no hay. */
export function LineasPromocion({ ahorros, className = "" }: { ahorros: readonly AhorroPromocion[]; className?: string }) {
  if (!ahorros.length) return null;
  return (
    <ul className={`flex flex-col gap-1 ${className}`}>
      {ahorros.map((a) => (
        <li key={a.promocionId} className="flex justify-between gap-3 text-sm">
          <span className="min-w-0 truncate">{a.nombre}</span>
          <span className="shrink-0 font-medium tabular-nums">−{formatearDolares(a.ahorro)}</span>
        </li>
      ))}
    </ul>
  );
}
