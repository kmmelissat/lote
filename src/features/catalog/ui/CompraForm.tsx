"use client";

import { useActionState, useRef, useState } from "react";
import { MensajeError } from "@/components/ui/MensajeError";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { DEPARTAMENTOS } from "@/lib/departamentos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { comprarProducto, type EstadoApartar } from "../actions/apartar";
import type { OpcionesDeCompra } from "../repositorio";
import { campoCompra, CampoWhatsApp, guardarDatos, Honeypot, useDatosGuardados } from "./camposCompra";

const t = textos.vitrina.compra;
const ta = textos.vitrina.apartar;

type Metodo = "transferencia" | "billetera" | "efectivo" | "contra_entrega";
type Entrega = "retiro" | "envio";

const ICONOS: Record<Metodo, NombreIcono> = { transferencia: "banco", billetera: "billetera", efectivo: "efectivo", contra_entrega: "camion" };

/** Con qué entrega se puede pagar cada cosa: efectivo es al recoger y contra entrega es al recibir. */
const sirve = (m: Metodo, e: Entrega) => (m === "efectivo" ? e === "retiro" : m === "contra_entrega" ? e === "envio" : true);


function Opcion({
  nombre,
  valor,
  marcada,
  onElegir,
  icono,
  titulo,
  ayuda,
  derecha,
}: {
  nombre: string;
  valor: string;
  marcada: boolean;
  onElegir: () => void;
  icono: NombreIcono;
  titulo: string;
  ayuda?: string;
  derecha?: string;
}) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name={nombre} value={valor} checked={marcada} onChange={onElegir} className="peer sr-only" />
      <span className="flex items-center gap-3 rounded-2xl border-2 border-teal-oscuro/25 bg-white p-3 transition-colors peer-checked:border-teal-oscuro peer-checked:bg-limon/40 peer-checked:shadow-dura-chica peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-teal-oscuro bg-crema">
          <Icon nombre={icono} className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-bold">{titulo}</span>
          {ayuda && <span className="text-sm text-texto-2">{ayuda}</span>}
        </span>
        {derecha && <span className="shrink-0 text-sm font-bold">{derecha}</span>}
      </span>
    </label>
  );
}

