"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Monito } from "@/components/ui/Monito";
import { StatusChip } from "@/components/ui/StatusChip";
import type { EstadoPedido } from "@/domain";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import {
  estadosDePedidos,
  pedidosDelComprador,
} from "../actions/estadosPedidos";
import {
  olvidarPedido,
  usePedidosGuardados,
  type PedidoGuardado,
} from "../pedidosGuardados";

const t = textos.explorar.misPedidos;

/** Los pedidos que esta persona hizo desde este navegador, con en qué va cada uno y el enlace a su seguimiento. */
export function MisPedidos() {
  const locales = usePedidosGuardados();
  const [delServidor, setDelServidor] = useState<PedidoGuardado[]>([]);
  // Los que el servidor tiene de esta persona (por su cuenta o su dispositivo) se suman a los del navegador
  useEffect(() => {
    let vigente = true;
    pedidosDelComprador()
      .then((l) => vigente && setDelServidor(l))
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, []);
  const idsServidor = new Set(delServidor.map((p) => p.id));
  const pedidos = [
    ...delServidor,
    ...locales.filter((p) => !idsServidor.has(p.id)),
  ].sort((a, b) => b.fecha - a.fecha);
  const [estados, setEstados] = useState<Record<string, EstadoPedido>>({});
  // Una sola consulta con todos los ids; si falla, la lista se ve igual, sin estado
  const ids = pedidos.map((p) => p.id).join(",");
  useEffect(() => {
    if (!ids) return;
    let vigente = true;
    estadosDePedidos(ids.split(","))
      .then((e) => vigente && setEstados(e))
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [ids]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pt-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-logo text-3xl font-semibold leading-tight md:text-4xl">
          {t.titulo}
        </h1>
        <p className="text-texto-2">{t.ayuda}</p>
      </header>

      {pedidos.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-[22px] border-2 border-teal-oscuro bg-white p-8 text-center shadow-dura-chica">
          <Monito nombre="caja" className="w-20 text-teal/50" />
          <h2 className="font-logo text-xl font-semibold">{t.vacioTitulo}</h2>
          <p className="max-w-md text-texto-2">{t.vacioTexto}</p>
          <Link
            href="/marketplace"
            className="inline-flex min-h-11 items-center rounded-full border-2 border-teal-oscuro bg-accion px-6 font-bold text-accion-texto shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura"
          >
            {t.explorar}
          </Link>
        </section>
      ) : (
        <ul className="flex flex-col gap-4">
          {pedidos.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 rounded-[22px] border-2 border-teal-oscuro bg-white p-4 shadow-dura-chica sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-logo text-lg font-semibold">
                    {t.pedido(p.codigo)}
                  </span>
                  {estados[p.id] && (
                    <StatusChip publico estado={estados[p.id]} />
                  )}
                </p>
                <p className="text-sm font-bold text-teal">{p.tienda}</p>
                <p className="line-clamp-2 text-sm text-texto-2">{p.resumen}</p>
                <p className="text-sm tabular-nums text-texto-2">
                  {formatearFecha(new Date(p.fecha))} ·{" "}
                  <span className="font-bold text-texto">
                    {formatearDolares(p.total)}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {!idsServidor.has(p.id) && (
                  <button
                    type="button"
                    onClick={() => olvidarPedido(p.id)}
                    aria-label={t.olvidarPedido(p.codigo)}
                    className="min-h-11 px-2 text-sm font-bold text-texto-2 underline hover:text-texto"
                  >
                    {t.olvidar}
                  </button>
                )}
                <Link
                  href={`/p/${p.id}`}
                  className="inline-flex min-h-11 items-center rounded-full border-2 border-teal-oscuro bg-accion px-5 text-sm font-bold text-accion-texto shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura"
                >
                  {t.verSeguimiento}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pedidos.length > 0 && <p className="text-xs text-texto-2">{t.nota}</p>}
    </div>
  );
}
