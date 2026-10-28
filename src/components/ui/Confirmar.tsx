"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { textos } from "@/lib/textos";

export type OpcionesConfirmar = {
  titulo: string;
  texto?: string;
  /** Por defecto "Confirmar". Mejor un verbo claro: "Cancelar pedido", "Quitar acceso". */
  confirmar?: string;
  cancelar?: string;
  /** Para lo que no se puede deshacer o borra algo: el botón sale rojo y el foco empieza en "Cancelar". */
  peligro?: boolean;
};

type Contexto = {
  /** Abre el modal y responde true si la persona confirma, false si cancela, cierra o toca Esc. */
  confirmar: (opciones: OpcionesConfirmar) => Promise<boolean>;
};

const ConfirmarContexto = createContext<Contexto | null>(null);

export function useConfirmar(): Contexto["confirmar"] {
  const contexto = useContext(ConfirmarContexto);
  if (!contexto) throw new Error("useConfirmar hay que usarlo dentro de <ConfirmarProvider>");
  return contexto.confirmar;
}

type Abierto = OpcionesConfirmar & { responder: (si: boolean) => void };

// Usa <dialog>: el navegador ya atrapa el foco, cierra con Esc y devuelve el foco a quien lo abrió (app.md §6.2).
function Modal({ abierto, cerrar }: { abierto: Abierto; cerrar: (si: boolean) => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="confirmar-titulo"
      aria-describedby={abierto.texto ? "confirmar-texto" : undefined}
      // Esc cierra el dialog solo: el evento llega acá y cuenta como "no".
      onCancel={(e) => {
        e.preventDefault();
        cerrar(false);
      }}
      // Tocar el fondo oscuro (el propio dialog, no su contenido) también cancela.
      onClick={(e) => e.target === e.currentTarget && cerrar(false)}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-borde bg-superficie p-0 text-texto shadow-xl backdrop:bg-teal-oscuro/40"
    >
      <div className="flex flex-col gap-2 p-6">
        <h2 id="confirmar-titulo" className="text-lg font-bold">
          {abierto.titulo}
        </h2>
        {abierto.texto && (
          <p id="confirmar-texto" className="text-texto-2">
            {abierto.texto}
          </p>
        )}
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variante="secundario" autoFocus={abierto.peligro} onClick={() => cerrar(false)}>
            {abierto.cancelar ?? textos.comun.cancelar}
          </Button>
          <Button
            type="button"
            variante={abierto.peligro ? "peligro" : "primario"}
            autoFocus={!abierto.peligro}
            onClick={() => cerrar(true)}
          >
            {abierto.confirmar ?? textos.comun.confirmar}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

export function ConfirmarProvider({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState<Abierto | null>(null);

  const confirmar = useCallback(
    (opciones: OpcionesConfirmar) =>
      new Promise<boolean>((resolver) => setAbierto({ ...opciones, responder: resolver })),
    [],
  );

  const cerrar = useCallback(
    (si: boolean) => {
      abierto?.responder(si);
      setAbierto(null);
    },
    [abierto],
  );

  const contexto = useMemo(() => ({ confirmar }), [confirmar]);

  return (
    <ConfirmarContexto.Provider value={contexto}>
      {children}
      {abierto && <Modal abierto={abierto} cerrar={cerrar} />}
    </ConfirmarContexto.Provider>
  );
}
