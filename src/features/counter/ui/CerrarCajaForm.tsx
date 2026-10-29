"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useConfirmar } from "@/components/ui/Confirmar";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { TARJETA } from "@/components/ui/tarjeta";
import { cuadreDeCaja, leerDolares } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { cerrarLaCaja } from "../actions/caja";
import type { ResumenCaja } from "../repositorio";

const t = textos.caja;

export function CerrarCajaForm({
  cajaId,
  desde,
  inicial,
  resumen,
  esperado,
}: {
  cajaId: string;
  desde: string;
  inicial: number;
  resumen: ResumenCaja;
  esperado: number;
}) {
  const confirmar = useConfirmar();
  const { avisar } = useToast();
  const [contadoTexto, setContadoTexto] = useState("");
  const [nota, setNota] = useState("");
  const [error, setError] = useState("");
  const [cerrando, setCerrando] = useState(false);

  const contado = contadoTexto.trim() ? leerDolares(contadoTexto) : null;
  const cuadre =
    contado === null
      ? null
      : cuadreDeCaja({ inicial, ventasEnEfectivo: resumen.efectivo, contado });

  async function cerrar() {
    if (cerrando) return;
    if (contado === null) return setError(t.errores.monto);
    setError("");
    // El modal se abre antes de empezar a guardar (nunca dentro de una transición).
    const si = await confirmar({
      titulo: t.cierre.confirmarTitulo,
      texto: t.cierre.confirmarTexto,
      confirmar: t.cierre.cerrar,
    });
    if (!si) return;
    setCerrando(true);
    const r = await cerrarLaCaja(cajaId, contadoTexto, nota);
    setCerrando(false);
    if (r.error) return setError(r.error);
    avisar(t.cierre.listo, { tipo: "exito" });
  }

  const filas: [string, string][] = [
    [t.resumen.inicial, formatearDolares(inicial)],
    [t.resumen.efectivo, formatearDolares(resumen.efectivo)],
    [t.resumen.transferencia, formatearDolares(resumen.transferencia)],
    [t.resumen.billetera, formatearDolares(resumen.billetera)],
    [t.resumen.descuentos, formatearDolares(resumen.descuentos)],
    [t.resumen.gastos, formatearDolares(resumen.gastos)],
  ];

  return (
    <div className="flex flex-col gap-4">
      <section className={`${TARJETA} bg-teal-fondo`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">{t.resumen.titulo}</h2>
          <p className="text-sm text-texto-2">
            {t.abiertaTitulo(desde)} · {t.resumen.ventas(resumen.ventas)}
          </p>
        </div>
        <dl className="mt-3 flex flex-col gap-1.5">
          {filas.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex justify-between gap-3">
              <dt className="text-texto-2">{etiqueta}</dt>
              <dd className="font-medium tabular-nums">{valor}</dd>
            </div>
          ))}
          <div className="mt-2 flex justify-between gap-3 border-t-2 border-dashed border-teal-oscuro/30 pt-3 text-lg font-bold">
            <dt>{t.resumen.esperado}</dt>
            <dd className="tabular-nums">{formatearDolares(esperado)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-texto-2">{t.resumen.gastosNota}</p>
      </section>

      <section className={`${TARJETA} flex flex-col gap-4 bg-crema`}>
        <h2 className="text-lg font-bold">{t.cierre.titulo}</h2>
        <Field
          etiqueta={t.cierre.contado}
          inputMode="decimal"
          autoComplete="off"
          value={contadoTexto}
          onChange={(e) => setContadoTexto(e.target.value)}
          placeholder="$0.00"
        />
        {cuadre && (
          <p
            aria-live="polite"
            className={`rounded-xl p-3 font-bold ${cuadre.estado === "cuadra" ? "bg-teal-fondo text-teal" : "bg-limon text-teal-oscuro"}`}
          >
            {cuadre.estado === "cuadra"
              ? t.cierre.cuadra
              : cuadre.estado === "sobra"
                ? t.cierre.sobra(formatearDolares(cuadre.diferencia))
                : t.cierre.falta(formatearDolares(-cuadre.diferencia))}
          </p>
        )}
        <Field
          etiqueta={t.cierre.nota}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder={t.cierre.notaAyuda}
          maxLength={300}
        />
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <Button
          type="button"
          variante="mango"
          onClick={cerrar}
          disabled={cerrando || contado === null}
        >
          {cerrando ? t.cierre.cerrando : t.cierre.cerrar}
        </Button>
      </section>
    </div>
  );
}
