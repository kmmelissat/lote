import Link from "next/link";
import { StatusChip } from "@/components/ui/StatusChip";
import { TARJETA_BASE } from "@/components/ui/tarjeta";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { ClienteConResumen } from "../repositorio";
import { inicialDe, tonoDe } from "./cara";

const t = textos.clientes;

function Dato({ etiqueta, valor, fondo }: { etiqueta: string; valor: string | number; fondo: string }) {
  return (
    <div className={`${TARJETA_BASE} ${fondo} p-4 shadow-dura-chica`}>
      <p className="text-sm font-bold">{etiqueta}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">{valor}</p>
    </div>
  );
}

/** La ficha de una clienta: su cara, lo que ha comprado y el historial de pedidos. */
export function FichaCliente({ cliente: c }: { cliente: ClienteConResumen }) {
  return (
    <div className="flex flex-col gap-6">
      <section className={`${TARJETA_BASE} ${tonoDe(c.nombre)} p-5 shadow-dura`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="-rotate-3 flex size-16 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-oscuro bg-white text-3xl font-extrabold text-teal-oscuro shadow-dura-chica">
              {inicialDe(c.nombre)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-2xl font-extrabold leading-tight">{c.nombre}</p>
              <p className="mt-1 font-medium">{c.contacto ?? t.sinContacto}</p>
              {c.resumen.ultimoPedido && (
                <p className="mt-1 text-sm font-medium text-teal-oscuro/80">
                  {t.ultimoPedido}: {formatearFecha(c.resumen.ultimoPedido)}
                </p>
              )}
            </div>
          </div>
          <span className="self-start rotate-2 rounded-full border-2 border-teal-oscuro bg-white px-3 py-1 text-sm font-extrabold shadow-dura-chica">
            {c.resumen.saldo > 0 ? t.debe(formatearDolares(c.resumen.saldo)) : t.alDia}
          </span>
        </div>
      </section>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <li>
          <Dato etiqueta={t.comprado} valor={formatearDolares(c.resumen.comprado)} fondo="bg-limon" />
        </li>
        <li>
          <Dato etiqueta={t.saldo} valor={formatearDolares(c.resumen.saldo)} fondo={c.resumen.saldo > 0 ? "bg-rosa" : "bg-teal-fondo"} />
        </li>
        <li>
          <Dato etiqueta={t.historial} valor={c.resumen.pedidos} fondo="bg-celeste" />
        </li>
      </ul>

      {c.notas && (
        <figure className="relative -rotate-1 bg-limon px-5 pb-5 pt-7 shadow-dura-chica">
          <span aria-hidden="true" className="absolute left-8 top-0 h-4 w-16 -translate-y-1/2 rotate-2 bg-celeste" />
          <figcaption className="text-sm font-bold">{t.notas}</figcaption>
          <p className="mt-1 font-medium leading-relaxed">{c.notas}</p>
        </figure>
      )}

      <section aria-labelledby="historial" className="flex flex-col gap-3">
        <h2 id="historial" className="text-xl font-extrabold">
          {t.historial}
        </h2>
        {!c.pedidos.length ? (
          <p className={`${TARJETA_BASE} border-dashed bg-crema px-5 py-8 text-center text-texto-2`}>{t.sinPedidos}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {c.pedidos.map((p) => (
              <li key={p.codigo}>
                <Link
                  href={`/pedidos/${p.codigo}`}
                  className={`${TARJETA_BASE} flex flex-col gap-2 bg-superficie p-4 shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-extrabold">{textos.pedidos.pedido(p.codigo)}</span>
                    <span className="font-extrabold tabular-nums">{formatearDolares(p.total)}</span>
                  </span>
                  {p.productos && <span className="truncate text-sm text-texto-2">{p.productos}</span>}
                  <span className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <StatusChip estado={p.estado} />
                    <span className="font-medium text-texto-2">
                      {formatearFecha(p.creadoEn)}
                      {p.saldo > 0 && p.estado !== "cancelado" ? ` · ${t.debe(formatearDolares(p.saldo))}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
