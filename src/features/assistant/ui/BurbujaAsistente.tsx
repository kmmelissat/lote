"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { LotitoMas } from "@/features/landing/ui/mas/LotitoMas";
import { Chat } from "./Chat";
import { AvatarLotito } from "./PiezasChat";

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
        className="fixed inset-x-4 bottom-[7.75rem] top-16 z-40 flex animate-entra flex-col overflow-hidden rounded-[28px] border-2 border-teal-oscuro bg-crema shadow-[6px_6px_0_0_var(--color-teal-oscuro)] outline-none motion-reduce:animate-none md:inset-x-auto md:bottom-6 md:right-6 md:top-auto md:h-[38rem] md:max-h-[calc(100dvh-3rem)] md:w-[27rem]"
      >
        <header className="flex items-center gap-3 border-b-2 border-teal-oscuro bg-white px-4 py-3">
          <AvatarLotito className="size-11" enLinea />
          <div className="min-w-0 flex-1">
            <p className="font-logo text-xl leading-none">{t.titulo}</p>
            <p className="mt-0.5 truncate text-sm text-texto-2">
              <span className="font-medium text-teal">{t.enLinea}</span> · {t.flotanteSubtitulo}
            </p>
          </div>
          <Link
            href="/asistente"
            onClick={() => setAbierto(false)}
            aria-label={t.flotante.ampliar}
            title={t.flotante.ampliar}
            className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-teal-fondo"
          >
            <Icon nombre="ampliar" className="size-5" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setAbierto(false);
              boton.current?.focus();
            }}
            aria-label={t.flotante.cerrar}
            className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-teal-fondo"
          >
            <Icon nombre="x" />
          </button>
        </header>
        <div className="min-h-0 flex-1 p-3">
          {montado && <Chat negocioId={negocioId} compacto ruta={pathname} alSeguirEnlace={alSeguirEnlace} />}
        </div>
      </div>

      <button
        ref={boton}
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-label={t.flotante.abrir}
        className={`fixed right-4 bottom-[6rem] z-30 transition-transform duration-150 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 md:right-6 md:bottom-6 ${abierto ? "invisible pointer-events-none" : ""}`}
      >
        <span className="relative block md:hidden">
          <LotitoMas nombre="saluda" className="w-14 motion-safe:animate-asomar" />
          <span className="absolute -left-1 top-0 flex h-8 w-10 items-center justify-center gap-0.5 rounded-2xl rounded-br-md border-2 border-teal-oscuro bg-celeste shadow-dura-chica">
            {[0, 150, 300].map((demora) => (
              <span
                key={demora}
                aria-hidden="true"
                className="size-1.5 rounded-full bg-teal-oscuro/70 motion-safe:animate-bounce"
                style={{ animationDelay: `${demora}ms` }}
              />
            ))}
          </span>
        </span>
        <span className="group relative hidden h-14 items-center gap-2 rounded-full border-2 border-teal-oscuro bg-celeste py-1 pl-2 pr-5 text-teal-oscuro shadow-dura-chica md:flex">
          <LotitoMas nombre="saluda" className="-mb-1 w-11" />
          <span className="text-sm font-bold">{t.flotanteEtiqueta}</span>
        </span>
      </button>
    </div>
  );
}
