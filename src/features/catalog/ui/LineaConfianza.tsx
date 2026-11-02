import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import type { OpcionesDeCompra } from "../repositorio";
import { partesEnvio } from "./ResumenEnvio";

const t = textos.vitrina.compra;

/** Lo que da confianza junto al botón, en una línea: estrellas, cómo se paga y cuánto cuesta y tarda el envío. */
export function LineaConfianza({
  estrellas,
  opciones,
  tiempo,
}: {
  estrellas: { promedio: number; total: number } | null;
  opciones: OpcionesDeCompra;
  tiempo: string | null;
}) {
  const metodos = opciones.metodos.map((m) => textos.cobro.metodos[m].toLowerCase()).join(", ");
  const envio = [...partesEnvio(opciones, tiempo), opciones.direccionRetiro ? textos.vitrina.envioResumen.retiro : ""].filter(Boolean).join(" · ");
  const filas: { icono: NombreIcono; texto: string }[] = [];
  if (metodos) filas.push({ icono: "banco", texto: t.pagas(metodos) });
  filas.push({ icono: "camion", texto: envio });
  return (
    <ul className="flex flex-col gap-1.5 text-sm text-texto-2">
      {estrellas && (
        <li className="flex items-center gap-2 font-bold text-texto" aria-label={textos.vitrina.tarjeta.calificacion(estrellas.promedio, estrellas.total)}>
          <span aria-hidden="true" className="text-ambar">
            ★
          </span>
          <span>
            {estrellas.promedio.toFixed(1)} <span className="font-medium text-texto-2">({estrellas.total})</span>
          </span>
        </li>
      )}
      {filas.map((f) => (
        <li key={f.icono} className="flex items-center gap-2">
          <Icon nombre={f.icono} className="size-4 shrink-0 text-teal" />
          <span>{f.texto}</span>
        </li>
      ))}
    </ul>
  );
}
