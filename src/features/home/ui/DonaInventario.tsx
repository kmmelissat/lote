"use client";

import Link from "next/link";
import { Pie, PieChart, ResponsiveContainer } from "recharts";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { textos } from "@/lib/textos";
import type { Unidades } from "@/features/products/repositorio";

const t = textos.inicio;

// Cada tramo lleva su color y también su nombre y su número en la lista: nada se dice solo con color.
const tramos = [
  { clave: "disponibles", estado: "disponible", etiqueta: t.disponibles, relleno: "var(--color-teal)", punto: "bg-teal" },
  { clave: "apartadas", estado: "apartado", etiqueta: t.apartados, relleno: "var(--color-ambar)", punto: "bg-ambar" },
  { clave: "vendidas", estado: "vendido", etiqueta: t.vendidos, relleno: "var(--color-borde-control)", punto: "bg-borde-control" },
] as const;

export function DonaInventario({ unidades }: { unidades: Unidades }) {
  const total = unidades.disponibles + unidades.apartadas + unidades.vendidas;
  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="font-bold">{t.inventarioTitulo}</h2>
        <p className="text-sm text-texto-2">{t.inventarioTexto}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative size-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={tramos.map((x) => ({ name: x.etiqueta, value: unidades[x.clave], fill: x.relleno }))}
                dataKey="value"
                innerRadius="68%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                stroke="none"
                isAnimationActive={false}
              />
            </PieChart>
          </ResponsiveContainer>
          <p className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
            <span className="text-2xl font-bold">{total}</span>
            <span className="text-xs text-texto-2">{t.inventarioUnidades}</span>
          </p>
        </div>

        <ul className="flex min-w-36 flex-1 flex-col gap-2">
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
