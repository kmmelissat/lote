"use client";

import { hoyEnElSalvador } from "@/domain";
import { finDeMes, finDeSemana } from "@/lib/calendario";
import { textos } from "@/lib/textos";

const t = textos.promociones;

const pildora =
  "min-h-11 rounded-[14px] border border-linea bg-superficie px-4 text-sm font-medium text-teal-oscuro transition-colors hover:bg-gris-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-teal/30 md:min-h-10";

/**
 * Atajos para elegir las fechas de un tirón: solo hoy, esta semana (hasta el sábado), este mes. Con `sinFecha`,
 * uno más para dejar las dos fechas vacías.
 */
export function AtajosDeFechas({ alElegir, sinFecha = false }: { alElegir: (desde: string, hasta: string) => void; sinFecha?: boolean }) {
  const hoy = hoyEnElSalvador(new Date());
  const atajos = [
    { clave: "hoy", texto: t.atajoHoy, desde: hoy, hasta: hoy },
    { clave: "semana", texto: t.atajoSemana, desde: hoy, hasta: finDeSemana(hoy) },
    { clave: "mes", texto: t.atajoMes, desde: hoy, hasta: finDeMes(hoy) },
    ...(sinFecha ? [{ clave: "sin", texto: t.atajoSinFecha, desde: "", hasta: "" }] : []),
  ];
  return (
    <div role="group" aria-label={t.atajosFechas} className="flex flex-wrap gap-2">
      {atajos.map((a) => (
        <button key={a.clave} type="button" onClick={() => alElegir(a.desde, a.hasta)} className={pildora}>
          {a.texto}
        </button>
      ))}
    </div>
  );
}
