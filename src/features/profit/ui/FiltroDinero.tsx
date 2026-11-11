"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";

/** Un filtro en píldora que cambia la pantalla: cada opción trae la dirección a la que lleva, ya armada en el servidor. */
export function FiltroDinero({
  etiqueta,
  valor,
  opciones,
  className = "w-full sm:w-44",
}: {
  etiqueta: string;
  valor: string;
  opciones: { valor: string; etiqueta: string; href: Route }[];
  className?: string;
}) {
  const router = useRouter();
  return (
    <div className={`flex flex-col gap-1 ${className}`} role="group" aria-label={etiqueta}>
      <span aria-hidden="true" className="text-xs font-medium text-texto-2">
        {etiqueta}
      </span>
      <ListaDesplegable
        variante="pildora"
        valor={valor}
        alCambiar={(v) => {
          const destino = opciones.find((o) => o.valor === v);
          if (destino) router.replace(destino.href, { scroll: false });
        }}
        opciones={opciones.map((o) => ({ valor: o.valor, etiqueta: o.etiqueta }))}
        placeholder={etiqueta}
      />
    </div>
  );
}
