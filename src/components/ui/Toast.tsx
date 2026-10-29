"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon, type NombreIcono } from "./Icon";
import { textos } from "@/lib/textos";

type Tipo = "exito" | "error" | "info";

export type OpcionesAviso = {
  tipo?: Tipo;
  /** Un botón dentro del aviso, por ejemplo "Deshacer". Al tocarlo el aviso se cierra. */
  accion?: { etiqueta: string; alTocar: () => void };
  /** Milisegundos hasta que se cierra solo. Con acción o en errores dura más. */
  duracion?: number;
};

type Aviso = OpcionesAviso & { id: number; mensaje: string; tipo: Tipo };

const MAXIMO_VISIBLES = 3;

const estilos: Record<Tipo, { icono: NombreIcono; color: string }> = {
  exito: { icono: "exito", color: "text-teal" },
  error: { icono: "alerta", color: "text-error" },
  info: { icono: "info", color: "text-texto-2" },
};

type Contexto = {
  /** Muestra un aviso breve abajo. Sirve para confirmar acciones ("Guardado") y para errores que no son de un campo. */
  avisar: (mensaje: string, opciones?: OpcionesAviso) => void;
};

const ToastContexto = createContext<Contexto | null>(null);

/** Igual que useToast, pero sin romper si no hay proveedor (por ejemplo en una prueba aislada). */
export function useToastOpcional(): Contexto | null {
  return useContext(ToastContexto);
}

/**
 * Los errores por campo de un formulario (los que devuelve la acción del servidor) también salen como aviso:
 * el primero, y cuántos más hay. Se dispara en cada intento de guardar, aunque el error sea el mismo.
 * El error "general" no, porque ese ya lo avisa MensajeError.
 */
export function useAvisarErrores(estado: { errores?: Partial<Record<string, string>> } | undefined) {
  const toast = useToastOpcional();
  useEffect(() => {
    const campos = Object.entries(estado?.errores ?? {}).filter(([k, v]) => k !== "general" && v);
    if (!campos.length) return;
    const [, primero] = campos[0];
    toast?.avisar(campos.length > 1 ? textos.comun.yOtrosErrores(primero!, campos.length - 1) : primero!, { tipo: "error" });
  }, [estado, toast]);
}

export function useToast(): Contexto {
  const contexto = useContext(ToastContexto);
  if (!contexto) throw new Error("useToast hay que usarlo dentro de <ToastProvider>");
  return contexto;
}

function duracionDe(a: Aviso) {
  return a.duracion ?? (a.accion ? 8000 : a.tipo === "error" ? 7000 : 4000);
}

function AvisoVista({ aviso, cerrar }: { aviso: Aviso; cerrar: () => void }) {
  const [pausado, setPausado] = useState(false);
  const { icono, color } = estilos[aviso.tipo];

  // El reloj se detiene mientras el mouse o el foco están encima: da tiempo de leer y de tocar la acción.
  useEffect(() => {
    if (pausado) return;
    const id = setTimeout(cerrar, duracionDe(aviso));
    return () => clearTimeout(id);
  }, [pausado, aviso, cerrar]);

  return (
    <li
      role={aviso.tipo === "error" ? "alert" : "status"}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      className="animate-aviso pointer-events-auto flex items-center gap-3 rounded-2xl border border-borde bg-superficie py-2 pl-4 pr-2 shadow-lg"
    >
      <Icon nombre={icono} className={`size-5 shrink-0 ${color}`} />
      <p className="min-w-0 flex-1 py-1 text-sm font-medium">{aviso.mensaje}</p>
      {aviso.accion && (
        <button
          type="button"
          onClick={() => {
            aviso.accion?.alTocar();
            cerrar();
          }}
          className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-medium text-teal hover:bg-teal-fondo"
        >
          {aviso.accion.etiqueta}
        </button>
      )}
      <button
        type="button"
        onClick={cerrar}
        aria-label={textos.comun.cerrarAviso}
        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-texto-2 hover:bg-teal-fondo"
      >
        <Icon nombre="x" className="size-4" />
      </button>
    </li>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const siguiente = useRef(0);

  const avisar = useCallback((mensaje: string, opciones: OpcionesAviso = {}) => {
    const aviso: Aviso = { ...opciones, tipo: opciones.tipo ?? "exito", mensaje, id: siguiente.current++ };
    setAvisos((actuales) => [...actuales, aviso].slice(-MAXIMO_VISIBLES));
  }, []);

  const quitar = useCallback((id: number) => setAvisos((actuales) => actuales.filter((a) => a.id !== id)), []);
  const contexto = useMemo(() => ({ avisar }), [avisar]);

  return (
    <ToastContexto.Provider value={contexto}>
      {children}
      {/* En móvil sube para no tapar la barra inferior. El contenedor deja pasar los toques; cada aviso los recibe. */}
      <ul className="pointer-events-none fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md flex-col gap-2 md:bottom-6">
        {avisos.map((a) => (
          <AvisoVista key={a.id} aviso={a} cerrar={() => quitar(a.id)} />
        ))}
      </ul>
    </ToastContexto.Provider>
  );
}
