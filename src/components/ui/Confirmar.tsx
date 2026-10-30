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

export type OpcionesElegir = OpcionesConfirmar & {
  /** Lo que se puede elegir; la primera viene marcada. */
  opciones: { valor: string; etiqueta: string }[];
};

type Contexto = {
  /** Abre el modal y responde true si la persona confirma, false si cancela, cierra o toca Esc. */
  confirmar: (opciones: OpcionesConfirmar) => Promise<boolean>;
  /** Como confirmar, pero con una lista para elegir: responde el valor elegido, o null si cancela. */
  elegir: (opciones: OpcionesElegir) => Promise<string | null>;
};

const ConfirmarContexto = createContext<Contexto | null>(null);

export function useConfirmar(): Contexto["confirmar"] {
  const contexto = useContext(ConfirmarContexto);
  if (!contexto) throw new Error("useConfirmar hay que usarlo dentro de <ConfirmarProvider>");
  return contexto.confirmar;
}

export function useElegir(): Contexto["elegir"] {
  const contexto = useContext(ConfirmarContexto);
  if (!contexto) throw new Error("useElegir hay que usarlo dentro de <ConfirmarProvider>");
  return contexto.elegir;
}

type Abierto = Partial<OpcionesElegir> &
  OpcionesConfirmar & {
    /** false = canceló; true = confirmó; texto = confirmó eligiendo ese valor */
    responder: (r: boolean | string) => void;
  };

// Usa <dialog>: el navegador ya atrapa el foco, cierra con Esc y devuelve el foco a quien lo abrió (app.md §6.2).
function Modal({ abierto, cerrar }: { abierto: Abierto; cerrar: (r: boolean | string) => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [elegido, setElegido] = useState(abierto.opciones?.[0]?.valor ?? "");

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
      className="m-auto max-h-[min(90dvh,calc(100dvh-1.5rem))] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-3xl border border-borde bg-superficie p-0 text-texto shadow-xl backdrop:bg-teal-oscuro/40"
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
        {abierto.opciones && (
          <fieldset className="mt-2 flex flex-col gap-1">
            <legend className="sr-only">{abierto.titulo}</legend>
            {abierto.opciones.map((o) => (
              <label key={o.valor} className="flex min-h-11 items-center gap-3 rounded-xl px-2 hover:bg-teal-fondo">
                <input
                  type="radio"
                  name="elegido"
                  value={o.valor}
                  checked={elegido === o.valor}
                  onChange={() => setElegido(o.valor)}
                  className="size-5 accent-teal"
                />
                {o.etiqueta}
              </label>
            ))}
          </fieldset>
        )}
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variante="secundario" autoFocus={abierto.peligro} onClick={() => cerrar(false)}>
            {abierto.cancelar ?? textos.comun.cancelar}
          </Button>
          <Button
            type="button"
            variante={abierto.peligro ? "peligro" : "primario"}
            autoFocus={!abierto.peligro}
            onClick={() => cerrar(abierto.opciones ? elegido : true)}
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
      new Promise<boolean>((resolver) => setAbierto({ ...opciones, responder: (r) => resolver(r !== false) })),
    [],
  );

  const elegir = useCallback(
    (opciones: OpcionesElegir) =>
      new Promise<string | null>((resolver) =>
        setAbierto({ ...opciones, responder: (r) => resolver(typeof r === "string" ? r : null) }),
      ),
    [],
  );

  const cerrar = useCallback(
    (r: boolean | string) => {
      abierto?.responder(r);
      setAbierto(null);
    },
    [abierto],
  );

  const contexto = useMemo(() => ({ confirmar, elegir }), [confirmar, elegir]);

  return (
    <ConfirmarContexto.Provider value={contexto}>
      {children}
      {abierto && <Modal abierto={abierto} cerrar={cerrar} />}
    </ConfirmarContexto.Provider>
  );
}
