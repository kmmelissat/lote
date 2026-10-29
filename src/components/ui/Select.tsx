"use client";

import { Children, isValidElement, type ChangeEvent, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { ListaDesplegable, type OpcionLista } from "./ListaDesplegable";

type PropsOpcion = { value?: string | number; children?: ReactNode };

/** El texto de lo que hay dentro de una <option>, aunque venga en partes ("San Salvador", " · ", "$3"). */
const textoDe = (hijos: ReactNode): string =>
  Children.toArray(hijos)
    .map((h) => (typeof h === "string" || typeof h === "number" ? String(h) : ""))
    .join("");

/** Las <option> que se le pasan como hijos, convertidas en las opciones de la lista. */
function opcionesDe(hijos: ReactNode): OpcionLista[] {
  return Children.toArray(hijos).flatMap((h) => {
    if (!isValidElement(h) || h.type !== "option") return [];
    const { value, children } = (h as ReactElement<PropsOpcion>).props;
    const etiqueta = textoDe(children);
    return [{ valor: value === undefined ? etiqueta : String(value), etiqueta }];
  });
}

/**
 * Se usa como un <select> (con <option> adentro y `onChange`), pero se dibuja con la lista desplegable de la app:
 * el selector del sistema se ve distinto en cada teléfono y no lleva la marca.
 */
export function Select({ className = "", children, value, defaultValue, onChange, name, id, disabled, required }: ComponentProps<"select">) {
  const opciones = opcionesDe(children);
  return (
    <ListaDesplegable
      id={id}
      name={name}
      opciones={opciones}
      placeholder={opciones[0]?.etiqueta ?? ""}
      // Como un <select>: sin valor inicial, arranca en la primera opción
      valor={value === undefined ? undefined : String(value)}
      valorInicial={defaultValue === undefined ? (opciones[0]?.valor ?? "") : String(defaultValue)}
      alCambiar={onChange ? (v) => onChange({ target: { value: v, name } } as ChangeEvent<HTMLSelectElement>) : undefined}
      disabled={disabled}
      required={required}
      className={className}
    />
  );
}
