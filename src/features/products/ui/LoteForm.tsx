"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { leerDolares, repartirCostoTotal } from "@/domain/index";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { TARJETA } from "@/components/ui/tarjeta";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { crearLote, type EstadoLote } from "../actions/lote";
import { sugerirFicha } from "../actions/nuevo";
import { MAXIMO_LOTE } from "../limites";
import { FotoInput } from "./FotoInput";

const t = textos.productos.lote;
const f = textos.productos.form;

export function LoteForm({ negocioId }: { negocioId: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoLote, FormData>(crearLote, {});
  const [rutas, setRutas] = useState<string[]>([]);
  // Los nombres se guardan por ruta: si se quita una foto, no se corren los de las demás.
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [sugeridos, setSugeridos] = useState<Set<string>>(new Set());
  const [costo, setCosto] = useState("");
  const [aviso, setAviso] = useState("");
  const [leyendo, empezarLectura] = useTransition();

  const costoTotal = costo.trim() ? leerDolares(costo) : null;
  const porPieza = costoTotal !== null && rutas.length ? repartirCostoTotal(costoTotal, rutas.length) : [];

  function ponerNombre(ruta: string, nombre: string) {
    setNombres((n) => ({ ...n, [ruta]: nombre }));
    setSugeridos((s) => {
      const nuevo = new Set(s);
      nuevo.delete(ruta);
      return nuevo;
    });
  }

  // De una en una, para no pedirle diez fotos a la IA al mismo tiempo. Solo llena los nombres vacíos.
  function sugerirNombres() {
    setAviso("");
    empezarLectura(async () => {
      let sinIA = false;
      let fallaron = 0;
      for (const ruta of rutas) {
        if (nombres[ruta]?.trim()) continue;
        const r = await sugerirFicha(ruta);
        if ("ficha" in r) {
          setNombres((n) => ({ ...n, [ruta]: n[ruta]?.trim() ? n[ruta] : r.ficha.nombre }));
          setSugeridos((s) => new Set(s).add(ruta));
        } else if (r.error === "sin_ia") {
          sinIA = true;
          break;
        } else fallaron++;
      }
      setAviso(sinIA ? f.errorFotoSinIA : fallaron ? t.algunasFallaron(fallaron) : "");
    });
  }

  return (
    <form action={accion} className="flex max-w-xl flex-col gap-5">
      <FotoInput
        negocioId={negocioId}
        onCambio={setRutas}
        maximo={MAXIMO_LOTE}
        mensajeMaximo={t.maximo(MAXIMO_LOTE)}
      />
      <input type="hidden" name="fotos" value={JSON.stringify(rutas)} />
      <input type="hidden" name="nombres" value={JSON.stringify(rutas.map((r) => nombres[r] ?? ""))} />

      {rutas.length > 0 && (
        <>
          <section aria-labelledby="piezas" className={`${TARJETA} flex flex-col gap-3 bg-superficie`}>
            <h2 id="piezas" className="font-bold">
              {t.piezas(rutas.length)}
            </h2>
            <div className="flex flex-col gap-1">
              <Button type="button" variante="secundario" className="self-start" disabled={leyendo} onClick={sugerirNombres}>
                {leyendo ? f.leyendoFoto : t.sugerirNombres}
              </Button>
              <p className="text-sm text-texto-2">{t.sugerirAyuda}</p>
              <p role="status" className="min-h-5 text-sm text-error">
                {aviso}
              </p>
            </div>
            <ul className="flex flex-col gap-3">
              {rutas.map((ruta, i) => (
                <li key={ruta} className="flex items-end gap-3">
                  <Image
                    src={urlFoto(ruta)}
                    alt={textos.productos.fotos.foto(i + 1)}
                    width={56}
                    height={56}
                    className="size-14 shrink-0 rounded-xl border-2 border-teal-oscuro object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <Field
                      etiqueta={t.nombrePieza(i + 1)}
                      required
                      maxLength={120}
                      value={nombres[ruta] ?? ""}
                      onChange={(ev) => ponerNombre(ruta, ev.target.value)}
                      sugerido={sugeridos.has(ruta)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className={`${TARJETA} flex flex-col gap-3 bg-crema`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field etiqueta={t.precio} name="precio" inputMode="decimal" required />
            <Field
              etiqueta={t.costoTotal}
              name="costoTotal"
              inputMode="decimal"
              value={costo}
              onChange={(ev) => setCosto(ev.target.value)}
            />
          </div>
          <p className="text-sm font-medium" aria-live="polite">
            {porPieza.length ? t.reparto(formatearDolares(porPieza[0]), rutas.length) : t.repartoAyuda}
          </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field etiqueta={f.categoria} name="categoria" />
            <fieldset className="flex flex-col">
              <legend className="mb-1.5 text-sm font-medium">{f.condicion}</legend>
              <div className="flex gap-6">
                {(["nuevo", "usado"] as const).map((c) => (
                  <label key={c} className="flex min-h-11 items-center gap-2">
                    <input type="radio" name="condicion" value={c} defaultChecked={c === "nuevo"} className="size-5 accent-teal" />
                    {f[c]}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <MensajeError>{estado.error}</MensajeError>
          <Button type="submit" variante="mango" disabled={pendiente}>
            {pendiente ? t.creando : t.crear(rutas.length)}
          </Button>
        </>
      )}
    </form>
  );
}
