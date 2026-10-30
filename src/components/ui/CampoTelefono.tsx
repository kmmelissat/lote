"use client";

import { useId, useState } from "react";
import { digitosLocales, telefonoElSalvador } from "@/domain";

const inputPanel =
  "h-12 min-w-0 flex-1 rounded-r-[14px] border-2 border-borde-control bg-superficie px-4 text-base tabular-nums focus:border-teal";
const inputVitrina =
  "h-12 min-w-0 flex-1 rounded-r-[14px] border-2 border-borde-control bg-superficie px-4 text-base tabular-nums placeholder:text-texto-2/60 focus:border-teal";

/** WhatsApp de El Salvador: el +503 va fijo y el campo solo acepta los 8 números. */
export function CampoTelefono({
  etiqueta,
  name = "telefono",
  defaultValue = "",
  value,
  onChange,
  required,
  placeholder = "7000 1234",
  ayuda,
  variante = "panel",
}: {
  etiqueta: string;
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (digitos: string) => void;
  required?: boolean;
  placeholder?: string;
  ayuda?: string;
  variante?: "panel" | "vitrina";
}) {
  const id = useId();
  const [interno, setInterno] = useState(() => (telefonoElSalvador(defaultValue) ? digitosLocales(defaultValue) : ""));
  const digitos = value !== undefined ? digitosLocales(value) : interno;

  function poner(crudo: string) {
    const limpio = digitosLocales(crudo);
    if (value === undefined) setInterno(limpio);
    onChange?.(limpio);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={variante === "vitrina" ? "text-sm font-bold" : "text-sm font-medium"}>
        {etiqueta}
      </label>
      <span className="flex">
        <span className="flex h-12 items-center rounded-l-[14px] border-2 border-r-0 border-borde-control bg-fondo px-3 font-bold text-texto-2">
          +503
        </span>
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="tel-national"
          autoCorrect="off"
          spellCheck={false}
          required={required}
          pattern="[0-9]{8}"
          title={ayuda}
          value={digitos}
          placeholder={placeholder}
          onBeforeInput={(e) => {
            const ev = e.nativeEvent as InputEvent;
            if (ev.inputType === "insertFromPaste" || ev.inputType === "insertFromDrop") return;
            if (ev.data && /\D/.test(ev.data)) e.preventDefault();
          }}
          onChange={(e) => poner(e.target.value)}
          className={variante === "vitrina" ? inputVitrina : inputPanel}
        />
      </span>
    </div>
  );
}
