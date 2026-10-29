"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { TARJETA } from "@/components/ui/tarjeta";
import {
  cambioDe,
  descuentoEnCentavos,
  leerDolares,
  limpiarCodigoDeBarras,
  totalDeLineas,
  type Descuento,
} from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { buscarPorCodigoDeBarras, cobrarVenta } from "../actions/vender";
import {
  coincide,
  leerDescuento,
  nombreCompleto,
  normalizar,
  type Linea,
  type Recibo,
} from "../mostrador";
import type { MetodoMostrador, ProductoMostrador } from "../repositorio";
import { AsociarCodigo } from "./AsociarCodigo";
import { ChipCaja } from "./ChipCaja";
import { DescuentoVenta } from "./DescuentoVenta";
import { camaraDisponible, EscanerCamara } from "./EscanerCamara";
import { MetodoDeCobro } from "./MetodoDeCobro";
import { ProductosDelMostrador } from "./ProductosDelMostrador";
import { ReciboVenta } from "./ReciboVenta";

const t = textos.mostrador;
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
  const [tipoDescuento, setTipoDescuento] =
    useState<Descuento["tipo"]>("monto");
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
  const porBarras = useMemo(
    () =>
      new Map(
        todos
          .filter((p) => p.codigoBarras)
          .map((p) => [p.codigoBarras as string, p]),
      ),
    [todos],
  );

  const q = normalizar(consulta.trim());
  const visibles = useMemo(
    () => (q ? todos.filter((p) => coincide(p, q)) : todos),
    [todos, q],
  );

  const detalle = lineas.flatMap((l) => {
    const p = porId.get(l.productoId);
    return p ? [{ ...l, producto: p }] : [];
  });
  const subtotal = totalDeLineas(detalle.map((l) => ({ precio: l.producto.precio, cantidad: l.cantidad })));
  const unidades = detalle.reduce((s, l) => s + l.cantidad, 0);

  const descuentoLeido = conDescuento
    ? leerDescuento(tipoDescuento, textoDescuento)
    : null;
  const descuentoInvalido = descuentoLeido === "invalido";
  const descuento =
    descuentoLeido && descuentoLeido !== "invalido"
      ? descuentoEnCentavos(subtotal, descuentoLeido)
      : 0;
  const total = subtotal - descuento;

  const recibidoLeido =
    metodo === "efectivo" && recibido.trim() ? leerDolares(recibido) : null;
  const cambio = recibidoLeido === null ? null : cambioDe(total, recibidoLeido);
  const faltaRecibido =
    recibidoLeido !== null && cambio === null ? total - recibidoLeido : null;

  function agregar(p: ProductoMostrador) {
    setRecibo(null);
    setError("");
    const actual =
      lineasVigentes.current.find((l) => l.productoId === p.id)?.cantidad ?? 0;
    if (actual >= p.disponibles) {
      avisar(t.tope(nombreCompleto(p), p.disponibles), { tipo: "info" });
      return;
    }
    setLineas((ls) =>
      actual === 0
        ? [...ls, { productoId: p.id, cantidad: 1 }]
        : ls.map((l) =>
            l.productoId === p.id ? { ...l, cantidad: l.cantidad + 1 } : l,
          ),
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
    const delCodigo = todos.find(
      (p) => String(p.codigo) === texto.replace(/^#/, ""),
    );
    if (porBarras.has(texto))
      return void agregar(porBarras.get(texto) as ProductoMostrador);
    if (delCodigo) return void agregar(delCodigo);
    if (visibles.length === 1) return void agregar(visibles[0]);
    // Parece un código de barras (sin espacios, y largo) que no está entre los cargados.
    if (!/\s/.test(texto) && texto.length >= 6 && (await resolverCodigo(texto)))
      return;
    setConsulta(texto);
  }

  async function cobrar() {
    if (cobrando || !detalle.length || descuentoInvalido) return;
    setCobrando(true);
    setError("");
    const r = await cobrarVenta({
      items: detalle.map((l) => ({
        productoId: l.productoId,
        cantidad: l.cantidad,
      })),
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
            <Icon
              nombre="buscar"
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-texto-2"
            />
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
            <Button
              type="button"
              variante="secundario"
              onClick={() => setCamara((c) => !c)}
              aria-pressed={camara}
              aria-label={t.escanear}
              title={t.escanear}
            >
              <Icon nombre="camara" className="size-5" />
            </Button>
          )}
        </div>

        <ChipCaja cajaDesde={cajaDesde} />

        {camara && (
          <EscanerCamara
            alLeer={(c) => void resolverCodigo(c)}
            cerrar={() => setCamara(false)}
          />
        )}

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
                <button
                  type="button"
                  onClick={() => setLineas([])}
                  className="min-h-11 px-2 text-sm font-medium text-teal underline underline-offset-2"
                >
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
                      <p className="truncate font-medium">
                        {nombreCompleto(l.producto)}
                      </p>
                      <p className="text-sm text-texto-2">
                        {formatearDolares(l.producto.precio)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(l.productoId, -1)}
                        aria-label={
                          l.cantidad === 1
                            ? t.quitar(nombreCompleto(l.producto))
                            : t.menosUno(nombreCompleto(l.producto))
                        }
                        className="grid size-11 place-items-center rounded-full border-2 border-teal-oscuro bg-superficie text-lg font-bold"
                      >
                        {l.cantidad === 1 ? (
                          <Icon nombre="x" className="size-4" />
                        ) : (
                          "−"
                        )}
                      </button>
                      <span className="w-7 text-center font-bold tabular-nums">
                        {l.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(l.productoId, 1)}
                        aria-label={t.masUno(nombreCompleto(l.producto))}
                        className="grid size-11 place-items-center rounded-full border-2 border-teal-oscuro bg-superficie text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                    <p className="w-16 text-right font-bold tabular-nums">
                      {formatearDolares(l.producto.precio * l.cantidad)}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {detalle.length > 0 && (
              <>
                <dl className="flex flex-col gap-1.5 border-t-2 border-dashed border-teal-oscuro/30 pt-3">
                  <div className="flex justify-between text-texto-2">
                    <dt>{t.subtotal}</dt>
                    <dd className="tabular-nums">
                      {formatearDolares(subtotal)}
                    </dd>
                  </div>
                  {descuento > 0 && (
                    <div className="flex justify-between text-texto-2">
                      <dt>{t.descuento}</dt>
                      <dd className="tabular-nums">
                        −{formatearDolares(descuento)}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold">
                    <dt>{t.total}</dt>
                    <dd className="tabular-nums">{formatearDolares(total)}</dd>
                  </div>
                </dl>

                <DescuentoVenta
                  activo={conDescuento}
                  tipo={tipoDescuento}
                  texto={textoDescuento}
                  invalido={descuentoInvalido}
                  activar={() => setConDescuento(true)}
                  quitar={() => {
                    setConDescuento(false);
                    setTextoDescuento("");
                  }}
                  cambiarTipo={setTipoDescuento}
                  cambiarTexto={setTextoDescuento}
                />

                <MetodoDeCobro
                  metodo={metodo}
                  cambiarMetodo={setMetodo}
                  recibido={recibido}
                  cambiarRecibido={setRecibido}
                  cambio={cambio}
                  faltaRecibido={faltaRecibido}
                />

                {error && (
                  <p
                    role="alert"
                    className="rounded-xl bg-error-fondo p-3 text-sm text-error"
                  >
                    {error}
                  </p>
                )}

                <Button
                  type="button"
                  variante="mango"
                  onClick={cobrar}
                  disabled={cobrando || descuentoInvalido}
                  className="w-full"
                >
                  {cobrando ? t.cobrando : t.cobrar(formatearDolares(total))}
                </Button>
                <p
                  className="text-center text-xs text-texto-2"
                  aria-live="polite"
                >
                  {unidades === 1 ? "1 unidad" : `${unidades} unidades`}
                </p>
              </>
            )}
          </>
        )}
      </section>

      {/* Productos */}
      <section aria-label={t.titulo} className="lg:col-start-1 lg:row-start-2">
        <ProductosDelMostrador
          todos={todos}
          visibles={visibles}
          lineas={lineas}
          agregar={agregar}
        />
      </section>
    </div>
  );
}
