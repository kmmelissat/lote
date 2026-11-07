"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AtajosDeFechas } from "@/components/ui/AtajosDeFechas";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConfirmar } from "@/components/ui/Confirmar";
import { SelectorFecha } from "@/components/ui/SelectorFecha";
import { MensajeError } from "@/components/ui/MensajeError";
import { useToast } from "@/components/ui/Toast";
import { aDolares, hoyEnElSalvador, leerDescuento, leerDolares, precioDeOferta, type Centavos, type Descuento } from "@/domain";
import { soloNumero } from "@/lib/entrada";
import { formatearDia, formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { programarOferta, quitarOferta } from "../actions/ofertas";
import type { OfertaProducto } from "../repositorio";

const t = textos.productos.oferta;

// "2026-11-05" como el día de El Salvador (a mediodía UTC cae el mismo día en cualquier zona)

type Modo = "precio" | "porcentaje" | "monto";

/** Lo que escribió la persona como una rebaja. Si dijo el precio final, la rebaja es la diferencia con el de ahora. */
function leerRebaja(modo: Modo, texto: string, precioActual: Centavos | null): Descuento | null | "invalido" {
  if (modo !== "precio") return leerDescuento(modo, texto);
  if (!texto.trim()) return null;
  const final = leerDolares(texto);
  if (final === null || precioActual === null || final <= 0 || final >= precioActual) return "invalido";
  return { tipo: "monto", valor: precioActual - final };
}

const textoDeRebaja = (d: Descuento) => (d.tipo === "monto" ? formatearDolares(d.valor) : `${d.valor} %`);

function rango(precios: Centavos[]): string {
  const [bajo, alto] = [Math.min(...precios), Math.max(...precios)];
  return bajo === alto ? formatearDolares(bajo) : `${formatearDolares(bajo)} – ${formatearDolares(alto)}`;
}

/**
 * Poner un producto (o todas sus variantes, con `todas`) en oferta unos días, y ver o cancelar la que ya tiene.
 * `precios` son los precios normales de lo que cubre la oferta, solo para la vista previa: la base calcula los de verdad.
 * Con `alProgramar`, al programarla se sigue ahí en vez de quedarse en la misma pantalla.
 */
export function OfertaProducto({
  codigo,
  todas,
  precios,
  ofertas,
  alProgramar,
}: {
  codigo: number;
  todas: boolean;
  precios: Centavos[];
  ofertas: OfertaProducto[];
  alProgramar?: () => void;
}) {
  const router = useRouter();
  const confirmar = useConfirmar();
  const { avisar } = useToast();
  const [error, setError] = useState<string>();
  const [pendiente, empezar] = useTransition();
  const hoy = hoyEnElSalvador(new Date());
  // Si todo lo que cubre la oferta cuesta lo mismo, se puede decir a qué precio dejarlo; si no, solo cuánto se rebaja
  const precioUnico = new Set(precios).size === 1 ? precios[0] : null;
  const modos: Modo[] = [precioUnico === null ? "monto" : "precio", "porcentaje"];
  const [modo, setModo] = useState<Modo>("porcentaje");
  const [valor, setValor] = useState("");
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState("");

  const leido = leerRebaja(modo, valor, precioUnico);
  const descuento = leido && leido !== "invalido" ? leido : null;
  // La base y la acción guardan una rebaja (monto o porcentaje); "dejarlo en un precio" se traduce a cuánto se rebaja
  const tipo: Descuento["tipo"] = descuento?.tipo ?? "monto";
  const textoRebaja = descuento ? (descuento.tipo === "monto" ? aDolares(descuento.valor).toFixed(2) : String(descuento.valor)) : valor;
  const nuevos = descuento ? precios.map((p) => precioDeOferta(p, descuento)) : [];
  const sinRebaja = nuevos.some((p) => p === null);
  const [bajo, alto] = descuento && !sinRebaja ? [Math.min(...(nuevos as Centavos[])), Math.max(...(nuevos as Centavos[]))] : [null, null];
  const listo = !!descuento && !sinRebaja && !!desde && !!hasta && hasta >= desde && hasta >= hoy;

  function programar() {
    setError(undefined);
    empezar(async () => {
      const r = await programarOferta(codigo, todas, { tipo, texto: textoRebaja, desde, hasta });
      if (r.error) return setError(r.error);
      avisar(t.hecha, { tipo: "exito" });
      if (alProgramar) return alProgramar();
      setValor("");
      setHasta("");
      router.refresh();
    });
  }

  // El modal se abre antes de la acción (no dentro de una transición, que lo dejaría sin abrir)
  async function cancelar(lote: string) {
    setError(undefined);
    const si = await confirmar({ titulo: t.confirmarTitulo, texto: t.confirmarTexto, confirmar: t.confirmarSi, peligro: true });
    if (!si) return;
    empezar(async () => {
      const r = await quitarOferta(lote);
      if (r.error) return setError(r.error);
      avisar(t.cancelada, { tipo: "exito" });
      router.refresh();
    });
  }

  return (
    <Card role="region" aria-labelledby="oferta-producto" className="flex flex-col gap-4">
      <div>
        <h2 id="oferta-producto" className="font-bold">
          {t.titulo}
        </h2>
        <p className="text-sm text-texto-2">
          {t.ayuda} {todas && t.ayudaVariantes}
        </p>
      </div>

      {ofertas.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {ofertas.map((o) => (
            <li key={o.lote} className="flex flex-col gap-2 rounded-2xl border border-teal-oscuro bg-limon p-4">
              <p className="font-bold">
                {o.estado === "activa" ? t.activa : t.programada} · {t.rebaja(textoDeRebaja(o.descuento))}
              </p>
              <p className="text-sm">{t.fechas(formatearDia(o.desde), formatearDia(o.hasta))}</p>
              <p className="text-sm">{t.precios(rango(o.precios))}</p>
              <Button type="button" variante="suave" disabled={pendiente} onClick={() => cancelar(o.lote)} className="self-start text-sm">
                {pendiente ? t.cancelando : t.cancelar}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (listo) programar();
          }}
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">{t.titulo}</legend>
            <div className="flex gap-2">
              {modos.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={modo === m}
                  onClick={() => {
                    setModo(m);
                    setValor("");
                  }}
                  className={`min-h-11 flex-1 rounded-full border border-teal-oscuro px-3 text-sm font-medium ${modo === m ? "bg-limon font-bold" : "bg-superficie"}`}
                >
                  {t.modos[m]}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">{t.campo[modo]}</span>
              <input
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(soloNumero(e.target.value, true))}
                aria-invalid={leido === "invalido" || sinRebaja || undefined}
                placeholder={modo === "porcentaje" ? "20 %" : "$0.00"}
                className="h-12 w-full rounded-[14px] border border-borde-control bg-superficie px-4 text-base tabular-nums focus:border-teal"
              />
            </label>
            <p className="text-sm text-texto-2">{modo === "precio" && precioUnico !== null ? t.ayudaCampo.precio(formatearDolares(precioUnico)) : modo === "porcentaje" ? t.ayudaCampo.porcentaje : t.ayudaCampo.monto}</p>
            {(leido === "invalido" || sinRebaja) && (
              <p className="text-sm text-error">{modo === "precio" && precioUnico !== null ? t.errorPrecioFinal(formatearDolares(precioUnico)) : textos.comun.descuento.invalido}</p>
            )}
          </fieldset>
          <AtajosDeFechas
            alElegir={(d, h) => {
              setDesde(d);
              setHasta(h);
            }}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectorFecha
              etiqueta={t.desde}
              valor={desde}
              alCambiar={(d) => {
                setDesde(d);
                // Si el fin quedó antes del nuevo inicio, se vuelve a elegir
                if (hasta && d && hasta < d) setHasta("");
              }}
              min={hoy}
              required
            />
            <SelectorFecha etiqueta={t.hasta} valor={hasta} alCambiar={setHasta} min={desde || hoy} required />
          </div>
          {bajo !== null && alto !== null && (
            <p className="text-sm font-medium">
              {bajo === alto ? t.vistaPrevia(formatearDolares(bajo)) : t.vistaPreviaRango(formatearDolares(bajo), formatearDolares(alto))}
            </p>
          )}
          <MensajeError>{error}</MensajeError>
          <Button type="submit" variante="mango" disabled={pendiente || !listo} className="self-start">
            {pendiente ? t.programando : t.programar}
          </Button>
        </form>
      )}
      {ofertas.length > 0 && <MensajeError>{error}</MensajeError>}
    </Card>
  );
}
