import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { estiloBoton } from "@/components/ui/Button";
import type { ProductoParado } from "@/domain";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.dinero.cuadre;

export type DeudaDeClienta = { id: string; nombre: string; saldo: number; desde: string; cobro: string | null };

const inicial = (nombre: string) => (nombre.trim()[0] ?? "?").toUpperCase();

/** Quién te debe, la más antigua primero, con el botón que abre WhatsApp con el mensaje armado. */
export function TeDeben({ deudas }: { deudas: DeudaDeClienta[] }) {
  const total = deudas.reduce((s, d) => s + d.saldo, 0);
  return (
    <section aria-labelledby="te-deben" className="overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-superficie">
      <div className="flex items-baseline justify-between gap-3 border-b-2 border-teal-oscuro bg-limon px-4 py-3 md:px-5">
        <h2 id="te-deben" className="font-logo text-lg font-bold">
          {t.cobrarTitulo}
        </h2>
        {deudas.length > 0 && <span className="font-logo text-xl font-bold tabular-nums">{formatearDolares(total)}</span>}
      </div>
      {deudas.length === 0 ? (
        <p className="px-4 py-4 text-texto-2 md:px-5">{t.cobrarVacio}</p>
      ) : (
        <ul>
          {deudas.map((d) => (
            <li key={d.id} className="flex items-center gap-3 border-t border-borde px-4 py-3 first:border-t-0 md:px-5">
              <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-limon font-logo text-lg font-bold">
                {inicial(d.nombre)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{d.nombre}</p>
                <p className="text-sm text-texto-2">{t.desde(d.desde)}</p>
              </div>
              <span className="font-bold tabular-nums">{formatearDolares(d.saldo)}</span>
              {d.cobro ? (
                <a href={d.cobro} target="_blank" rel="noopener noreferrer" className={estiloBoton("suave", "chico")}>
                  <Icon nombre="chat" className="size-4" />
                  {t.cobrar}
                </a>
              ) : (
                <span className="text-sm text-texto-2">{t.cobrarSinContacto}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export type ProductoParadoConCodigo = ProductoParado & { codigo: number };

/**
 * Productos que no se mueven, plegado en una sola tarjeta: arriba cuántos son y cuánto costaron; al abrirla, cada uno con
 * su foto, lo que costó y cuántos días lleva sin venderse. `id` sirve para llegar con un enlace (`#parados`).
 */
export function DineroParado({
  id,
  abierto,
  productos,
  fotos,
  total,
  pctDelInventario,
  inventario,
  dias,
  sinCosto,
}: {
  id?: string;
  abierto?: boolean;
  productos: ProductoParadoConCodigo[];
  fotos: Record<string, string | undefined>;
  total: number;
  pctDelInventario: number;
  /** Lo que cuesta todo el inventario, para que el porcentaje tenga contra qué compararse */
  inventario: number;
  dias: number;
  sinCosto: number;
}) {
  return (
    <details id={id} open={abierto} className="group overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-superficie">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-fondo md:px-5 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-ambar">
          <Icon nombre="reloj" className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <h2 className="font-bold">{t.paradoTitulo}</h2>
          <span className="text-sm text-texto-2">{t.paradoResumen(productos.length, formatearDolares(total))}</span>
        </span>
        <Icon nombre="flecha" className="size-5 shrink-0 text-texto-2 transition-transform group-open:rotate-180" />
      </summary>
      <p className="border-t-2 border-teal-oscuro bg-perla px-4 py-2 text-sm md:px-5">
        {t.paradoAyuda(dias)} <span className="font-bold">{t.paradoTotal(formatearDolares(total), pctDelInventario, formatearDolares(inventario))}</span>
      </p>
      {productos.length === 0 ? (
        <p className="border-t border-borde px-4 py-4 text-texto-2 md:px-5">{t.paradoVacio}</p>
      ) : (
        <ul className="border-t border-borde">
          {productos.slice(0, 8).map((p) => {
            const foto = fotos[p.id];
            return (
              <li key={p.id} className="relative flex items-center gap-3 border-t border-borde px-4 py-3 first:border-t-0 hover:bg-teal-fondo md:px-5">
                {foto ? (
                  <Image src={urlFoto(foto)} alt="" width={48} height={48} className="size-12 shrink-0 rounded-xl border-2 border-teal-oscuro object-cover" />
                ) : (
                  <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-teal-oscuro/30 bg-fondo text-texto-2">
                    <Icon nombre="caja" className="size-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <Link href={`/productos/${p.codigo}`} className="line-clamp-2 font-bold leading-tight after:absolute after:inset-0">
                    {p.nombre}
                  </Link>
                  <p className="text-sm text-texto-2">{t.paradoFila(p.disponibles, p.dias)}</p>
                </div>
                <span className="font-bold tabular-nums">{p.costo === null ? t.sinCosto : formatearDolares(p.costo)}</span>
              </li>
            );
          })}
        </ul>
      )}
      {sinCosto > 0 && <p className="border-t border-borde px-4 py-3 text-sm text-texto-2 md:px-5">{t.paradoSinCosto(sinCosto)}</p>}
    </details>
  );
}
