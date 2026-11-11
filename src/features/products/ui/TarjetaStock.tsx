"use client";

import { useRef } from "react";
import { BotonPunch } from "@/components/ui/BotonesPunch";
import { Ventana } from "@/components/ui/Ventana";
import type { Cuenta, Tarjeta } from "@/domain/index";
import { textos } from "@/lib/textos";
import { ReponerForm } from "./ReponerForm";
import { TarjetaResumen } from "./TarjetaResumen";

const t = textos.productos;

/** Lo que queda: disponibles de las que entraron, apartadas y el botón de reponer (abre su ventana). Ámbar si queda poco o nada. */
export function TarjetaStock({
  codigo,
  disponibles,
  cantidad,
  apartadas,
  poco,
  variantes,
  cuentas,
  tarjetas = [],
  puedeReponer,
}: {
  codigo: number;
  disponibles: number;
  cantidad: number;
  apartadas: number;
  poco: boolean;
  variantes: { codigo: number; etiqueta: string }[];
  cuentas: readonly Cuenta[];
  tarjetas?: readonly Tarjeta[];
  puedeReponer: boolean;
}) {
  const ventana = useRef<HTMLDialogElement>(null);
  const agotado = disponibles === 0;
  return (
    <>
      <TarjetaResumen
        etiqueta={t.detalle.teQuedan}
        icono="caja"
        color="lila"
        numero={disponibles}
        detalle={t.detalle.estadisticas.disponiblesDe(cantidad)}
        aviso={agotado || poco}
        accion={
          puedeReponer && (
            <BotonPunch type="button" variante={agotado || poco ? "primario" : "secundario"} onClick={() => ventana.current?.showModal()}>
              {t.reponer.titulo}
            </BotonPunch>
          )
        }
      >
        <p>{agotado ? t.lista.agotado : poco ? t.pocoStock : t.detalle.todoBien}</p>
        {apartadas > 0 && <p>{t.detalle.apartadasPorCobrar(apartadas)}</p>}
      </TarjetaResumen>
      {puedeReponer && (
        <Ventana ref={ventana} titulo={t.reponer.titulo} ayuda={t.reponer.ayuda}>
          <ReponerForm codigo={codigo} variantes={variantes} cuentas={cuentas} tarjetas={tarjetas} />
        </Ventana>
      )}
    </>
  );
}
