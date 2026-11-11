import type { ReactNode } from "react";
import { Icon, type NombreIcono } from "@/components/ui/Icon";

const FICHAS = {
  verde: "bg-ficha-verde",
  celeste: "bg-ficha-celeste",
  rosa: "bg-ficha-rosa",
  amarillo: "bg-ficha-amarillo",
  lila: "bg-ficha-lila",
} as const;

/** Cabecera de las tarjetas del detalle de producto: ficha de ícono de 32 px, título y, a la derecha, un chip o botón. */
export function EncabezadoTarjeta({
  id,
  icono,
  color,
  titulo,
  ayuda,
  derecha,
}: {
  id?: string;
  icono: NombreIcono;
  color: keyof typeof FICHAS;
  titulo: string;
  ayuda?: string;
  derecha?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-[10px] text-teal-oscuro ${FICHAS[color]}`}>
        <Icon nombre={icono} className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id={id} className="text-[15px] font-semibold leading-8">
          {titulo}
        </h2>
        {ayuda && <p className="text-sm text-texto-2">{ayuda}</p>}
      </div>
      {derecha}
    </div>
  );
}
