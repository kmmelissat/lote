"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { textos } from "@/lib/textos";
import { Icon } from "./Icon";

export const estiloCampo = "h-12 w-full rounded-[14px] border-2 border-borde-control bg-superficie px-4 text-base focus:border-teal";

/**
 * Un botón que abre su contenido en una ventana. `boton` recibe cómo abrirla y `children` cómo cerrarla
 * (por ejemplo, para cerrarla sola al guardar).
 */
export function VentanaConBoton({
  id,
  titulo,
  boton,
  children,
}: {
  id: string;
  titulo: string;
  boton: (abrir: () => void) => ReactNode;
  children: (cerrar: () => void) => ReactNode;
}) {
  const ventana = useRef<HTMLDialogElement>(null);
  const [abierta, setAbierta] = useState(false);

  // El estado manda y la ventana lo sigue: así el botón y el contenido nunca tocan la referencia mientras se dibuja
  useEffect(() => {
    const dialogo = ventana.current;
    if (!dialogo) return;
    if (abierta && !dialogo.open) dialogo.showModal();
    if (!abierta && dialogo.open) dialogo.close();
  }, [abierta]);

  const abrir = () => setAbierta(true);
  const cerrar = () => setAbierta(false);
  return (
    <>
      {boton(abrir)}
      <dialog
        ref={ventana}
        aria-labelledby={id}
        className="m-auto max-h-[min(90dvh,calc(100dvh-1.5rem))] w-[min(32rem,calc(100vw-1.5rem))] overflow-y-auto rounded-[24px] border-2 border-teal-oscuro bg-superficie p-0 shadow-dura backdrop:bg-teal-oscuro/40"
        // Escape o el clic afuera también la cierran: el estado se entera
        onClose={cerrar}
        onClick={(e) => e.target === ventana.current && cerrar()}
      >
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id={id} className="text-lg font-bold">
              {titulo}
            </h2>
            <button type="button" aria-label={textos.gestion.pasivos.cerrar} onClick={cerrar} className="flex size-10 items-center justify-center rounded-full hover:bg-teal-fondo">
              <Icon nombre="x" className="size-5" />
            </button>
          </div>
          {children(cerrar)}
        </div>
      </dialog>
    </>
  );
}

/** Los chips de "elegí uno" del panel (como el método de un gasto). */
export function ChipsElegir({
  name,
  opciones,
  valor,
  onCambio,
}: {
  name: string;
  opciones: readonly { valor: string; etiqueta: string }[];
  valor: string;
  onCambio: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map((o) => (
        <label key={o.valor || "ninguno"} className="cursor-pointer">
          <input type="radio" name={name} value={o.valor} checked={valor === o.valor} onChange={() => onCambio(o.valor)} className="peer sr-only" />
          <span className="inline-flex h-10 items-center rounded-full border-2 border-teal-oscuro/30 px-4 text-sm font-bold transition-colors peer-checked:border-teal-oscuro peer-checked:bg-teal-fondo peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal max-md:min-h-11">
            {o.etiqueta}
          </span>
        </label>
      ))}
    </div>
  );
}
