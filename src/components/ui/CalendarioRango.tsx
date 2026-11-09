"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["L", "M", "M", "J", "V", "S", "D"];

const fecha = (a: number, m: number, d: number) => new Date(Date.UTC(a, m, d)).toISOString().slice(0, 10);

/**
 * Un calendario para elegir un rango de días: se toca el primero y el último (en cualquier orden).
 * Las fechas son AAAA-MM-DD. Los días después de `max` no se pueden tocar. La semana empieza en lunes.
 */
export function CalendarioRango({
  desde,
  hasta,
  max,
  alElegir,
}: {
  desde: string;
  hasta: string;
  max: string;
  alElegir: (desde: string, hasta: string) => void;
}) {
  const [vista, setVista] = useState(() => ({ a: Number(hasta.slice(0, 4)), m: Number(hasta.slice(5, 7)) - 1 }));
  // El primer toque queda esperando al segundo
  const [inicio, setInicio] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);

  const primerDia = (new Date(Date.UTC(vista.a, vista.m, 1)).getUTCDay() + 6) % 7;
  const diasDelMes = new Date(Date.UTC(vista.a, vista.m + 1, 0)).getUTCDate();
  const celdas = [...Array.from({ length: primerDia }, () => null), ...Array.from({ length: diasDelMes }, (_, i) => fecha(vista.a, vista.m, i + 1))];
  const mover = (n: number) => setVista((v) => ({ a: v.a + Math.floor((v.m + n) / 12), m: (v.m + n + 12) % 12 }));
  const hayProximo = fecha(vista.a, vista.m + 1, 1) <= max;

  // El rango que se pinta: el elegido, o el que se está armando con el mouse
  const extremo = inicio ? (sobre ?? inicio) : null;
  const a = inicio ? (inicio < extremo! ? inicio : extremo!) : desde;
  const b = inicio ? (inicio < extremo! ? extremo! : inicio) : hasta;

  const tocar = (f: string) => {
    if (!inicio) return setInicio(f);
    const [x, y] = f < inicio ? [f, inicio] : [inicio, f];
    setInicio(null);
    setSobre(null);
    alElegir(x, y);
  };

  return (
    <div className="w-full select-none">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => mover(-1)} aria-label="Mes anterior" className="flex size-9 items-center justify-center rounded-[12px] text-texto-2 hover:bg-gris-50 hover:text-teal-oscuro">
          <Icon nombre="flecha" className="size-4 rotate-90" />
        </button>
        <p className="text-sm font-semibold capitalize" aria-live="polite">
          {MESES[vista.m]} {vista.a}
        </p>
        <button
          type="button"
          onClick={() => mover(1)}
          disabled={!hayProximo}
          aria-label="Mes siguiente"
          className="flex size-9 items-center justify-center rounded-[12px] text-texto-2 hover:bg-gris-50 hover:text-teal-oscuro disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Icon nombre="flecha" className="size-4 -rotate-90" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-texto-2">
        {DIAS.map((d, i) => (
          <span key={i} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7" onMouseLeave={() => setSobre(null)}>
        {celdas.map((f, i) => {
          if (!f) return <span key={`v${i}`} />;
          const futuro = f > max;
          const extremoDia = f === a || f === b;
          const dentro = f >= a && f <= b;
          return (
            <span key={f} className={`flex justify-center py-0.5 ${dentro ? `bg-ficha-celeste/50 ${f === a ? "rounded-l-full" : ""} ${f === b ? "rounded-r-full" : ""}` : ""}`}>
              <button
                type="button"
                disabled={futuro}
                onClick={() => tocar(f)}
                onMouseEnter={() => setSobre(f)}
                aria-pressed={extremoDia}
                aria-label={f}
                className={`size-9 rounded-full text-sm tabular-nums ${
                  extremoDia ? "bg-teal-oscuro font-semibold text-white" : futuro ? "text-texto-2/40" : "hover:bg-gris-100"
                } ${f === max && !extremoDia ? "font-semibold text-teal-oscuro" : ""}`}
              >
                {Number(f.slice(8, 10))}
              </button>
            </span>
          );
        })}
      </div>
      <p className="mt-2 min-h-5 text-center text-xs text-texto-2">{inicio ? "Tocá el último día" : "Tocá el primer y el último día"}</p>
    </div>
  );
}
