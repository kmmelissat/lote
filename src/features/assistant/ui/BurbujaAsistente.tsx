"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { textos } from "@/lib/textos";
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
        className="fixed inset-x-3 bottom-[7.5rem] top-14 z-40 flex animate-entra flex-col overflow-hidden rounded-[28px] border-2 border-teal-oscuro bg-crema shadow-[6px_6px_0_0_var(--color-teal-oscuro)] outline-none motion-reduce:animate-none md:inset-x-auto md:bottom-6 md:right-6 md:top-auto md:h-[38rem] md:max-h-[calc(100dvh-3rem)] md:w-[27rem]"
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
        className={`group fixed bottom-[7rem] right-4 z-30 flex h-14 items-center gap-2 rounded-full border-2 border-teal-oscuro bg-limon pl-5 pr-6 text-teal-oscuro shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none md:bottom-6 md:right-6 ${abierto ? "hidden" : ""}`}
      >
        {/* El monito se asoma por arriba de la cápsula y se estira un poco al pasar el mouse */}
        <Monito
          nombre="asoma"
          className="pointer-events-none absolute -top-[30px] right-5 w-14 text-rosa transition-transform duration-200 group-hover:-translate-y-1 motion-safe:animate-asomar"
        />
        <span aria-hidden="true" className="size-2.5 rounded-full bg-teal ring-2 ring-white" />
        <span className="text-sm font-bold">{t.flotanteEtiqueta}</span>
      </button>
    </div>
  );
}
