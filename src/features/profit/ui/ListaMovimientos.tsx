import Link from "next/link";
import { Fragment } from "react";
import { Card } from "@/components/ui/Card";
import { coloresDinero } from "@/components/ui/coloresDinero";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { sinMoverDinero, type ClaseAparte, type Movimiento } from "@/domain";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.dinero;

/** La fecha del movimiento es un día (no una hora): al mediodía UTC cae el mismo día en El Salvador. */
const diaDe = (fecha: string) => new Date(`${fecha}T12:00:00Z`);

const aparte = textos.gestion.libro;

/** El ícono dice qué fue el movimiento (no con qué se pagó: eso ya lo dice la cuenta de al lado). */
const ICONO_CLASE: Record<ClaseAparte, NombreIcono> = {
  prestamo: "billetera",
  pago_deuda: "balanza",
  deuda: "balanza",
  compra: "caja",
  ajuste: "editar",
  paquetera: "camion",
  pago_tarjeta: "tarjeta",
  saldo_inicial: "banco",
};
const ICONO_GASTO: Record<string, NombreIcono> = { empaque: "caja", publicidad: "campana", transporte: "camion", local: "tienda", comisiones: "etiqueta" };

function iconoDe(m: Movimiento): NombreIcono {
  if (m.tipo === "traslado") return "intercambio";
  if (m.tipo === "aparte") return ICONO_CLASE[m.clase] ?? "moneda";
  if (m.tipo === "salida") return ICONO_GASTO[m.categoria] ?? "moneda";
  return m.clase === "abono" ? "moneda" : "carrito";
}

/** De qué cuenta es el movimiento; si no se sabe (lo de antes de las cuentas), el método. Un traslado dice que es entre cuentas. */
function ChipCuenta({ m, nombres }: { m: Movimiento; nombres: Record<string, string> }) {
  const texto =
    m.tipo === "traslado"
      ? aparte.trasladoChip
      : ((m.cuenta ? nombres[m.cuenta] : undefined) ?? (m.metodo ? t.metodos[m.metodo] : t.sinMetodo));
  return <span className="inline-flex items-center gap-1 rounded-full bg-fondo px-3 py-1 text-sm font-bold text-teal-oscuro">{texto}</span>;
}

/** Si el dinero entró (un pago, un préstamo o un ajuste a favor) o salió. */
const entra = (m: Movimiento) => (m.tipo === "aparte" ? m.sentido === "entra" : m.tipo === "entrada");

/** Entra, sale u otros (traslados y lo que no movió dinero): de ahí salen todos los colores de la fila. */
const sentidoDe = (m: Movimiento) => (m.tipo === "traslado" || sinMoverDinero(m) ? "otros" : entra(m) ? "entra" : "sale");

