"use client";

import { useId, useState } from "react";
import { Icon } from "./Icon";

const NOMBRES = ["", "Malo", "Regular", "Bien", "Muy bien", "Excelente"];

/** Elegir de 1 a 5 estrellas. Son radios de verdad: se manejan con flechas y los lectores de pantalla los leen. */
export function EstrellasInput({ name = "estrellas", etiqueta, valorInicial = 0 }: { name?: string; etiqueta: string; valorInicial?: number }) {
  const id = useId();
  const [valor, setValor] = useState(valorInicial);
  const [encima, setEncima] = useState(0);
  const mostrado = encima || valor;
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-bold">{etiqueta}</legend>
      <div className="flex items-center gap-1" onMouseLeave={() => setEncima(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer" onMouseEnter={() => setEncima(n)}>
            <input
              type="radio"
              name={name}
              value={n}
              required
              checked={valor === n}
              onChange={() => setValor(n)}
              id={`${id}-${n}`}
              className="peer sr-only"
            />
            <span className="sr-only">
              {n} de 5: {NOMBRES[n]}
            </span>
            <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal">
              <Icon nombre="estrella" className={`size-8 ${n <= mostrado ? "fill-mango text-teal-oscuro" : "text-teal-oscuro/30"}`} strokeWidth={1.5} />
            </span>
          </label>
        ))}
        <span aria-live="polite" className="ml-2 text-sm text-texto-2">
          {valor ? NOMBRES[valor] : ""}
        </span>
      </div>
    </fieldset>
  );
}
