"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { ModoDeVenta, type ModoDeVentaClave } from "./ModoDeVenta";

const t = textos.mostrador;

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-lg font-bold">{titulo}</h3>
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
  /** Solo en celular: en pantalla ancha lo muestra la barra, junto al botón */
  bloqueo?: ReactNode;
  error?: ReactNode;
}) {
  const [abiertoAMano, setAbiertoAMano] = useState(false);
  const verCliente = clienteVisible || abiertoAMano;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3">
        <button type="button" onClick={volver} className="flex min-h-11 w-fit items-center gap-1.5 rounded-full pr-3 text-sm font-bold text-teal">
          <Icon nombre="atras" className="size-5" />
          {t.paso.volver}
        </button>
        <ModoDeVenta modo={modo} cambiar={cambiarModo} />
      </div>

      <Seccion titulo={t.secciones.cliente}>
        {verCliente ? (
          cliente
        ) : (
          <button type="button" onClick={() => setAbiertoAMano(true)} className="flex min-h-12 w-fit items-center gap-1.5 text-sm font-bold text-teal">
            <Icon nombre="mas" className="size-4" />
            {t.paso.clientePastilla}
          </button>
        )}
      </Seccion>

      <Seccion titulo={t.pago.titulo}>{pago}</Seccion>

      <Seccion titulo={t.entrega.titulo}>{entrega}</Seccion>

      {bloqueo}
      {error}
    </div>
  );
}