/** El círculo de cada fila: amarillo si entró, rosa si salió, celeste si no movió dinero, con un ícono de qué fue (venta, abono, gasto, traslado…). */
function Icono({ m }: { m: Movimiento }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro ${coloresDinero[sentidoDe(m)].fondo}`}
    >
      <Icon nombre={iconoDe(m)} className="size-5" />
    </span>
  );
}

/** Verde con + para lo que entró y rojo con − para lo que salió: el signo dice lo mismo que el color. */
function Monto({ m }: { m: Movimiento }) {
  if (sentidoDe(m) === "otros") return <span className={`whitespace-nowrap font-bold tabular-nums ${coloresDinero.otros.texto}`}>{formatearDolares(m.monto)}</span>;
  const entrada = entra(m);
  return (
    <span className={`whitespace-nowrap font-bold tabular-nums ${coloresDinero[entrada ? "entra" : "sale"].texto}`}>
      <span className="sr-only">{entrada ? t.entradaSigno : t.salidaSigno}: </span>
      <span aria-hidden="true">{entrada ? "+" : "−"}</span>
      {formatearDolares(m.monto)}
    </span>
  );
}

function titulo(m: Movimiento): string {
  if (m.tipo === "aparte" || m.tipo === "traslado") return m.titulo;
  if (m.tipo === "salida") return m.nota ?? textos.ganancia.categorias[m.categoria as keyof typeof textos.ganancia.categorias] ?? m.categoria;
  return m.cliente ?? t.concepto.pedido(m.pedidoCodigo);
}

function subtitulo(m: Movimiento, conFecha: boolean): string {
  const base = detalle(m);
  return conFecha ? `${formatearFecha(diaDe(m.fecha))} · ${base}` : base;
}

function detalle(m: Movimiento): string {
  if (m.tipo === "traslado") return aparte.trasladoDetalle;
  if (m.tipo === "aparte") return `${aparte.aparte} · ${aparte.clases[m.clase]}`;
  if (m.tipo === "salida") {
    const categoria = textos.ganancia.categorias[m.categoria as keyof typeof textos.ganancia.categorias] ?? m.categoria;
    return t.concepto.gasto(categoria);
  }
  const base = m.clase === "abono" ? t.concepto.abono(formatearDolares(m.saldoDespues)) : t.concepto.venta;
  return m.producto ? `${base} · ${m.producto}` : base;
}

type Entrada = Extract<Movimiento, { tipo: "entrada" }>;

/** «Venta completa» o «Abono» y, en la venta, lo que deja; en el abono, lo que falta por cobrar. */
function EtiquetasDeVenta({ m }: { m: Entrada }) {
  const venta = m.clase === "venta";
  return (
    <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-bold">
      <span className={`rounded-full border-2 border-teal-oscuro px-2 py-0.5 ${venta ? coloresDinero.entra.fondo : "bg-perla"}`}>
        {venta ? t.concepto.ventaCompleta : t.concepto.abonoChip}
      </span>
      {!venta && <span className="text-texto-2">{t.concepto.queda(formatearDolares(m.saldoDespues))}</span>}
      {venta && m.ganancia !== null && <span className={m.ganancia < 0 ? "text-error" : coloresDinero.entra.texto}>{t.concepto.ganancia(formatearDolares(m.ganancia))}</span>}
    </span>
  );
}

const Concepto = ({ m, conFecha }: { m: Movimiento; conFecha: boolean }) => (
  <div className="flex min-w-0 items-center gap-3">
    <Icono m={m} />
    <div className="min-w-0">
      {m.tipo === "entrada" ? (
        <Link href={`/pedidos/${m.pedidoCodigo}`} className="block truncate font-bold text-teal-oscuro underline decoration-teal/40 hover:decoration-teal">
          {titulo(m)}
        </Link>
      ) : (
        <span className="block truncate font-bold">{titulo(m)}</span>
      )}
      {m.tipo === "entrada" ? (
        <>
          <span className="block text-sm text-texto-2">{conFecha ? `${formatearFecha(diaDe(m.fecha))} · ${t.concepto.pedido(m.pedidoCodigo)}` : t.concepto.pedido(m.pedidoCodigo)}</span>
          <EtiquetasDeVenta m={m} />
        </>
      ) : (
        <span className="block line-clamp-2 text-sm text-texto-2">{subtitulo(m, conFecha)}</span>
      )}
    </div>
  </div>
);

type Dia = { fecha: string; movimientos: Movimiento[]; neto: number };

/** Los movimientos agrupados por día, en el orden en que vienen (el más reciente primero). */
function porDia(movimientos: Movimiento[]): Dia[] {
  const dias: Dia[] = [];
  for (const m of movimientos) {
    let dia = dias.at(-1);
    if (!dia || dia.fecha !== m.fecha) {
      dia = { fecha: m.fecha, movimientos: [], neto: 0 };
      dias.push(dia);
    }
    dia.movimientos.push(m);
    if (m.tipo !== "traslado" && !sinMoverDinero(m)) dia.neto += entra(m) ? m.monto : -m.monto;
  }
  return dias;
}

/** Lo que va sumado y restado hasta ese movimiento: va chico, bajo el monto o en su propia columna. */
function Acumulado({ valor }: { valor: number }) {
  return (
    <span className={`whitespace-nowrap text-sm font-bold tabular-nums ${valor < 0 ? "text-error" : "text-texto-2"}`}>
      {valor < 0 ? "−" : ""}
      {formatearDolares(Math.abs(valor))}
    </span>
  );
}

function etiquetaDelDia(fecha: string, hoy: string): string {
  if (fecha === hoy) return t.hoy;
  const ayer = new Date(diaDe(hoy).getTime() - 86_400_000).toISOString().slice(0, 10);
  return fecha === ayer ? t.ayer : formatearFecha(diaDe(fecha));
}

function NetoDelDia({ neto }: { neto: number }) {
  return (
    <span className={`font-bold tabular-nums ${neto < 0 ? "text-error" : coloresDinero.entra.texto}`}>
      {neto < 0 ? "−" : "+"}
      {formatearDolares(Math.abs(neto))}
    </span>
  );
}

/** Tabla cuando hay lugar (ancho del propio contenedor) y lista apilada cuando no, con un encabezado por cada día. */
export function ListaMovimientos({
  movimientos,
  hoy,
  conFecha = false,
  nombresDeCuenta = {},
  acumulados,
}: {
  movimientos: Movimiento[];
  hoy: string;
  /** Pone el día en cada fila, no solo en el encabezado del grupo */
  conFecha?: boolean;
  /** El nombre de cada cuenta por su id */
  nombresDeCuenta?: Record<string, string>;
  /** Lo acumulado hasta cada movimiento (clave `tipo-id`): con esto la lista suma y resta a medida que avanza */
  acumulados?: Record<string, number>;
}) {
  const dias = porDia(movimientos);
  return (
    <div className="@container">
      <Card className="hidden overflow-hidden p-0 md:p-0 @2xl:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-teal-oscuro text-sm font-extrabold text-texto-2">
              <th scope="col" className="px-4 py-3">
                {t.columnas.concepto}
              </th>
              <th scope="col" className="px-2 py-3">
                {t.columnas.metodo}
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                {t.columnas.monto}
              </th>
              {acumulados && (
                <th scope="col" className="px-4 py-3 text-right">
                  {t.columnas.acumulado}
                </th>
              )}
            </tr>
          </thead>
          {dias.map((d) => (
            <tbody key={d.fecha}>
              <tr className="bg-fondo">
                <th scope="colgroup" colSpan={2} className="px-4 py-2 text-left text-sm font-extrabold">
                  {etiquetaDelDia(d.fecha, hoy)}
                </th>
                <td className="px-4 py-2 text-right text-sm">
                  <NetoDelDia neto={d.neto} />
                </td>
                {acumulados && (
                  <td className="px-4 py-2 text-right">
                    <Acumulado valor={acumulados[`${d.movimientos[0].tipo}-${d.movimientos[0].id}`]} />
                  </td>
                )}
              </tr>
              {d.movimientos.map((m) => (
                <tr key={`${m.tipo}-${m.id}`} className="border-t border-borde hover:bg-teal-fondo">
                  <td className="max-w-96 px-4 py-3">
                    <Concepto m={m} conFecha={conFecha} />
                  </td>
                  <td className="px-2 py-3">
                    <ChipCuenta m={m} nombres={nombresDeCuenta} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Monto m={m} />
                  </td>
                  {acumulados && (
                    <td className="px-4 py-3 text-right">
                      <Acumulado valor={acumulados[`${m.tipo}-${m.id}`]} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </Card>

      <Card className="overflow-hidden p-0 md:p-0 @2xl:hidden">
        <ul>
          {dias.map((d) => (
            <Fragment key={d.fecha}>
              <li className="flex items-center justify-between gap-3 bg-fondo px-4 py-2 text-sm">
                <span className="font-extrabold">{etiquetaDelDia(d.fecha, hoy)}</span>
                <NetoDelDia neto={d.neto} />
              </li>
              {d.movimientos.map((m) => (
                <li key={`${m.tipo}-${m.id}`} className="flex items-center justify-between gap-3 border-t border-borde px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <Concepto m={m} conFecha={conFecha} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Monto m={m} />
                    {acumulados && <Acumulado valor={acumulados[`${m.tipo}-${m.id}`]} />}
                    <ChipCuenta m={m} nombres={nombresDeCuenta} />
                  </div>
                </li>
              ))}
            </Fragment>
          ))}
        </ul>
      </Card>
    </div>
  );
}
