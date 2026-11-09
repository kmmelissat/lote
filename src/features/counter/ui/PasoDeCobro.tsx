"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { ModoDeVenta, type ModoDeVentaClave } from "./ModoDeVenta";

const t = textos.mostrador;

/** Un bloque por tema, con su emoji; entre bloques va una línea punteada */
function Seccion({ titulo, emoji, children }: { titulo: string; emoji: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="flex items-center gap-3 text-base font-semibold">
        <span aria-hidden className="text-xl">
          {emoji}
        </span>
        {titulo}
      </h3>
      {children}
    </section>
  );
}

/**
 * El segundo paso: quién compra, cómo paga y cuándo lo recibe. Ocupa el lugar de los productos; la venta sigue a la vista
 * en la barra de la derecha. El cliente es opcional al cobrar en persona, así que parte como un enlace y se abre al tocarlo.
 */
export function PasoDeCobro({
  volver,
  modo,
  cambiarModo,
  cliente,
  clienteVisible,
  pago,
  entrega,
  entregaVisible,
  linea,
  bloqueo,
  error,
}: {
  volver: () => void;
  modo: ModoDeVentaClave;
  cambiarModo: (m: ModoDeVentaClave) => void;
  cliente: ReactNode;
  /** Visible aunque nadie lo haya pedido: un apartado o un pedido de chat necesitan sus datos */
  clienteVisible: boolean;
  pago: ReactNode;
  entrega: ReactNode;
  /** En persona la entrega se esconde (se lleva ya); por chat, o si ya se eligió otra, se ve */
  entregaVisible: boolean;
  /** Lo elegido en una línea, para no perderlo de vista en el celular */
  linea: string;
  /** Solo en celular: en pantalla ancha lo muestra la barra, junto al botón */
  bloqueo?: ReactNode;
  error?: ReactNode;
}) {
  const [abiertoAMano, setAbiertoAMano] = useState(false);
  const verCliente = clienteVisible || abiertoAMano;
  const [entregaAbierta, setEntregaAbierta] = useState(false);
  const verEntrega = entregaVisible || entregaAbierta;

  const seccionCliente = (
    <Seccion titulo={t.secciones.cliente} emoji="👤">
      {verCliente ? (
        cliente
      ) : (
        <button type="button" onClick={() => setAbiertoAMano(true)} className="flex min-h-12 w-fit items-center gap-1.5 text-sm font-medium text-teal">
          <Icon nombre="mas" className="size-4" />
          {t.paso.clientePastilla}
        </button>
      )}
    </Seccion>
  );
  const seccionPago = <Seccion titulo={textos.mostrador.pago.titulo} emoji="💵">{pago}</Seccion>;
  const seccionEntrega = verEntrega ? (
    <Seccion titulo={textos.mostrador.entrega.titulo} emoji="📦">{entrega}</Seccion>
  ) : (
    <p className="flex flex-wrap items-center gap-2 text-sm text-texto-2">
      {t.paso.entregaAhora}
      <button type="button" onClick={() => setEntregaAbierta(true)} className="font-medium text-teal">
        {t.paso.cambiar}
      </button>
    </p>
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3">
        <button type="button" onClick={volver} className="flex min-h-11 w-fit items-center gap-1.5 rounded-[14px] pr-3 text-sm font-medium text-teal">
          <Icon nombre="atras" className="size-5" />
          {t.paso.volver}
        </button>
        <ModoDeVenta modo={modo} cambiar={cambiarModo} />
      </div>

      <p className="rounded-[14px] border border-linea bg-gris-50 px-3 py-2 text-[13px] text-texto-2 xl:hidden">{linea}</p>

      <div className="flex flex-col divide-y divide-dashed divide-borde-control [&>*]:py-6">
        {modo === "chat" ? (
          <>
            {seccionCliente}
            {seccionEntrega}
            {seccionPago}
          </>
        ) : (
          <>
            {seccionPago}
            {seccionCliente}
            {seccionEntrega}
          </>
        )}
      </div>

      {bloqueo}
      {error}
    </div>
  );
}
