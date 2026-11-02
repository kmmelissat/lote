"use client";

import { useSyncExternalStore } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
  const origen = useSyncExternalStore(sinSuscripcion, origenActual, origenServidor);
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
    <Card role="region" aria-labelledby="enlace-seguimiento" className="flex flex-col gap-3">
      <div>
        <h2 id="enlace-seguimiento" className="font-bold">
          {t.titulo}
        </h2>
        <p className="text-sm text-texto-2">{t.ayuda}</p>
      </div>
      <p className="break-all rounded-xl bg-fondo px-3 py-2 text-sm text-texto-2">
        {origen}
        {ruta}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variante="secundario" tamano="chico" icono="copiar" onClick={copiar}>
          {t.copiar}
        </Button>
        <ButtonLink href={ruta} target="_blank" rel="noreferrer" variante="suave" tamano="chico" icono="diagonal">
          {t.abrir}
        </ButtonLink>
      </div>
    </Card>
  );
}