/** Comprar como en cualquier tienda en línea: tus datos, cómo lo recibís, cómo pagás y el total. O solo apartar. */
export function CompraForm({
  slug,
  codigo,
  precio,
  unidades,
  opciones,
}: {
  slug: string;
  codigo: number;
  precio: number;
  /** Cuántas unidades compra: se elige antes, junto al precio */
  unidades: number;
  opciones: OpcionesDeCompra;
}) {
  const [estado, accion, pendiente] = useActionState<EstadoApartar, FormData>(comprarProducto.bind(null, slug, codigo), {});
  const puedeRecoger = opciones.direccionRetiro !== null;
  const [entrega, setEntrega] = useState<Entrega>(puedeRecoger ? "retiro" : "envio");
  const [departamento, setDepartamento] = useState("");
  const [metodo, setMetodo] = useState<Metodo | "">("");
  // La compra va de a un paso: datos, entrega y pago. Los tres siguen en el formulario (solo se esconden) para que todo se envíe junto.
  const [paso, setPaso] = useState(0);
  const formulario = useRef<HTMLFormElement>(null);
  const v = estado.valores ?? {};
  const guardados = useDatosGuardados();

  // Las formas de pago que sirven con la entrega elegida y con las que trabaja la tienda
  const metodosDisponibles = (["transferencia", "billetera", "efectivo", "contra_entrega"] as const).filter(
    (m) => opciones.metodos.includes(m) && sirve(m, entrega),
  );
  const metodoElegido = metodosDisponibles.find((m) => m === metodo) ?? metodosDisponibles[0] ?? "";

  const tarifa = entrega === "envio" && departamento ? (opciones.tarifas[departamento] ?? opciones.tarifaDefecto) : 0;
  const subtotal = precio * unidades;

  /** Pasa al paso siguiente solo si lo de este paso está completo; si no, muestra qué falta. */
  function siguiente() {
    const actual = formulario.current?.querySelector<HTMLElement>(`[data-paso="${paso}"]`);
    const campos = actual?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select") ?? [];
    for (const c of campos) {
      if (!c.checkValidity()) return void c.reportValidity();
    }
    setPaso(paso + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      {(
        <form
          ref={formulario}
          action={accion}
          onSubmit={(e) => {
            const f = new FormData(e.currentTarget);
            guardarDatos(String(f.get("nombre") ?? ""), String(f.get("telefono") ?? ""));
          }}
          className="relative flex flex-col gap-5"
        >
          <Honeypot />
          <input type="hidden" name="cantidad" value={unidades} />
          {/* Dónde vas: "Paso 1 de 3" con tres puntos gruesos, para que no parezcan campos */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold">
              {t.paso(paso + 1, t.pasos.length)} · {t.pasos[paso]}
            </p>
            <ol aria-label={t.pasosAria} className="flex gap-1.5">
              {t.pasos.map((nombre, i) => (
                <li
                  key={nombre}
                  aria-current={i === paso ? "step" : undefined}
                  className={`size-3.5 rounded-full border-2 border-teal-oscuro ${i <= paso ? "bg-mango" : "bg-white"}`}
                >
                  <span className="sr-only">{nombre}</span>
                </li>
              ))}
            </ol>
          </div>

          <section hidden={paso !== 0} data-paso="0" className="flex flex-col gap-3">
            <h2 className="font-bold">{t.tusDatos}</h2>
            {/* La key vuelve a pintar los campos cuando llegan los datos guardados de la compra anterior */}
            <div key={guardados.clave} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold">{ta.nombre}</span>
                <input name="nombre" autoComplete="name" required defaultValue={v.nombre ?? guardados.nombre} placeholder="Ana Martínez" className={campoCompra} />
              </label>
              <CampoWhatsApp defecto={guardados.telefono} />
            </div>
          </section>

          <fieldset hidden={paso !== 1} data-paso="1" className="flex flex-col gap-2">
            <legend className="mb-1 font-bold">{t.recibirTitulo}</legend>
            {puedeRecoger && (
              <Opcion
                nombre="entrega"
                valor="retiro"
                marcada={entrega === "retiro"}
                onElegir={() => setEntrega("retiro")}
                icono="tienda"
                titulo={t.retiro}
                ayuda={t.retiroAyuda(opciones.direccionRetiro ?? "")}
                derecha={t.envioGratis}
              />
            )}
            <Opcion
              nombre="entrega"
              valor="envio"
              marcada={entrega === "envio"}
              onElegir={() => setEntrega("envio")}
              icono="camion"
              titulo={t.envio}
              ayuda={t.envioAyuda}
            />
            {entrega === "envio" && (
              <div className="mt-1 flex animate-entra flex-col gap-3 rounded-2xl bg-white p-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold">{t.departamento}</span>
                  <select name="departamento" required value={departamento} onChange={(e) => setDepartamento(e.target.value)} className={campoCompra}>
                    <option value="">{t.elegirDepartamento}</option>
                    {DEPARTAMENTOS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold">{t.municipio}</span>
                  <input name="municipio" autoComplete="address-level2" className={campoCompra} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold">{t.direccion}</span>
                  <input name="direccion" required autoComplete="street-address" placeholder={t.direccionPlaceholder} className={campoCompra} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold">{t.referencia}</span>
                  <input name="referencia" placeholder={t.referenciaPlaceholder} className={campoCompra} />
                </label>
              </div>
            )}
          </fieldset>

          <div hidden={paso !== 2} data-paso="2" className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-bold">{t.pagarTitulo}</legend>
            {metodosDisponibles.length === 0 && <p className="text-sm text-texto-2">{t.sinMetodos}</p>}
            {metodosDisponibles.map((m) => (
              <Opcion
                key={m}
                nombre="metodo"
                valor={m}
                marcada={metodoElegido === m}
                onElegir={() => setMetodo(m)}
                icono={ICONOS[m]}
                titulo={t.metodos[m].titulo}
                ayuda={t.metodos[m].ayuda}
              />
            ))}
            {/* La tarjeta todavía no existe: se muestra para que se sepa que viene, pero no se puede elegir */}
            <div aria-disabled="true" className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-teal-oscuro/30 bg-white/50 p-3 opacity-70">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-teal-oscuro/30">
                <Icon nombre="moneda" className="size-5" />
              </span>
              <span className="min-w-0 flex-1 font-bold">{t.tarjeta}</span>
              <span className="shrink-0 rounded-full bg-limon px-3 py-0.5 text-xs font-bold">{t.proximamente}</span>
            </div>
          </fieldset>

          <section aria-live="polite" className="flex flex-col gap-1 rounded-2xl border-2 border-teal-oscuro bg-white p-4">
            <h2 className="mb-1 font-bold">{t.resumenTitulo}</h2>
            <p className="flex justify-between text-sm">
              <span className="text-texto-2">{t.subtotal}</span>
              <span className="tabular-nums">{formatearDolares(subtotal)}</span>
            </p>
            <p className="flex justify-between text-sm">
              <span className="text-texto-2">{t.envioLinea}</span>
              <span className="tabular-nums">{entrega === "retiro" ? t.envioGratis : departamento ? (tarifa === 0 ? t.envioGratis : formatearDolares(tarifa)) : "–"}</span>
            </p>
            <p className="flex justify-between border-t-2 border-teal-oscuro pt-2 text-lg font-bold">
              <span>{t.total}</span>
              <span className="tabular-nums">{formatearDolares(subtotal + tarifa)}</span>
            </p>
          </section>

          <label className="flex min-h-11 items-start gap-3">
            <input type="checkbox" name="acepta" className="mt-1 size-5 shrink-0 accent-teal" />
            <span>{ta.acepta}</span>
          </label>
          </div>

          <MensajeError>{estado.error}</MensajeError>
          <div className="flex items-center gap-2">
            {paso > 0 && (
              <button
                type="button"
                onClick={() => setPaso(paso - 1)}
                className="inline-flex h-12 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white px-5 font-bold hover:-translate-y-0.5 hover:shadow-dura-chica"
              >
                {t.atras}
              </button>
            )}
            {paso < 2 ? (
              <button
                type="button"
                onClick={siguiente}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-full border-2 border-teal-oscuro bg-mango px-8 font-bold shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura"
              >
                {t.siguiente}
              </button>
            ) : (
              <button
                type="submit"
                disabled={pendiente || !metodoElegido}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-full border-2 border-teal-oscuro bg-teal px-8 font-bold text-white shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
              >
                {pendiente ? t.confirmando : t.confirmar}
              </button>
            )}
          </div>
          <p className="flex justify-between text-sm" aria-live="polite">
            <span className="text-texto-2">{t.total}</span>
            <span className="font-bold tabular-nums">{formatearDolares(subtotal + tarifa)}</span>
          </p>
        </form>
      )}
    </div>
  );
}
