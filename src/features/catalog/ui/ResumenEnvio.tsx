import { Icon } from "@/components/ui/Icon";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { OpcionesDeCompra } from "../repositorio";

const t = textos.vitrina.envioResumen;

/** Lo que cuesta el envío ("Envío gratis", "Envío desde $3.00") y lo que tarda, si la tienda lo dijo. */
export function partesEnvio(opciones: OpcionesDeCompra, tiempo: string | null): string[] {
  const tarifas = Object.values(opciones.tarifas);
  // El precio más bajo entre los departamentos con tarifa y la tarifa por defecto (que cubre al resto)
  const desde = Math.min(opciones.tarifaDefecto, ...(tarifas.length ? tarifas : [opciones.tarifaDefecto]));
  return [desde === 0 ? t.gratis : t.desde(formatearDolares(desde)), tiempo?.trim() || ""].filter(Boolean);
}

/** Cuánto cuesta el envío y cuánto tarda, a la vista antes de empezar a comprar: así no hay sorpresas en el checkout. */
export function ResumenEnvio({ opciones, tiempo }: { opciones: OpcionesDeCompra; tiempo: string | null }) {
  const partes = [...partesEnvio(opciones, tiempo), opciones.direccionRetiro ? t.retiro : ""].filter(Boolean);
  return (
    <p className="flex items-center gap-2 text-sm text-texto-2">
      <Icon nombre="camion" className="size-4 shrink-0 text-teal" />
      <span>{partes.join(" · ")}</span>
    </p>
  );
}
