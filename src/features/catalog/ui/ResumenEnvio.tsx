import { Icon } from "@/components/ui/Icon";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { OpcionesDeCompra } from "../repositorio";

const t = textos.vitrina.envioResumen;

/** Cuánto cuesta el envío y cuánto tarda, a la vista antes de empezar a comprar: así no hay sorpresas en el checkout. */
export function ResumenEnvio({ opciones, tiempo }: { opciones: OpcionesDeCompra; tiempo: string | null }) {
  const tarifas = Object.values(opciones.tarifas);
  // El precio más bajo entre los departamentos con tarifa y la tarifa por defecto (que cubre al resto)
  const desde = Math.min(opciones.tarifaDefecto, ...(tarifas.length ? tarifas : [opciones.tarifaDefecto]));
  const partes = [desde === 0 ? t.gratis : t.desde(formatearDolares(desde)), tiempo?.trim() || null, opciones.direccionRetiro ? t.retiro : null].filter(Boolean);
  return (
    <p className="flex items-center gap-2 text-sm text-texto-2">
      <Icon nombre="camion" className="size-4 shrink-0 text-teal" />
      <span>{partes.join(" · ")}</span>
    </p>
  );
}
