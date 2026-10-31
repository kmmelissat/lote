import type { CategoriaGasto } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

/** Cuánto se fue en cada categoría, de la que más a la que menos, con una barrita. */
export function GastosPorCategoria({ porCategoria }: { porCategoria: Partial<Record<CategoriaGasto, number>> }) {
  const filas = (Object.entries(porCategoria) as [CategoriaGasto, number][]).filter(([, m]) => m > 0).sort((a, b) => b[1] - a[1]);
  if (!filas.length) return null;
  const tope = filas[0][1];
  return (
    <ul className="flex flex-col gap-3">
      {filas.map(([c, monto]) => (
        <li key={c} className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{textos.ganancia.categorias[c]}</p>
            <span aria-hidden="true" className="mt-1 block h-2 overflow-hidden rounded-full bg-fondo">
              <span className="block h-full rounded-full bg-mango" style={{ width: `${(monto / tope) * 100}%` }} />
            </span>
          </div>
          <span className="font-bold tabular-nums">{formatearDolares(monto)}</span>
        </li>
      ))}
    </ul>
  );
}
