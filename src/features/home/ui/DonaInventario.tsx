import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { textos } from "@/lib/textos";
import type { Unidades } from "@/features/products/repositorio";

const t = textos.inicio;

// Cada tramo lleva su color y también su nombre y su número en la lista: nada se dice solo con color.
const tramos = [
  { clave: "disponibles", estado: "disponible", etiqueta: t.disponibles, color: "text-teal", punto: "bg-teal" },
  { clave: "apartadas", estado: "apartado", etiqueta: t.apartados, color: "text-ambar", punto: "bg-ambar" },
  { clave: "vendidas", estado: "vendido", etiqueta: t.vendidos, color: "text-borde-control", punto: "bg-borde-control" },
] as const;

export function DonaInventario({ unidades }: { unidades: Unidades }) {
  const total = unidades.disponibles + unidades.apartadas + unidades.vendidas;
  // Circunferencia de 100 para que cada tramo mida lo mismo que su porcentaje (radio = 100 / 2π).
  const radio = 100 / (2 * Math.PI);
  // Cada tramo empieza donde terminó el anterior.
  const partes = tramos.map((x) => ({ ...x, parte: (unidades[x.clave] / total) * 100 }));
  const arcos = partes.map((x, i) => ({ ...x, desde: partes.slice(0, i).reduce((suma, y) => suma + y.parte, 0) }));

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold">{t.inventarioTitulo}</h2>
        <p className="text-sm text-texto-2">{t.inventarioTexto}</p>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="relative size-40 shrink-0">
          <svg viewBox="0 0 40 40" role="img" aria-label={tramos.map((x) => `${x.etiqueta}: ${unidades[x.clave]}`).join(", ")} className="size-full -rotate-90">
            <circle cx="20" cy="20" r={radio} fill="none" strokeWidth="5" className="text-gris-fondo" stroke="currentColor" />
            {arcos.map((x) =>
              x.parte > 0 ? (
                <circle
                  key={x.clave}
                  cx="20"
                  cy="20"
                  r={radio}
                  fill="none"
                  strokeWidth="5"
                  stroke="currentColor"
                  className={x.color}
                  strokeDasharray={`${x.parte} ${100 - x.parte}`}
                  strokeDashoffset={-x.desde}
                />
              ) : null,
            )}
          </svg>
          <p className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
            <span className="text-3xl font-bold">{total}</span>
            <span className="text-xs text-texto-2">{t.inventarioUnidades}</span>
          </p>
        </div>

        <ul className="flex min-w-40 flex-1 flex-col gap-3">
          {tramos.map((x) => (
            <li key={x.clave} className="flex items-center gap-3">
              <span aria-hidden="true" className={`size-3 shrink-0 rounded-full ${x.punto}`} />
              <Link href={`/productos?estado=${x.estado}`} className="flex flex-1 items-baseline justify-between gap-2 hover:underline">
                <span>{x.etiqueta}</span>
                <span className="font-bold">{unidades[x.clave]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <ButtonLink href="/productos" variante="secundario" className="self-start">
        {t.verProductos}
      </ButtonLink>
    </Card>
  );
}
