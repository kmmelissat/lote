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

// Es lo único que flota sobre la pantalla y confirma lo que pasó: va con color sólido, borde y sombra de la marca.
// Éxito en teal, error en rojo e info en celeste; el texto cumple contraste (blanco sobre teal y rojo, oscuro sobre celeste).
const estilos: Record<Tipo, { icono: NombreIcono; caja: string; chapa: string; accion: string; cerrar: string }> = {
  exito: {
    icono: "exito",
    caja: "bg-teal text-white",
    chapa: "bg-white text-teal",
    accion: "bg-white text-teal hover:bg-teal-fondo",
    cerrar: "text-white hover:bg-white/20",
  },
  error: {
    icono: "alerta",
    caja: "bg-error text-white",
    chapa: "bg-white text-error",
    accion: "bg-white text-error hover:bg-error-fondo",
    cerrar: "text-white hover:bg-white/20",
  },
  info: {
    icono: "info",
    caja: "bg-celeste text-teal-oscuro",
    chapa: "bg-white text-teal-oscuro",
    accion: "bg-white text-teal-oscuro hover:bg-celeste-palido",
    cerrar: "text-teal-oscuro hover:bg-white/50",
  },
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

/**
 * Lo que devuelve la acción cuando todo salió bien (`listo`) sale como aviso, en vez de una etiqueta dentro del formulario:
 * así no ocupa lugar en la barra de guardar. `listo` puede ser el mensaje mismo o solo un sí; entonces va `mensaje`.
 * Se dispara en cada guardado, aunque el resultado sea el mismo.
 */
export function useAvisarListo(estado: { listo?: boolean | string } | undefined, mensaje?: string) {
  const toast = useToastOpcional();
  useEffect(() => {
    const texto = typeof estado?.listo === "string" ? estado.listo : estado?.listo ? mensaje : undefined;
    if (texto) toast?.avisar(texto, { tipo: "exito" });
  }, [estado, mensaje, toast]);
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
  const { icono, caja, chapa, accion, cerrar: botonCerrar } = estilos[aviso.tipo];

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
      className={`animate-aviso pointer-events-auto flex items-center gap-3 rounded-[20px] border-2 border-teal-oscuro py-2 pl-3 pr-2 shadow-dura-chica ${caja}`}
    >
      <span aria-hidden="true" className={`flex size-8 shrink-0 items-center justify-center rounded-full ${chapa}`}>
        <Icon nombre={icono} className="size-5" />
      </span>
      <p className="min-w-0 flex-1 py-1 text-sm font-bold">{aviso.mensaje}</p>
      {aviso.accion && (
        <button
          type="button"
          onClick={() => {
            aviso.accion?.alTocar();
            cerrar();
          }}
          className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${accion}`}
        >
          {aviso.accion.etiqueta}
        </button>
      )}
      <button
        type="button"
        onClick={cerrar}
        aria-label={textos.comun.cerrarAviso}
        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${botonCerrar}`}
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
      {/* En móvil sube para no tapar la barra de guardar de abajo. El contenedor deja pasar los toques; cada aviso los recibe. */}
      <ul className="pointer-events-none fixed inset-x-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] z-50 mx-auto flex max-w-md flex-col gap-2 md:bottom-6">
        {avisos.map((a) => (
          <AvisoVista key={a.id} aviso={a} cerrar={() => quitar(a.id)} />
        ))}
      </ul>
    </ToastContexto.Provider>
  );
}
