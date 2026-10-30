"use client";

import { useId, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { limpiarSiNumero, soloNumero } from "@/lib/entrada";
import { textos } from "@/lib/textos";

const t = textos.productos.form;

export const estiloCampo =
  "h-12 w-full rounded-[14px] border-2 border-borde-control bg-superficie px-4 text-base placeholder:text-texto-2/60 focus:border-teal";

/** El chip que marca lo que llenó Lotito, para que se note qué revisar. */
export function ChipLotito() {
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-teal-oscuro bg-limon px-2 py-0.5 align-middle text-xs font-bold text-teal-oscuro">
      <span aria-hidden="true">✦</span>
      {t.lotito.chip}
    </span>
  );
}

/** Etiqueta de un campo: marca los obligatorios con un asterisco y los que puso Lotito con su chip. */
export function Etiqueta({
  htmlFor,
  children,
  requerido,
  lotito,
}: {
  htmlFor: string;
  children: ReactNode;
  requerido?: boolean;
  lotito?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-bold">
      {children}
      {requerido && (
        <span aria-hidden="true" className="ml-0.5 text-error">
          *
        </span>
      )}
      {requerido && <span className="sr-only"> ({t.requerido})</span>}
      {lotito && <ChipLotito />}
    </label>
  );
}

export function MensajeCampo({ id, children }: { id: string; children?: string }) {
  return children ? (
    <p id={id} className="text-sm text-error">
      {children}
    </p>
  ) : null;
}

/** Un campo de texto con etiqueta, ayuda de error y, si hace falta, el brillo de "Lotito está escribiendo". */
export function Campo({
  etiqueta,
  error,
  requerido,
  lotito,
  trabajando,
  className = "",
  onChange,
  ...props
}: {
  etiqueta: string;
  error?: string;
  requerido?: boolean;
  lotito?: boolean;
  trabajando?: boolean;
} & ComponentProps<"input">) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Etiqueta htmlFor={id} requerido={requerido} lotito={lotito}>
        {etiqueta}
      </Etiqueta>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${estiloCampo} ${trabajando ? "animate-pulse bg-limon/40" : ""} ${lotito ? "border-teal-oscuro bg-limon/20" : ""} ${className}`}
        {...props}
        onChange={(e) => {
          e.target.value = limpiarSiNumero(e.target.value, props.inputMode, props.type);
          onChange?.(e);
        }}
      />
      <MensajeCampo id={`${id}-error`}>{error}</MensajeCampo>
    </div>
  );
}

/** Un monto en dólares: el $ va dentro del campo y el teclado del celular es numérico. */
export function CampoDinero({
  etiqueta,
  error,
  requerido,
  onChange,
  ...props
}: { etiqueta: string; error?: string; requerido?: boolean } & Omit<ComponentProps<"input">, "type">) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Etiqueta htmlFor={id} requerido={requerido}>
        {etiqueta}
      </Etiqueta>
      <div className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-texto-2">
          $
        </span>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${estiloCampo} pl-8 tabular-nums`}
          {...props}
          onChange={(e) => {
            e.target.value = soloNumero(e.target.value, true);
            onChange?.(e);
          }}
        />
      </div>
      <MensajeCampo id={`${id}-error`}>{error}</MensajeCampo>
    </div>
  );
}

/** Cantidad con − y +, para no escribir un número de una sola cifra. */
export function Cantidad({
  valor,
  onCambio,
  error,
  name = "cantidad",
}: {
  valor: string;
  onCambio: (v: string) => void;
  error?: string;
  name?: string;
}) {
  const id = useId();
  const n = Number(valor);
  const cambiar = (delta: number) => onCambio(String(Math.max(1, (Number.isInteger(n) ? n : 1) + delta)));
  return (
    <div className="flex flex-col gap-1.5">
      <Etiqueta htmlFor={id}>{t.cantidad}</Etiqueta>
      <div className="flex h-12 items-center rounded-[14px] border-2 border-borde-control bg-superficie">
        <button
          type="button"
          onClick={() => cambiar(-1)}
          disabled={!(n > 1)}
          aria-label={t.cantidadMenos}
          className="flex h-full w-12 items-center justify-center rounded-l-xl text-xl font-bold hover:bg-teal-fondo disabled:opacity-30"
        >
          −
        </button>
        <input
          id={id}
          name={name}
          inputMode="numeric"
          value={valor}
          onChange={(e) => onCambio(soloNumero(e.target.value, false))}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-center text-base font-bold tabular-nums outline-none"
        />
        <button
          type="button"
          onClick={() => cambiar(1)}
          aria-label={t.cantidadMas}
          className="flex h-full w-12 items-center justify-center rounded-r-xl text-xl font-bold hover:bg-teal-fondo"
        >
          +
        </button>
      </div>
      <MensajeCampo id={`${id}-error`}>{error}</MensajeCampo>
    </div>
  );
}

/** Un bloque del formulario con su título y su ayuda, siempre a la vista. */
export function Seccion({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 rounded-[20px] border-2 border-teal-oscuro/15 bg-white p-4">
      <div className="flex flex-col">
        <h2 id={id} className="font-bold">
          {titulo}
        </h2>
        {ayuda && <p className="text-sm text-texto-2">{ayuda}</p>}
      </div>
      {children}
    </section>
  );
}

/** Enter pasa al campo siguiente en vez de guardar a medias; ⌘ o Ctrl + Enter guarda. Va en el onKeyDown del formulario. */
export function atajosDeFormulario(ev: KeyboardEvent<HTMLFormElement>) {
  if (ev.key !== "Enter") return;
  const formulario = ev.currentTarget;
  const destino = ev.target as HTMLElement;
  if (ev.metaKey || ev.ctrlKey) {
    ev.preventDefault();
    formulario.requestSubmit();
  } else if (destino.tagName === "INPUT" && (destino as HTMLInputElement).type !== "checkbox") {
    ev.preventDefault();
    const campos = [
      ...formulario.querySelectorAll<HTMLElement>("input:not([type=hidden]):not([type=file]), textarea, select"),
    ].filter((c) => c.offsetParent !== null && !c.closest("[inert]"));
    campos[campos.indexOf(destino) + 1]?.focus();
  }
}
