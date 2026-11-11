"use client";

import { useSyncExternalStore } from "react";
import { BotonPunch, estiloBotonPunch } from "@/components/ui/BotonesPunch";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { textos } from "@/lib/textos";

const t = textos.pedidos.detalle.seguimiento;

const sinSuscripcion = () => () => {};
/** El dominio donde está abierta la app; en el servidor se deja vacío y el enlace se completa al hidratar */
const origenActual = () => window.location.origin;
const origenServidor = () => "";

/** El enlace público que ve el cliente para seguir su pedido: a la vista, para copiarlo o abrirlo como lo ve ella. */
export function EnlaceSeguimiento({ pedidoId }: { pedidoId: string }) {
  const { avisar } = useToast();
  const origen = useSyncExternalStore(
    sinSuscripcion,
    origenActual,
    origenServidor,
  );
  const ruta = `/p/${pedidoId}` as const;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${ruta}`);
      avisar(t.copiado, { tipo: "exito" });
    } catch {
      avisar(t.noSePudoCopiar, { tipo: "error" });
    }
  }

  return (
    <section aria-labelledby="link-rastreo" className="flex flex-col gap-2">
      <h2 id="link-rastreo" className="text-sm font-semibold">
        {t.titulo}
      </h2>
      <div className="flex items-center gap-2">
        <p className="flex h-11 min-w-0 md:h-10 flex-1 items-center gap-2 rounded-[14px] bg-gris-50 px-3 text-sm text-texto-2">
          <Icon nombre="enlace" className="size-5 shrink-0" />
          <span className="truncate">
            {origen.replace(/^https?:\/\//, "")}
            {ruta}
          </span>
        </p>
        <BotonPunch
          type="button"
          variante="secundario"
          onClick={copiar}
          aria-label={t.copiar}
          title={t.copiar}
          soloIcono
        >
          <Icon nombre="copiar" className="size-5 shrink-0" />
        </BotonPunch>
        <a
          href={ruta}
          target="_blank"
          rel="noreferrer"
          aria-label={t.abrir}
          title={t.abrir}
          className={estiloBotonPunch("secundario", true)}
        >
          <Icon nombre="diagonal" className="size-5 shrink-0" />
        </a>
      </div>
    </section>
  );
}
