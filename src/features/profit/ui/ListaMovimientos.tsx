import Link from "next/link";
import { Fragment } from "react";
import { Card } from "@/components/ui/Card";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import type { Movimiento, MetodoMovimiento } from "@/domain";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.dinero;

/** La fecha del movimiento es un día (no una hora): al mediodía UTC cae el mismo día en El Salvador. */
const diaDe = (fecha: string) => new Date(`${fecha}T12:00:00Z`);

const aparte = textos.gestion.libro;

const ICONO_METODO: Record<MetodoMovimiento, NombreIcono> = { efectivo: "efectivo", transferencia: "banco" };

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


/** El círculo de cada fila: limón si entró, rosa si salió, con el ícono de dónde estaba el dinero. */
function Icono({ m }: { m: Movimiento }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro ${m.tipo === "traslado" ? "bg-fondo" : entra(m) ? "bg-limon" : "bg-rosa"}`}
    >
      <Icon nombre={m.tipo === "traslado" ? "flecha" : m.metodo ? ICONO_METODO[m.metodo] : "moneda"} className="size-5" />
    </span>
  );
}

/** Verde con + para lo que entró y rojo con − para lo que salió: el signo dice lo mismo que el color. */
function Monto({ m }: { m: Movimiento }) {
  if (m.tipo === "traslado") return <span className="whitespace-nowrap font-bold tabular-nums">{formatearDolares(m.monto)}</span>;
  const entrada = entra(m);
  return (
    <span className={`whitespace-nowrap font-bold tabular-nums ${entrada ? "text-teal" : "text-error"}`}>
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
      <span className="block line-clamp-2 text-sm text-texto-2">{subtitulo(m, conFecha)}</span>
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
    if (m.tipo === "entrada" || m.tipo === "salida") dia.neto += m.tipo === "entrada" ? m.monto : -m.monto;
  }
  return dias;
}

function etiquetaDelDia(fecha: string, hoy: string): string {
  if (fecha === hoy) return t.hoy;
  const ayer = new Date(diaDe(hoy).getTime() - 86_400_000).toISOString().slice(0, 10);
  return fecha === ayer ? t.ayer : formatearFecha(diaDe(fecha));
}

function NetoDelDia({ neto }: { neto: number }) {
  return (
    <span className={`font-bold tabular-nums ${neto < 0 ? "text-error" : "text-teal"}`}>
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
}: {
  movimientos: Movimiento[];
  hoy: string;
  /** Pone el día en cada fila, no solo en el encabezado del grupo */
  conFecha?: boolean;
  /** El nombre de cada cuenta por su id */
  nombresDeCuenta?: Record<string, string>;
}) {
  const dias = porDia(movimientos);
  return (
    <div className="@container">
      <Card className="hidden overflow-hidden p-0 md:p-0 @2xl:block">
        <table className="w-full text-left">
          <thead className="sr-only">
            <tr>
              <th scope="col">{t.columnas.concepto}</th>
              <th scope="col">{t.columnas.metodo}</th>
              <th scope="col">{t.columnas.monto}</th>
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
