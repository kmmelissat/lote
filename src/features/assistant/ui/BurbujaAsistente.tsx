"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Gorila } from "@/components/ui/Gorila";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { Chat } from "./Chat";

const t = textos.asistente;

/**
 * El círculo de Lotito y su chat en ventana. Vive en el layout del panel, así que la conversación sigue
 * ahí mientras la persona navega. No bloquea la pantalla: se puede usar el panel con el chat abierto.
 */
export function BurbujaAsistente({ negocioId }: { negocioId: string }) {
  return (
    <Suspense fallback={null}>
      <Burbuja negocioId={negocioId} />
    </Suspense>
  );
}

function Burbuja({ negocioId }: { negocioId: string }) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  // El chat se monta la primera vez que se abre y desde ahí se queda (para no perder la conversación).
  const [montado, setMontado] = useState(false);
  if (abierto && !montado) setMontado(true);
  const ventana = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  // En la pantalla del asistente ya está el chat completo: la burbuja se esconde, pero sigue montada para no perder la conversación.
  const escondida = pathname === "/asistente" || pathname?.startsWith("/asistente/");

  useEffect(() => {
    if (!abierto) return;
    ventana.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAbierto(false);
      boton.current?.focus();
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [abierto]);

  // En el celular la ventana tapa casi todo: al seguir un enlace se cierra. En escritorio se queda al lado.
  const alSeguirEnlace = () => {
    if (window.matchMedia("(max-width: 767px)").matches) setAbierto(false);
  };

  return (
    <div className={escondida ? "hidden" : undefined}>
      <div
        ref={ventana}
        role="dialog"
        aria-label={t.titulo}
        tabIndex={-1}
        hidden={!abierto}
        className="fixed inset-x-3 bottom-[7.5rem] top-14 z-40 flex animate-entra flex-col overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-superficie shadow-dura outline-none motion-reduce:animate-none md:inset-x-auto md:bottom-24 md:right-6 md:top-auto md:h-[36rem] md:max-h-[calc(100dvh-7rem)] md:w-[26rem]"
      >
        <header className="flex items-center gap-3 border-b-2 border-teal-oscuro bg-teal-oscuro px-4 py-3 text-white">
          <Gorila className="size-9 shrink-0 text-limon" />
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight">{t.titulo}</p>
            <p className="truncate text-sm text-white/80">{t.flotanteSubtitulo}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAbierto(false);
              boton.current?.focus();
            }}
            aria-label={t.flotante.cerrar}
            className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-white/15"
          >
            <Icon nombre="x" />
          </button>
        </header>
        <div className="min-h-0 flex-1 bg-crema p-3">
          {montado && <Chat negocioId={negocioId} compacto ruta={pathname} alSeguirEnlace={alSeguirEnlace} />}
        </div>
      </div>

      <button
        ref={boton}
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-label={t.flotante.abrir}
        className={`fixed bottom-[7rem] right-4 z-30 flex h-14 items-center justify-center gap-2 rounded-full border-2 border-teal-oscuro bg-limon pl-3 text-teal-oscuro shadow-dura-chica transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none md:bottom-6 md:right-6 ${abierto ? "hidden" : "pr-5"}`}
      >
        <Gorila className="size-8 shrink-0" />
        <span className="text-sm font-bold">{t.flotanteEtiqueta}</span>
      </button>
    </div>
  );
}
