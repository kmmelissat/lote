"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { useToast } from "@/components/ui/Toast";
import { TARJETA } from "@/components/ui/tarjeta";
import { cambioDe, descuentoEnCentavos, leerDolares, limpiarCodigoDeBarras, type Descuento } from "@/domain";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares, formatearHora } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { asociarCodigoDeBarras, buscarPorCodigoDeBarras, cobrarVenta } from "../actions/vender";
import type { MetodoMostrador, ProductoMostrador } from "../repositorio";
import { camaraDisponible, EscanerCamara } from "./EscanerCamara";

const t = textos.mostrador;
const METODOS: MetodoMostrador[] = ["efectivo", "transferencia", "billetera"];
const ICONO_METODO = { efectivo: "efectivo", transferencia: "banco", billetera: "billetera" } as const;

const normalizar = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const nombreCompleto = (p: ProductoMostrador) => (p.variante ? `${p.nombre} (${p.variante})` : p.nombre);

type Linea = { productoId: string; cantidad: number };
type Recibo = { codigo: number; total: number; cambio: number | null };

/** Lee el descuento escrito: null si está vacío, "invalido" si no se entiende o se pasa. */
function leerDescuento(tipo: Descuento["tipo"], texto: string): Descuento | null | "invalido" {
  if (!texto.trim()) return null;
  if (tipo === "monto") {
    const c = leerDolares(texto);
    return c === null ? "invalido" : { tipo, valor: c };
  }
  const n = Number(texto.trim().replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 100 ? { tipo, valor: n } : "invalido";
}

export function Mostrador({
  productos,
  puedeGestionar,
  cajaDesde,
}: {
  productos: ProductoMostrador[];
  puedeGestionar: boolean;
  /** Cuándo se abrió la caja de hoy (fecha ISO); null si no hay caja abierta */
  cajaDesde: string | null;
}) {
  const { avisar } = useToast();
  const [consulta, setConsulta] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([]);
  // Productos que se encontraron escaneando y no venían cargados en la pantalla.
  const [extras, setExtras] = useState<ProductoMostrador[]>([]);
  const [conDescuento, setConDescuento] = useState(false);
  const [tipoDescuento, setTipoDescuento] = useState<Descuento["tipo"]>("monto");
  const [textoDescuento, setTextoDescuento] = useState("");
  const [metodo, setMetodo] = useState<MetodoMostrador>("efectivo");
  const [recibido, setRecibido] = useState("");
  const [cobrando, setCobrando] = useState(false);
  const [error, setError] = useState("");
  const [recibo, setRecibo] = useState<Recibo | null>(null);
  const [camara, setCamara] = useState(false);
  const [codigoNuevo, setCodigoNuevo] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  // Sin cámara en el servidor y en el primer pintado; el navegador dice después si puede leer códigos.
  const hayCamara = useSyncExternalStore(
    () => () => {},
    camaraDisponible,
    () => false,
  );
  // Lo que se espera del servidor (un código desconocido) puede tardar: se suma sobre la venta vigente, no sobre la de antes.
  const lineasVigentes = useRef(lineas);
  useEffect(() => {
    lineasVigentes.current = lineas;
  });

  const todos = useMemo(() => {
    const ids = new Set(productos.map((p) => p.id));
    return [...productos, ...extras.filter((p) => !ids.has(p.id))];
  }, [productos, extras]);
  const porId = useMemo(() => new Map(todos.map((p) => [p.id, p])), [todos]);
  const porBarras = useMemo(() => new Map(todos.filter((p) => p.codigoBarras).map((p) => [p.codigoBarras as string, p])), [todos]);

  const q = normalizar(consulta.trim());
  const visibles = useMemo(
    () => (q ? todos.filter((p) => normalizar(`${p.nombre} ${p.variante ?? ""} ${p.codigo}`).includes(q)) : todos),
    [todos, q],
  );

  const detalle = lineas.flatMap((l) => {
    const p = porId.get(l.productoId);
    return p ? [{ ...l, producto: p }] : [];
  });
  const subtotal = detalle.reduce((s, l) => s + l.producto.precio * l.cantidad, 0);
  const unidades = detalle.reduce((s, l) => s + l.cantidad, 0);

  const descuentoLeido = conDescuento ? leerDescuento(tipoDescuento, textoDescuento) : null;
  const descuentoInvalido = descuentoLeido === "invalido";
  const descuento = descuentoLeido && descuentoLeido !== "invalido" ? descuentoEnCentavos(subtotal, descuentoLeido) : 0;
  const total = subtotal - descuento;

  const recibidoLeido = metodo === "efectivo" && recibido.trim() ? leerDolares(recibido) : null;
  const cambio = recibidoLeido === null ? null : cambioDe(total, recibidoLeido);
  const faltaRecibido = recibidoLeido !== null && cambio === null ? total - recibidoLeido : null;

  function agregar(p: ProductoMostrador) {
    setRecibo(null);
    setError("");
    const actual = lineasVigentes.current.find((l) => l.productoId === p.id)?.cantidad ?? 0;
    if (actual >= p.disponibles) {
      avisar(t.tope(nombreCompleto(p), p.disponibles), { tipo: "info" });
      return;
    }
    setLineas((ls) =>
      actual === 0 ? [...ls, { productoId: p.id, cantidad: 1 }] : ls.map((l) => (l.productoId === p.id ? { ...l, cantidad: l.cantidad + 1 } : l)),
    );
    avisar(t.agregado(nombreCompleto(p)), { duracion: 1200 });
  }

  function cambiarCantidad(id: string, delta: number) {
    const p = porId.get(id);
    setLineas((ls) =>
      ls.flatMap((l) => {
        if (l.productoId !== id) return [l];
        const n = l.cantidad + delta;
        if (n < 1) return [];
        if (p && n > p.disponibles) {
          avisar(t.tope(nombreCompleto(p), p.disponibles), { tipo: "info" });
          return [l];
        }
        return [{ ...l, cantidad: n }];
      }),
    );
  }

  /** Un código leído (por lector o cámara): lo agrega, o pregunta de qué producto es si no lo conoce. */
  async function resolverCodigo(texto: string): Promise<boolean> {
    const codigo = limpiarCodigoDeBarras(texto);
    if (!codigo) return false;
    const local = porBarras.get(codigo);
    if (local) {
      agregar(local);
      return true;
    }
    const remoto = await buscarPorCodigoDeBarras(codigo);
    if (remoto) {
      if (remoto.disponibles < 1) {
        avisar(t.barras.sinStock(nombreCompleto(remoto)), { tipo: "info" });
        return true;
      }
      setExtras((e) => [...e, remoto]);
      agregar(remoto);
      return true;
    }
    setCodigoNuevo(codigo);
    return true;
  }

  /** Enter en la búsqueda: lo que mandan los lectores USB y Bluetooth al terminar de leer. */
  async function alEnter() {
    const texto = consulta.trim();
    if (!texto) return;
    setConsulta("");
    const delCodigo = todos.find((p) => String(p.codigo) === texto.replace(/^#/, ""));
    if (porBarras.has(texto)) return void agregar(porBarras.get(texto) as ProductoMostrador);
    if (delCodigo) return void agregar(delCodigo);
    if (visibles.length === 1) return void agregar(visibles[0]);
    // Parece un código de barras (sin espacios, y largo) que no está entre los cargados.
    if (!/\s/.test(texto) && texto.length >= 6 && (await resolverCodigo(texto))) return;
    setConsulta(texto);
  }

  async function cobrar() {
    if (cobrando || !detalle.length || descuentoInvalido) return;
    setCobrando(true);
    setError("");
    const r = await cobrarVenta({
      items: detalle.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad })),
      descuento,
      metodo,
    });
    setCobrando(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setRecibo({ codigo: r.codigo, total, cambio });
    setLineas([]);
    setConDescuento(false);
    setTextoDescuento("");
    setRecibido("");
  }

  function nuevaVenta() {
    setRecibo(null);
    entrada.current?.focus();
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-x-6">
      {/* Buscar y escanear */}
      <div className="flex flex-col gap-3 lg:col-start-1 lg:row-start-1">
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t.buscarEtiqueta}</span>
            <Icon nombre="buscar" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-texto-2" />
            <input
              ref={entrada}
              type="search"
              inputMode="search"
              autoComplete="off"
              autoFocus
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              // El autocompletar del navegador dispara eventos sin `key`: se ignoran.
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void alEnter();
                }
              }}
              placeholder={t.buscar}
              className="h-12 w-full rounded-full border-2 border-teal-oscuro bg-superficie pl-12 pr-4 text-base"
            />
          </label>
          {hayCamara && (
            <Button type="button" variante="secundario" onClick={() => setCamara((c) => !c)} aria-pressed={camara} aria-label={t.escanear} title={t.escanear}>
              <Icon nombre="camara" className="size-5" />
            </Button>
          )}
        </div>

        <ChipCaja cajaDesde={cajaDesde} />

        {camara && <EscanerCamara alLeer={(c) => void resolverCodigo(c)} cerrar={() => setCamara(false)} />}

        {codigoNuevo && (
          <AsociarCodigo
            codigo={codigoNuevo}
            productos={todos}
            puedeGestionar={puedeGestionar}
            cerrar={() => setCodigoNuevo(null)}
            alAsociar={(p) => {
              setExtras((e) => [...e, { ...p, codigoBarras: codigoNuevo }]);
              setCodigoNuevo(null);
              avisar(t.barras.asociado(nombreCompleto(p)), { tipo: "exito" });
              agregar({ ...p, codigoBarras: codigoNuevo });
            }}
          />
        )}
      </div>

      {/* La venta */}
      <section
        aria-label={t.carrito}
        className={`${TARJETA} bg-crema flex flex-col gap-4 lg:sticky lg:top-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start`}
      >
        {recibo ? (
          <ReciboVenta recibo={recibo} nuevaVenta={nuevaVenta} />
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">{t.carrito}</h2>
              {detalle.length > 0 && (
                <button type="button" onClick={() => setLineas([])} className="min-h-11 px-2 text-sm font-medium text-teal underline underline-offset-2">
                  {t.vaciar}
                </button>
              )}
            </div>

            {detalle.length === 0 ? (
              <p className="text-texto-2">{t.carritoVacio}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {detalle.map((l) => (
                  <li key={l.productoId} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{nombreCompleto(l.producto)}</p>
                      <p className="text-sm text-texto-2">{formatearDolares(l.producto.precio)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(l.productoId, -1)}
                        aria-label={l.cantidad === 1 ? t.quitar(nombreCompleto(l.producto)) : t.menosUno(nombreCompleto(l.producto))}
                        className="grid size-11 place-items-center rounded-full border-2 border-teal-oscuro bg-superficie text-lg font-bold"
                      >
                        {l.cantidad === 1 ? <Icon nombre="x" className="size-4" /> : "−"}
                      </button>
                      <span className="w-7 text-center font-bold tabular-nums">{l.cantidad}</span>
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(l.productoId, 1)}
                        aria-label={t.masUno(nombreCompleto(l.producto))}
                        className="grid size-11 place-items-center rounded-full border-2 border-teal-oscuro bg-superficie text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                    <p className="w-16 text-right font-bold tabular-nums">{formatearDolares(l.producto.precio * l.cantidad)}</p>
                  </li>
                ))}
              </ul>
            )}

            {detalle.length > 0 && (
              <>
                <dl className="flex flex-col gap-1.5 border-t-2 border-dashed border-teal-oscuro/30 pt-3">
                  <div className="flex justify-between text-texto-2">
                    <dt>{t.subtotal}</dt>
                    <dd className="tabular-nums">{formatearDolares(subtotal)}</dd>
                  </div>
                  {descuento > 0 && (
                    <div className="flex justify-between text-texto-2">
                      <dt>{t.descuento}</dt>
                      <dd className="tabular-nums">−{formatearDolares(descuento)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold">
                    <dt>{t.total}</dt>
                    <dd className="tabular-nums">{formatearDolares(total)}</dd>
                  </div>
                </dl>

                {conDescuento ? (
                  <fieldset className="flex flex-col gap-2">
                    <legend className="sr-only">{t.descuento}</legend>
                    <div className="flex gap-2">
                      {(["monto", "porcentaje"] as const).map((tipo) => (
                        <button
                          key={tipo}
                          type="button"
                          aria-pressed={tipoDescuento === tipo}
                          onClick={() => setTipoDescuento(tipo)}
                          className={`min-h-11 flex-1 rounded-full border-2 border-teal-oscuro px-3 text-sm font-medium ${tipoDescuento === tipo ? "bg-limon font-bold" : "bg-superficie"}`}
                        >
                          {tipo === "monto" ? t.descuentoMonto : t.descuentoPorcentaje}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        inputMode="decimal"
                        value={textoDescuento}
                        onChange={(e) => setTextoDescuento(e.target.value)}
                        aria-label={t.descuentoValor}
                        aria-invalid={descuentoInvalido || undefined}
                        placeholder={tipoDescuento === "monto" ? "$0.00" : "10 %"}
                        className="h-12 min-w-0 flex-1 rounded-[14px] border-2 border-borde-control bg-superficie px-4 text-base focus:border-teal"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setConDescuento(false);
                          setTextoDescuento("");
                        }}
                        className="min-h-11 px-2 text-sm font-medium text-teal underline underline-offset-2"
                      >
                        {t.quitarDescuento}
                      </button>
                    </div>
                    {descuentoInvalido && <p className="text-sm text-error">{t.descuentoInvalido}</p>}
                  </fieldset>
                ) : (
                  <button type="button" onClick={() => setConDescuento(true)} className="min-h-11 self-start text-sm font-medium text-teal underline underline-offset-2">
                    {t.agregarDescuento}
                  </button>
                )}

                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 text-sm font-medium">{t.metodo}</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {METODOS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        aria-pressed={metodo === m}
                        onClick={() => setMetodo(m)}
                        className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-teal-oscuro px-1 text-sm ${metodo === m ? "bg-limon font-bold" : "bg-superficie"}`}
                      >
                        <Icon nombre={ICONO_METODO[m]} className="size-5" />
                        {t.metodos[m]}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {metodo === "efectivo" && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="recibido" className="text-sm font-medium">
                      {t.recibido} <span className="font-normal text-texto-2">· {t.recibidoAyuda}</span>
                    </label>
                    <input
                      id="recibido"
                      inputMode="decimal"
                      value={recibido}
                      onChange={(e) => setRecibido(e.target.value)}
                      placeholder="$0.00"
                      className="h-12 rounded-[14px] border-2 border-borde-control bg-superficie px-4 text-base focus:border-teal"
                    />
                    {cambio !== null && <p className="font-bold text-teal">{t.cambio(formatearDolares(cambio))}</p>}
                    {faltaRecibido !== null && <p className="text-sm text-error">{t.faltaRecibido(formatearDolares(faltaRecibido))}</p>}
                  </div>
                )}

                {error && (
                  <p role="alert" className="rounded-xl bg-error-fondo p-3 text-sm text-error">
                    {error}
                  </p>
                )}

                <Button type="button" variante="mango" onClick={cobrar} disabled={cobrando || descuentoInvalido} className="w-full">
                  {cobrando ? t.cobrando : t.cobrar(formatearDolares(total))}
                </Button>
                <p className="text-center text-xs text-texto-2" aria-live="polite">
                  {unidades === 1 ? "1 unidad" : `${unidades} unidades`}
                </p>
              </>
            )}
          </>
        )}
      </section>

      {/* Productos */}
      <section aria-label={t.titulo} className="lg:col-start-1 lg:row-start-2">
        {!todos.length ? (
          <p className="text-texto-2">{t.sinProductos}</p>
        ) : !visibles.length ? (
          <p className="text-texto-2">{t.sinResultados}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {visibles.map((p) => {
              const enVenta = lineas.find((l) => l.productoId === p.id)?.cantidad ?? 0;
              return (
                <li key={p.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => agregar(p)}
                    className="relative flex h-full w-full flex-col overflow-hidden rounded-[20px] border-2 border-teal-oscuro bg-superficie text-left transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
                  >
                    <div className="relative aspect-square w-full bg-teal-fondo">
                      {p.foto ? (
                        <Image src={urlFoto(p.foto)} alt="" fill sizes="(min-width: 1280px) 15vw, (min-width: 640px) 25vw, 45vw" className="object-cover" />
                      ) : (
                        <div className="grid size-full place-items-center text-teal">
                          <Icon nombre="productos" className="size-8" />
                        </div>
                      )}
                      {enVenta > 0 && (
                        <span className="absolute right-2 top-2 grid size-8 place-items-center rounded-full border-2 border-teal-oscuro bg-mango text-sm font-bold">{enVenta}</span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5 p-3">
                      <p className="line-clamp-2 text-sm font-medium">{nombreCompleto(p)}</p>
                      <p className="mt-auto font-bold tabular-nums">{formatearDolares(p.precio)}</p>
                      <p className="text-xs text-texto-2">{t.quedan(p.disponibles)}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function ChipCaja({ cajaDesde }: { cajaDesde: string | null }) {
  return (
    <Link
      href="/mostrador/caja"
      className={`flex min-h-11 items-center gap-2 self-start rounded-full border-2 border-teal-oscuro px-4 text-sm font-medium ${cajaDesde ? "bg-teal-fondo" : "bg-limon"}`}
    >
      <Icon nombre={cajaDesde ? "efectivo" : "alerta"} className="size-4" />
      {cajaDesde ? t.caja.abierta(formatearHora(new Date(cajaDesde))) : t.caja.cerradaCorto}
      <span className="font-bold underline underline-offset-2">{cajaDesde ? t.caja.ver : t.caja.abrir}</span>
    </Link>
  );
}

function ReciboVenta({ recibo, nuevaVenta }: { recibo: Recibo; nuevaVenta: () => void }) {
  const r = t.recibo;
  return (
    <div className="flex flex-col items-center gap-3 text-center" role="status">
      <Monito nombre="thumbsup" className="w-24 text-teal" />
      <h2 className="text-xl font-bold">{r.titulo}</h2>
      <p className="text-texto-2">{r.monito}</p>
      <dl className="w-full rounded-2xl border-2 border-dashed border-teal-oscuro/40 bg-superficie p-4">
        <div className="flex justify-between">
          <dt className="text-texto-2">{r.pedido(recibo.codigo)}</dt>
        </div>
        <div className="mt-1 flex justify-between text-lg font-bold">
          <dt>{r.total}</dt>
          <dd className="tabular-nums">{formatearDolares(recibo.total)}</dd>
        </div>
        {recibo.cambio !== null && recibo.cambio > 0 && (
          <div className="mt-1 flex justify-between font-bold text-teal">
            <dt>{r.cambio}</dt>
            <dd className="tabular-nums">{formatearDolares(recibo.cambio)}</dd>
          </div>
        )}
      </dl>
      <Button type="button" variante="mango" onClick={nuevaVenta} className="w-full">
        {r.nueva}
      </Button>
      <ButtonLink href={`/pedidos/${recibo.codigo}`} variante="secundario" className="w-full">
        {r.verPedido}
      </ButtonLink>
    </div>
  );
}

/** Un código que no está en ningún producto: se ofrece asociarlo a uno (solo dueña y administradora). */
function AsociarCodigo({
  codigo,
  productos,
  puedeGestionar,
  cerrar,
  alAsociar,
}: {
  codigo: string;
  productos: ProductoMostrador[];
  puedeGestionar: boolean;
  cerrar: () => void;
  alAsociar: (producto: ProductoMostrador) => void;
}) {
  const b = t.barras;
  const [elegido, setElegido] = useState("");
  const [busca, setBusca] = useState("");
  const [error, setError] = useState("");
  const [pendiente, setPendiente] = useState(false);
  const q = normalizar(busca.trim());
  const opciones = (q ? productos.filter((p) => normalizar(`${p.nombre} ${p.variante ?? ""} ${p.codigo}`).includes(q)) : productos).slice(0, 6);

  async function asociar() {
    const p = productos.find((x) => x.id === elegido);
    if (!p || pendiente) return;
    setPendiente(true);
    setError("");
    const r = await asociarCodigoDeBarras(p.id, codigo);
    setPendiente(false);
    if (!r.ok) return setError(r.error);
    alAsociar(p);
  }

  return (
    <div className={`${TARJETA} flex flex-col gap-3 bg-limon`} role="alert">
      <p className="font-bold">{b.nuevo(codigo)}</p>
      {!puedeGestionar ? (
        <>
          <p className="text-sm">{b.soloGestion}</p>
          <Button type="button" variante="secundario" onClick={cerrar}>
            {b.descartar}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm">{b.pregunta}</p>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label={b.elegir}
            placeholder={b.elegir}
            className="h-12 rounded-[14px] border-2 border-teal-oscuro bg-superficie px-4 text-base"
          />
          <ul className="flex flex-col gap-1.5">
            {opciones.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={elegido === p.id}
                  onClick={() => setElegido(p.id)}
                  className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border-2 border-teal-oscuro px-3 text-left text-sm ${elegido === p.id ? "bg-mango font-bold" : "bg-superficie"}`}
                >
                  <span className="truncate">{nombreCompleto(p)}</span>
                  <span className="tabular-nums">#{p.codigo}</span>
                </button>
              </li>
            ))}
          </ul>
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variante="mango" onClick={asociar} disabled={!elegido || pendiente} className="flex-1">
              {pendiente ? b.asociando : b.asociar}
            </Button>
            <Button type="button" variante="secundario" onClick={cerrar}>
              {b.descartar}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
