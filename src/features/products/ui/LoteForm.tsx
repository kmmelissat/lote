"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { leerDolares, repartirCostoTotal, type Cuenta, type Tarjeta } from "@/domain/index";
import { BarraFormulario } from "@/components/ui/BarraFormulario";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { OpcionRadio } from "@/components/ui/OpcionRadio";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { crearLote, type EstadoLote } from "../actions/lote";
import { sugerirFicha } from "../actions/nuevo";
import { MAXIMO_LOTE } from "../limites";
import { Campo, CampoDinero } from "./campos";
import { BloqueForm } from "./BloqueForm";
import { LugarDeCompra } from "./LugarDeCompra";
import { SelectorCategoria } from "./SelectorCategoria";
import { ZonaFotos } from "./ZonaFotos";

const t = textos.productos.lote;
const f = textos.productos.form;

export function LoteForm({ negocioId, cuentas, tarjetas = [] }: { negocioId: string; cuentas: readonly Cuenta[]; tarjetas?: readonly Tarjeta[] }) {
  const [estado, accion, pendiente] = useActionState<EstadoLote, FormData>(crearLote, {});
  const [rutas, setRutas] = useState<string[]>([]);
  // Lo que se escribe por pieza se guarda por ruta: si se quita una foto, no se corren las demás.
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [precios, setPrecios] = useState<Record<string, string>>({});
  const [sugeridos, setSugeridos] = useState<Set<string>>(new Set());
  const [precio, setPrecio] = useState("");
  const [costo, setCosto] = useState("");
  const [aviso, setAviso] = useState("");
  const [categoria, setCategoria] = useState("");
  const [leyendo, empezarLectura] = useTransition();

  const precioComun = precio.trim() ? leerDolares(precio) : null;
  const costoTotal = costo.trim() ? leerDolares(costo) : null;
  const porPieza = costoTotal !== null && rutas.length ? repartirCostoTotal(costoTotal, rutas.length) : [];

  // El precio que de verdad llevará cada pieza: el suyo si lo cambió, y si no el de todas.
  const preciosFinales = rutas.map((r) => {
    const propio = precios[r]?.trim();
    return propio ? leerDolares(propio) : precioComun;
  });
  const sinPrecio = preciosFinales.some((p) => p === null);
  const sinNombre = rutas.filter((r) => !nombres[r]?.trim()).length;
  const ganancia =
    costoTotal !== null && !sinPrecio && rutas.length
      ? (preciosFinales as number[]).reduce((suma, p) => suma + p, 0) - costoTotal
      : null;
  const listo = rutas.length > 0 && sinNombre === 0 && !sinPrecio;

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

  const b = t.bloques;
  const textoBase = precioComun !== null ? t.precioPiezaAyuda(formatearDolares(precioComun)) : t.precioPiezaSinBase;

  return (
    <form action={accion} className="flex min-h-[calc(100dvh-12rem)] flex-col gap-6">
      <input type="hidden" name="fotos" value={JSON.stringify(rutas)} />
      <input type="hidden" name="nombres" value={JSON.stringify(rutas.map((r) => nombres[r] ?? ""))} />
      <input type="hidden" name="precios" value={JSON.stringify(rutas.map((r) => precios[r] ?? ""))} />

      <div className="flex w-full max-w-3xl flex-col gap-6">
        <Card className="flex flex-col gap-6 [&>*+*]:border-t [&>*+*]:border-borde [&>*+*]:pt-6">
          <BloqueForm numero={1} titulo={b.fotos.titulo} ayuda={b.fotos.ayuda} tono="limon" listo={rutas.length > 0}>
            <ZonaFotos negocioId={negocioId} rutas={rutas} onCambio={setRutas} maximo={MAXIMO_LOTE} conMiniaturas={false} />
          </BloqueForm>

          {rutas.length > 0 && (
            <BloqueForm numero={2} titulo={b.piezas.titulo} ayuda={b.piezas.ayuda} tono="mango" listo={sinNombre === 0}>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <p className="font-bold">{t.piezas(rutas.length)}</p>
                <Button type="button" variante="suave" tamano="chico" disabled={leyendo} onClick={sugerirNombres}>
                  {leyendo ? f.leyendoFoto : t.sugerirNombres}
                </Button>
              </div>
              <p className="-mt-2 text-sm text-texto-2">{t.sugerirAyuda}</p>
              <p role="status" className="empty:hidden text-sm text-error">
                {aviso}
              </p>
              <ul className="flex flex-col gap-3">
                {rutas.map((ruta, i) => (
                  <li key={ruta} className="flex items-start gap-3 rounded-2xl bg-superficie p-3">
                    <div className="relative shrink-0">
                      <Image
                        src={urlFoto(ruta)}
                        alt={textos.productos.fotos.foto(i + 1)}
                        width={80}
                        height={80}
                        className="size-16 rounded-xl border-2 border-teal-oscuro object-cover sm:size-20"
                      />
                      <button
                        type="button"
                        aria-label={t.quitarPieza(i + 1)}
                        onClick={() => setRutas((rs) => rs.filter((r) => r !== ruta))}
                        className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white text-teal-oscuro hover:bg-rosa"
                      >
                        <Icon nombre="x" className="size-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                    <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
                      <Campo
                        etiqueta={t.nombrePieza(i + 1)}
                        requerido
                        maxLength={120}
                        value={nombres[ruta] ?? ""}
                        onChange={(ev) => ponerNombre(ruta, ev.target.value)}
                        lotito={sugeridos.has(ruta)}
                      />
                      <div className="flex flex-col gap-1">
                        <CampoDinero
                          etiqueta={t.precioPieza}
                          value={precios[ruta] ?? ""}
                          onChange={(ev) => setPrecios((p) => ({ ...p, [ruta]: ev.target.value }))}
                        />
                        <p className="text-xs text-texto-2">{textoBase}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </BloqueForm>
          )}

          {rutas.length > 0 && (
            <BloqueForm numero={3} titulo={b.precio.titulo} ayuda={b.precio.ayuda} tono="rosa" listo={precioComun !== null || !sinPrecio}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CampoDinero
                  etiqueta={t.precio}
                  name="precio"
                  placeholder={t.precioPlaceholder}
                  value={precio}
                  onChange={(ev) => setPrecio(ev.target.value)}
                />
                <CampoDinero etiqueta={t.costoTotal} name="costoTotal" value={costo} onChange={(ev) => setCosto(ev.target.value)} />
              </div>
              {costoTotal !== null && <LugarDeCompra cuentas={cuentas} tarjetas={tarjetas} />}
              <div aria-live="polite" className="flex flex-col gap-1 rounded-2xl bg-superficie px-4 py-3">
                <p className="text-sm text-texto-2">
                  {porPieza.length ? t.reparto(formatearDolares(porPieza[0]), rutas.length) : t.repartoAyuda}
                </p>
                {ganancia !== null ? (
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm text-texto-2">{t.gananciaLote}</span>
                    <strong className={`text-xl tabular-nums ${ganancia < 0 ? "text-error" : "text-teal"}`}>{formatearDolares(ganancia)}</strong>
                  </p>
                ) : (
                  costoTotal === null && <p className="text-sm text-texto-2">{t.sinGanancia}</p>
                )}
              </div>
            </BloqueForm>
          )}

          {rutas.length > 0 && (
            <BloqueForm numero={4} titulo={b.detalles.titulo} ayuda={b.detalles.ayuda} tono="celeste" listo>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectorCategoria etiqueta={f.categoria} valor={categoria} onCambio={setCategoria} />
                <fieldset className="flex flex-col">
                  <legend className="mb-1.5 text-sm font-medium">{f.condicion}</legend>
                  <div className="flex flex-wrap gap-2">
                    {(["nuevo", "usado"] as const).map((c) => (
                      <OpcionRadio key={c} name="condicion" value={c} defaultChecked={c === "nuevo"} titulo={f[c]} />
                    ))}
                  </div>
                </fieldset>
              </div>
            </BloqueForm>
          )}
        </Card>

        <MensajeError>{estado.error}</MensajeError>
      </div>

      {rutas.length > 0 && (
        <BarraFormulario>
          {!listo && (
            <p className="mr-auto text-sm text-texto-2" aria-live="polite">
              {sinNombre > 0 ? t.nombresFaltan(sinNombre) : t.errorSinPrecio}
            </p>
          )}
          <Button type="submit" variante="mango" icono="check" disabled={pendiente || !listo}>
            {pendiente ? t.creando : t.crear(rutas.length)}
          </Button>
        </BarraFormulario>
      )}
    </form>
  );
}
