import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { estiloBoton } from "@/components/ui/Button";
import type { ParteDelNegocio, ProductoParado } from "@/domain";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.dinero.cuadre;

const COLOR: Record<ParteDelNegocio["clave"], string> = {
  efectivo: "bg-teal",
  transferencia: "bg-celeste",
  billetera: "bg-rosa",
  porCobrar: "bg-limon",
  inventario: "bg-mango",
};

/** Lo que vale el negocio hoy: el total grande en limón sobre fondo oscuro y una barra partida por colores, con su leyenda. */
export function ValorDelNegocio({ total, partes, sinContar }: { total: number; partes: (ParteDelNegocio & { pct: number })[]; sinContar: string[] }) {
  return (
    <section aria-labelledby="valor-negocio" className="flex flex-col gap-4 rounded-[24px] border-2 border-teal-oscuro bg-teal-oscuro p-5 text-white md:p-6">
      <div>
        <h2 id="valor-negocio" className="text-sm font-bold text-celeste">
          {t.valorTitulo}
        </h2>
        <p className="font-logo text-5xl font-bold tabular-nums text-limon md:text-6xl">{formatearDolares(total)}</p>
      </div>
      <div
        role="img"
        aria-label={partes.map((p) => `${t.partes[p.clave]}: ${formatearDolares(p.monto)}`).join(". ")}
        className="flex h-5 overflow-hidden rounded-full border-2 border-white bg-white/15"
      >
        {partes.filter((p) => p.monto > 0).map((p) => (
          <span key={p.clave} className={`h-full ${COLOR[p.clave]}`} style={{ width: `${p.pct}%` }} />
        ))}
      </div>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {partes.map((p) => (
          <li key={p.clave} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className={`size-3.5 rounded-full border-2 border-white ${COLOR[p.clave]}`} />
              {t.partes[p.clave]}
            </span>
            <span className="font-bold tabular-nums">{formatearDolares(p.monto)}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-white/80">{t.valorAyuda}</p>
      {sinContar.length > 0 && <p className="w-fit rounded-full bg-limon px-3 py-1 text-sm font-bold text-teal-oscuro">{t.sinContarAviso(sinContar.join(", "))}</p>}
    </section>
  );
}

export type DeudaDeClienta = { id: string; nombre: string; saldo: number; desde: string; cobro: string | null };

const AVATAR = ["bg-rosa", "bg-celeste", "bg-mango", "bg-teal-fondo"] as const;
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
          {deudas.map((d, i) => (
            <li key={d.id} className="flex items-center gap-3 border-t border-borde px-4 py-3 first:border-t-0 md:px-5">
              <span aria-hidden="true" className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro font-logo text-lg font-bold ${AVATAR[i % AVATAR.length]}`}>
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

/** Productos que no se mueven: con su foto, lo que costaron y cuántos días llevan sin venderse. */
export function DineroParado({
  productos,
  fotos,
  total,
  pctDelInventario,
  dias,
  sinCosto,
}: {
  productos: ProductoParadoConCodigo[];
  fotos: Record<string, string | undefined>;
  total: number;
  pctDelInventario: number;
  dias: number;
  sinCosto: number;
}) {
  return (
    <section aria-labelledby="dinero-parado" className="overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-superficie">
      <div className="border-b-2 border-teal-oscuro bg-ambar px-4 py-3 md:px-5">
        <h2 id="dinero-parado" className="font-logo text-lg font-bold">
          {t.paradoTitulo}
        </h2>
        <p className="text-sm">{productos.length ? t.paradoTotal(formatearDolares(total), pctDelInventario) : t.paradoAyuda(dias)}</p>
      </div>
      {productos.length === 0 ? (
        <p className="px-4 py-4 text-texto-2 md:px-5">{t.paradoVacio}</p>
      ) : (
        <ul>
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
                  <Link href={`/productos/${p.codigo}`} className="block truncate font-bold after:absolute after:inset-0">
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
    </section>
  );
}
