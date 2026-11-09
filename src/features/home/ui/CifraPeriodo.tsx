import type { Route } from "next";
import Link from "next/link";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { FichaIcono, Panel } from "./Panel";

export type Cambio = { texto: string; corto: string; sube: boolean | null };

/** Lo bueno en verde y lo malo en rojo; lo que no cambió, gris. En los gastos, que suban es lo malo (`masEsMalo`). */
function tono(cambio: Cambio, masEsMalo: boolean): string {
  if (cambio.sube === null) return "bg-gris-100 text-chip-texto-neutro";
  return cambio.sube !== masEsMalo ? "bg-chip-verde text-chip-texto-verde" : "bg-chip-rojo text-chip-texto-rojo";
}

/** Una cifra del periodo: ícono en círculo, el número grande, el cambio contra el periodo anterior y a dónde ver más. */
export function CifraPeriodo<T extends string>({
  etiqueta,
  valor,
  cambio,
  masEsMalo = false,
  href,
  icono,
  color,
}: {
  etiqueta: string;
  valor: string | number;
  cambio: Cambio | null;
  masEsMalo?: boolean;
  href: Route<T>;
  icono: NombreIcono;
  color: string;
}) {
  return (
    <Panel className="flex flex-col gap-2 p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-texto-2">{etiqueta}</h3>
        <FichaIcono color={`${color} !rounded-full !size-9`}>
          <Icon nombre={icono} className="size-4" />
        </FichaIcono>
      </div>
      <p className="text-3xl font-semibold tabular-nums tracking-tight">{valor}</p>
      <div className="flex min-h-6 items-center justify-between gap-2">
        {cambio ? (
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ring-teal-oscuro/10 ${tono(cambio, masEsMalo)}`} title={cambio.texto}>
            {cambio.sube !== null && <Icon nombre="flecha" className={`size-3 ${cambio.sube ? "rotate-180" : ""}`} />}
            {cambio.corto}
            <span className="sr-only"> ({cambio.texto})</span>
          </span>
        ) : (
          <span />
        )}
        <Link href={href} className="text-xs text-texto-2 hover:text-teal-oscuro">
          Ver detalle ↗
        </Link>
      </div>
    </Panel>
  );
}
