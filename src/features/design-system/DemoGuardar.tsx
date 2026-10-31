"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

// Maqueta para comparar cómo guardar un formulario. Nada de esto guarda de verdad.

type Modo = "plana" | "hoy" | "final" | "cambios" | "arriba" | "auto";

const MODOS: { id: Modo; nombre: string; nota: string }[] = [
  { id: "plana", nombre: "Barra plana (elegida)", nota: "Una franja de borde a borde pegada abajo, con los botones a la derecha. Sin sombra dura ni flotar. En el celular ya no hay menú abajo, así que no choca. Es la que usan los formularios reales." },
  { id: "hoy", nombre: "Antes", nota: "Barra flotante con borde y sombra, siempre visible. Tapa parte del formulario." },
  { id: "final", nombre: "Al final", nota: "Los botones están donde termina el formulario. No flotan ni tapan nada. Ideal para crear algo." },
  { id: "cambios", nombre: "Solo con cambios", nota: "Escribí algo: aparece una barra plana abajo. Sin cambios no hay nada encima. Ideal para ajustes." },
  { id: "arriba", nombre: "Arriba", nota: "Los botones van en el encabezado de la pantalla (título y descripción a la izquierda, botones a la derecha), que se queda arriba al bajar. Se probó y no convenció." },
  { id: "auto", nombre: "Automático", nota: "Escribí y, un momento después, se guarda solo con un aviso. Sin botón. Solo para ajustes." },
];

const CAMPOS = ["Nombre de la tienda", "Frase corta", "WhatsApp", "Instagram", "Facebook", "TikTok", "Tiempo de entrega", "Política de cambios"];
const INICIAL = Object.fromEntries(CAMPOS.map((c, i) => [c, i === 0 ? "Velvet" : ""]));

export function DemoGuardar() {
  const { avisar } = useToast();
  const [modo, setModo] = useState<Modo>("plana");
  const [valores, setValores] = useState<Record<string, string>>(INICIAL);
  const [guardado, setGuardado] = useState<Record<string, string>>(INICIAL);
  const [estadoAuto, setEstadoAuto] = useState<"quieto" | "guardando" | "listo">("quieto");
  const reloj = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Lo último escrito, para que el temporizador guarde eso y no lo que había cuando empezó a contar
  const ultimos = useRef(valores);
  useEffect(() => {
    ultimos.current = valores;
  }, [valores]);

  const hayCambios = CAMPOS.some((c) => valores[c] !== guardado[c]);

  // El guardado automático espera un momento después de la última tecla
  useEffect(() => () => clearTimeout(reloj.current), []);

  function cambiar(campo: string, valor: string) {
    setValores((v) => ({ ...v, [campo]: valor }));
    if (modo !== "auto") return;
    setEstadoAuto("guardando");
    clearTimeout(reloj.current);
    reloj.current = setTimeout(() => {
      setGuardado(ultimos.current);
      setEstadoAuto("listo");
      avisar("Guardado.", { tipo: "exito" });
    }, 900);
  }

  function guardar() {
    setGuardado(valores);
    avisar("¡Listo! Se guardó tu tienda.", { tipo: "exito" });
  }

  function elegir(nuevo: Modo) {
    setModo(nuevo);
    setValores(INICIAL);
    setGuardado(INICIAL);
    setEstadoAuto("quieto");
  }

  const botones = (
    <>
      <Button type="button" variante="mango" onClick={guardar}>
        Guardar
      </Button>
      <Button type="button" variante="secundario" onClick={() => setValores(guardado)}>
        Descartar
      </Button>
    </>
  );

  const actual = MODOS.find((m) => m.id === modo)!;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Formas de guardar" className="flex flex-wrap gap-2">
        {MODOS.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={modo === m.id}
            onClick={() => elegir(m.id)}
            className="min-h-11 rounded-full border-2 border-teal-oscuro bg-superficie px-4 text-sm font-bold aria-selected:bg-teal-oscuro aria-selected:text-white"
          >
            {m.nombre}
          </button>
        ))}
      </div>
      <p className="max-w-2xl text-sm text-texto-2">{actual.nota}</p>

      {/* La caja con scroll hace de pantalla: así se ve cómo se comporta lo que flota o se queda pegado */}
      <div className="relative h-96 overflow-y-auto rounded-[24px] border-2 border-teal-oscuro bg-superficie">
        {modo === "arriba" && (
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-borde bg-superficie px-5 py-3">
            <div className="min-w-0">
              <p className="text-2xl font-bold">Mi tienda</p>
              <p className="text-texto-2">Tu marca, el WhatsApp de tu tienda y, si querés, tu vitrina.</p>
            </div>
            <Button type="button" variante="mango" disabled={!hayCambios} onClick={guardar}>
              Guardar
            </Button>
          </div>
        )}
        <div className="flex flex-col gap-4 p-5">
          {modo !== "arriba" && <p className="text-2xl font-bold">Mi tienda</p>}
          {CAMPOS.map((c) => (
            <Field key={c} etiqueta={c} value={valores[c]} onChange={(e) => cambiar(c, e.target.value)} />
          ))}
          {modo === "final" && <div className="flex flex-wrap gap-3 pt-2">{botones}</div>}
          {modo === "auto" && (
            <p role="status" className="text-sm text-texto-2">
              {estadoAuto === "guardando" ? "Guardando…" : estadoAuto === "listo" ? "Todos los cambios guardados" : "Los cambios se guardan solos"}
            </p>
          )}
        </div>

        {modo === "hoy" && (
          <div className="sticky bottom-3 mx-auto flex w-full max-w-sm flex-wrap items-center justify-center gap-3 rounded-[20px] border-2 border-teal-oscuro bg-crema px-4 py-3 shadow-dura">
            <Button type="button" variante="mango" onClick={guardar}>
              Guardar
            </Button>
          </div>
        )}
        {modo === "plana" && (
          <Barra>
            <p className="mr-auto text-sm text-texto-2">{hayCambios ? "Cambios sin guardar" : "Todo guardado"}</p>
            {botones}
          </Barra>
        )}
        {modo === "cambios" && hayCambios && (
          <Barra>
            <p className="text-sm font-bold">Cambios sin guardar</p>
            <div className="flex gap-2">{botones}</div>
          </Barra>
        )}
      </div>
    </div>
  );
}

/** La barra plana: pegada abajo, de borde a borde, sin sombra dura ni marco. */
function Barra({ children }: { children: ReactNode }) {
  return (
    <div className="animate-aviso sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-borde bg-superficie px-5 py-3 shadow-[0_-6px_12px_-8px_rgba(0,56,68,0.25)]">
      {children}
    </div>
  );
}
