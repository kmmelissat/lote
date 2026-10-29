"use client";

import { totalDeLineas } from "@/domain";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { MensajeError } from "@/components/ui/MensajeError";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { DEPARTAMENTOS } from "@/lib/departamentos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { comprarCarrito, comprarProducto, type EstadoApartar } from "../actions/apartar";
import type { OpcionesDeCompra } from "../repositorio";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";
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
  lineas,
  carrito = false,
  opciones,
  volverHref,
}: {
  slug: string;
  /** Lo que se compra: un producto ("Comprar ahora") o los del carrito. Precio en centavos. */
  lineas: { codigo: number; cantidad: number; precio: number }[];
  /** Compra del carrito: un solo pedido con todas las líneas */
  carrito?: boolean;
  opciones: OpcionesDeCompra;
  /** A dónde lleva "Volver" en el primer paso: la página del producto */
  volverHref: string;
}) {
  const [estado, accion, pendiente] = useActionState<EstadoApartar, FormData>(
    carrito ? comprarCarrito.bind(null, slug) : comprarProducto.bind(null, slug, lineas[0].codigo),
    {},
  );
  const puedeRecoger = opciones.direccionRetiro !== null;
  const [entrega, setEntrega] = useState<Entrega>(puedeRecoger ? "retiro" : "envio");
  const [departamento, setDepartamento] = useState("");
  // Si intenta seguir sin elegir el departamento, la lista se abre sola y avisa
  const [faltaDepartamento, setFaltaDepartamento] = useState(false);
  const [intentos, setIntentos] = useState(0);
  // Sin aceptar que la tienda le escriba por WhatsApp no se puede confirmar
  const [acepta, setAcepta] = useState(false);
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

  const costoDe = (d: string) => opciones.tarifas[d] ?? opciones.tarifaDefecto;
  const tarifa = entrega === "envio" && departamento ? costoDe(departamento) : 0;
  const subtotal = totalDeLineas(lineas);

  /** Pasa al paso siguiente solo si lo de este paso está completo; si no, muestra qué falta. */
  function siguiente() {
    // La lista propia no es un <select>: su "falta elegir" se revisa acá
    if (paso === 1 && entrega === "envio" && !departamento) {
      setFaltaDepartamento(true);
      setIntentos((n) => n + 1);
      return;
    }
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
            // Solo se envía desde el último paso, tocando "Confirmar pedido": un Enter o un toque que cae encima
            // del botón al cambiar de paso no debe confirmar nada.
            if (paso < 2) return e.preventDefault();
            const f = new FormData(e.currentTarget);
            guardarDatos(String(f.get("nombre") ?? ""), String(f.get("telefono") ?? ""));
          }}
          className="relative flex flex-col gap-5"
        >
          <Honeypot />
          {carrito ? (
            <input type="hidden" name="items" value={JSON.stringify(lineas.map((l) => ({ codigo: l.codigo, cantidad: l.cantidad })))} />
          ) : (
            <input type="hidden" name="cantidad" value={lineas[0].cantidad} />
          )}
          {/* Dónde vas: "Paso 1 de 3" con tres puntos gruesos, para que no parezcan campos */}
          <p className="sr-only" aria-live="polite">
            {t.paso(paso + 1, t.pasos.length)} · {t.pasos[paso]}
          </p>
          <ol aria-label={t.pasosAria} className="flex items-center gap-2">
            {t.pasos.map((nombre, i) => (
              <li key={nombre} aria-current={i === paso ? "step" : undefined} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`grid size-9 place-items-center rounded-full border-2 border-teal-oscuro text-sm font-bold transition-colors ${
                    i < paso ? "bg-teal text-white" : i === paso ? "bg-accion text-accion-texto shadow-dura-chica" : "bg-white text-texto-2"
                  }`}
                >
                  {i < paso ? <Icon nombre="check" className="size-4" /> : i + 1}
                </span>
                <span className={`text-sm font-bold ${i === paso ? "" : "hidden text-texto-2 sm:inline"}`}>{nombre}</span>
                {i < t.pasos.length - 1 && <span aria-hidden="true" className="h-0.5 w-3 rounded-full bg-teal-oscuro/30 sm:w-8" />}
              </li>
            ))}
          </ol>

          <section hidden={paso !== 0} data-paso="0" className="flex animate-desliza flex-col gap-3">
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

          {/* z-20: la lista de departamentos se abre por encima de la barra de abajo */}
          <fieldset hidden={paso !== 1} data-paso="1" className="relative z-20 flex animate-desliza flex-col gap-2">
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
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold">{t.departamento}</span>
                  <ListaDesplegable
                    name="departamento"
                    variante="campo"
                    valor={departamento}
                    alCambiar={(d) => {
                      setDepartamento(d);
                      setFaltaDepartamento(false);
                    }}
                    opciones={DEPARTAMENTOS.map((d) => ({ valor: d, etiqueta: d, detalle: costoDe(d) === 0 ? t.envioGratis : formatearDolares(costoDe(d)) }))}
                    placeholder={t.elegirDepartamento}
                    error={faltaDepartamento ? t.elegirDepartamento : undefined}
                    abrirAlFallar={intentos}
                  />
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold">{t.municipio}</span>
                  <input name="municipio" autoComplete="address-level2" className={campoCompra} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold">{t.direccion}</span>
                  <input name="direccion" required autoComplete="street-address" placeholder={t.direccionPlaceholder} className={campoCompra} />
                </label>
                {/* El punto de referencia es opcional: no estorba hasta que se necesita */}
                <details className="group">
                  <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-bold text-teal underline [&::-webkit-details-marker]:hidden">
                    <Icon nombre="mas" className="size-4 group-open:hidden" />
                    {t.agregarReferencia}
                  </summary>
                  <label className="mt-1 flex flex-col gap-1.5">
                    <span className="text-sm font-bold">{t.referencia}</span>
                    <input name="referencia" placeholder={t.referenciaPlaceholder} className={campoCompra} />
                  </label>
                </details>
              </div>
            )}
          </fieldset>

          <div hidden={paso !== 2} data-paso="2" className="flex animate-desliza flex-col gap-5">
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

          <section aria-live="polite" className="flex flex-col gap-1 rounded-2xl border border-teal-oscuro/20 bg-white p-4">
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

          <label className="flex min-h-11 items-start gap-3 rounded-2xl border border-teal-oscuro/20 bg-white p-3">
            <input type="checkbox" name="acepta" required checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-teal" />
            <span>{ta.acepta}</span>
          </label>
          </div>

          <MensajeError>{estado.error}</MensajeError>
          {/* Anclado abajo: el total, "Volver" y el botón principal siempre se ven, sea cual sea el paso */}
          <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-col gap-2 rounded-b-[22px] border-t-2 border-teal-oscuro bg-crema px-5 py-3 md:-mx-6 md:-mb-6 md:px-6">
            {paso === 2 && !acepta && (
              <p role="status" className="text-sm font-medium text-ambar-texto">
                {ta.aceptaFalta}
              </p>
            )}
            <p className="flex justify-between text-sm" aria-live="polite">
              <span className="text-texto-2">{t.total}</span>
              <span className="font-bold tabular-nums">{formatearDolares(subtotal + tarifa)}</span>
            </p>
            <div className="flex items-center gap-2">
              {paso > 0 ? (
                <button
                  type="button"
                  onClick={() => setPaso(paso - 1)}
                  className="inline-flex h-12 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white px-5 font-bold hover:-translate-y-0.5 hover:shadow-dura-chica"
                >
                  {t.volver}
                </button>
              ) : (
                <Link
                  href={volverHref}
                  className="inline-flex h-12 items-center justify-center rounded-full border-2 border-teal-oscuro bg-white px-5 font-bold hover:-translate-y-0.5 hover:shadow-dura-chica"
                >
                  {t.volver}
                </Link>
              )}
              {paso < 2 ? (
                <button
                  key="siguiente"
                  type="button"
                  onClick={siguiente}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-full border-2 border-teal-oscuro bg-accion px-8 font-bold text-accion-texto shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura"
                >
                  {t.siguiente}
                </button>
              ) : (
                <button
                  key="confirmar"
                  type="submit"
                  disabled={pendiente || !metodoElegido || !acepta}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-full border-2 border-teal-oscuro bg-teal px-8 font-bold text-white shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
                >
                  {pendiente ? t.confirmando : t.confirmar}
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
