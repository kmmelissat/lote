"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useConfirmar } from "@/components/ui/Confirmar";
import { MensajeError } from "@/components/ui/MensajeError";
import { TarjetaPromocion } from "@/components/ui/TarjetaPromocion";
import { useToast } from "@/components/ui/Toast";
import { nombreBase, type Descuento } from "@/domain";
import { formatearDia, formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { quitarOferta } from "../actions/ofertas";
import type { OfertaDeTienda } from "../repositorio";

const t = textos.promociones.ofertas;
const o = textos.productos.oferta;

const textoDeRebaja = (d: Descuento) => (d.tipo === "monto" ? formatearDolares(d.valor) : `${d.valor} %`);

function rango(precios: number[]): string {
  const [bajo, alto] = [Math.min(...precios), Math.max(...precios)];
  return bajo === alto ? formatearDolares(bajo) : `${formatearDolares(bajo)} – ${formatearDolares(alto)}`;
}

/** Las ofertas programadas o activas de la tienda, cada una con su botón para cancelarla. */
export function ListaOfertas({ ofertas }: { ofertas: OfertaDeTienda[] }) {
  const router = useRouter();
  const confirmar = useConfirmar();
  const { avisar } = useToast();
  const [error, setError] = useState<string>();
  const [pendiente, empezar] = useTransition();

  // El modal se abre antes de la acción (no dentro de una transición, que lo dejaría sin abrir)
  async function cancelar(lote: string) {
    setError(undefined);
    const si = await confirmar({ titulo: o.confirmarTitulo, texto: o.confirmarTexto, confirmar: o.confirmarSi, peligro: true });
    if (!si) return;
    empezar(async () => {
      const r = await quitarOferta(lote);
      if (r.error) return setError(r.error);
      avisar(o.cancelada, { tipo: "exito" });
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="ofertas-en-curso" className="flex flex-col gap-3">
      <h2 id="ofertas-en-curso" className="text-lg font-bold">
        {t.titulo}
      </h2>
      <MensajeError>{error}</MensajeError>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-3">
        {ofertas.map((x) => {
          const nombres = [...new Set(x.productos.map((p) => nombreBase(p.nombre, p.variante)))].join(", ");
          return (
            <li key={x.lote}>
              <TarjetaPromocion
                tipo="oferta"
                sello={t.rebaja(textoDeRebaja(x.descuento))}
                estado={x.estado === "activa" ? "vigente" : "programada"}
                textoEstado={x.estado === "activa" ? o.activa : o.programada}
                titulo={nombres}
                precio={{ ahora: rango(x.precios), antes: null, ahorro: null }}
                cubre={x.productos.length > 1 ? textos.promociones.variantes(x.productos.length) : undefined}
                fechas={o.fechas(formatearDia(x.desde), formatearDia(x.hasta))}
                pie={
                  <Button type="button" variante="suave" tamano="chico" disabled={pendiente} onClick={() => cancelar(x.lote)}>
                    {pendiente ? o.cancelando : o.cancelar}
                  </Button>
                }
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
