import Link from "next/link";
import { StatusChip } from "@/components/ui/StatusChip";
import type { EstadoPedido } from "@/domain";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { cerrarSesionDelMarketplace } from "../actions/cuenta";
import type { DatosDeCuenta } from "../compradorDispositivo";
import { PerfilForm } from "./PerfilForm";

const t = textos.explorar.cuenta;

type PedidoDeCuenta = { id: string; slug: string; tienda: string; codigo: number; total: number; resumen: string; fecha: number; estado: EstadoPedido };

const boton =
  "inline-flex min-h-11 items-center rounded-full border border-teal-oscuro px-6 font-bold shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura";

/** La cuenta de quien compra: quién es, sus datos y su dirección para editar, y sus pedidos recientes. */
export function MiCuenta({ datos, pedidos }: { datos: DatosDeCuenta; pedidos: PedidoDeCuenta[] }) {
  const inicial = (datos.nombre || datos.correo || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pt-4">
      <header className="flex items-center gap-4">
        <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-full border border-teal-oscuro bg-mango font-logo text-3xl font-semibold text-teal-oscuro">
          {inicial}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="truncate font-logo text-3xl font-semibold leading-tight md:text-4xl">{datos.nombre || t.titulo}</h1>
          <p className="flex flex-wrap items-center gap-x-3 text-texto-2">
            <span className="truncate">{datos.correo}</span>
            <span className="rounded-full bg-limon px-2.5 py-0.5 text-xs font-bold text-teal-oscuro">{t.verificada}</span>
          </p>
        </div>
      </header>
      <p className="text-texto-2">{t.ayuda}</p>

      <PerfilForm datos={datos} />

      <section className="flex flex-col gap-4 rounded-[22px] border border-teal-oscuro bg-white p-5 shadow-dura-chica">
        <h2 className="font-logo text-xl font-semibold">{t.pedidosTitulo}</h2>
        {pedidos.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-texto-2">{t.sinPedidos}</p>
            <Link href="/marketplace" className={`${boton} bg-accion text-accion-texto`}>
              {t.explorar}
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex flex-col divide-y-2 divide-teal-oscuro/10">
              {pedidos.slice(0, 5).map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-bold">{t.pedido(p.codigo)}</span>
                      <StatusChip publico estado={p.estado} />
                    </p>
                    <p className="text-sm font-bold text-teal">{p.tienda}</p>
                    <p className="line-clamp-1 text-sm text-texto-2">{p.resumen}</p>
                    <p className="text-sm tabular-nums text-texto-2">
                      {formatearFecha(new Date(p.fecha))} · <span className="font-bold text-texto">{formatearDolares(p.total)}</span>
                    </p>
                  </div>
                  <Link href={`/p/${p.id}`} className="inline-flex min-h-11 items-center rounded-full border border-teal-oscuro bg-white px-4 text-sm font-bold text-teal-oscuro">
                    {textos.explorar.misPedidos.verSeguimiento}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/marketplace/pedidos" className="text-sm font-bold text-teal underline">
              {t.verTodos}
            </Link>
          </>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/marketplace" className={`${boton} bg-white text-teal-oscuro`}>
          {t.seguirComprando}
        </Link>
        <form action={cerrarSesionDelMarketplace} className="ml-auto">
          <button type="submit" className="min-h-11 px-2 text-sm font-bold text-texto-2 underline hover:text-texto">
            {t.cerrarSesion}
          </button>
        </form>
      </div>
    </div>
  );
}
