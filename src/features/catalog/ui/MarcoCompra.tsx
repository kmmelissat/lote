import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Monito } from "@/components/ui/Monito";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.vitrina.compra;

/** Arriba de las pantallas de compra: volver, la tienda, qué se hace y el monito curioseando. */
export function EncabezadoCompra({
  volverHref,
  volverTexto,
  tienda,
  titulo,
  ayuda,
}: {
  volverHref: string;
  volverTexto: string;
  tienda: string;
  titulo: string;
  ayuda: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Link href={volverHref} className="inline-flex min-h-11 items-center self-start text-sm font-bold text-teal underline">
        ← {volverTexto}
      </Link>
      <header className="relative flex flex-col items-start gap-2 pr-24 sm:pr-40">
        <Monito nombre="celular" className="pointer-events-none absolute -top-2 right-0 w-20 text-rosa sm:w-28" />
        <span className="rounded-full border-2 border-teal-oscuro bg-limon px-3 py-0.5 text-sm font-bold">{tienda}</span>
        <h1 className="text-4xl font-bold leading-tight">{titulo}</h1>
        <p className="max-w-xl text-texto-2">{ayuda}</p>
      </header>
    </div>
  );
}

export type LineaResumen = { clave: string; nombre: string; detalle: string; foto: string | undefined; precio: number };

/** Lo que se compra, como un ticket: foto, nombre, cantidad y el total. */
export function ResumenPedido({ lineas, total }: { lineas: LineaResumen[]; total: number }) {
  return (
    <section aria-label={t.resumenTitulo} className="rounded-[24px] border-2 border-teal-oscuro bg-teal-fondo p-5 shadow-dura-chica">
      <h2 className="mb-3 font-bold">{t.tuPedido}</h2>
      <ul className="flex flex-col gap-3">
        {lineas.map((l) => (
          <li key={l.clave} className="flex items-center gap-3">
            <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-teal-oscuro/20 bg-white">
              {l.foto ? <Image src={urlFoto(l.foto)} alt="" fill sizes="56px" className="object-cover" /> : <Monito nombre="caja" className="w-7 text-teal/40" />}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="line-clamp-2 font-bold">{l.nombre}</p>
              {l.detalle && <p className="truncate text-sm text-texto-2">{l.detalle}</p>}
            </div>
            <p className="font-bold tabular-nums">{formatearDolares(l.precio)}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-baseline justify-between border-t-2 border-dashed border-teal-oscuro/40 pt-3">
        <span className="font-bold">{t.total}</span>
        <span className="text-2xl font-bold tabular-nums">{formatearDolares(total)}</span>
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-texto-2">
        <Icon nombre="check" className="size-4 text-teal" />
        {t.todaviaNoPagas}
      </p>
    </section>
  );
}

/** El resumen y el formulario: en escritorio, uno al lado del otro; en celular, el resumen arriba. */
export function DosColumnas({ resumen, children }: { resumen: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-8">
      <aside className="lg:sticky lg:top-6 lg:order-last">{resumen}</aside>
      <div className="relative rounded-[24px] border-2 border-teal-oscuro bg-white p-5 shadow-dura md:p-6">{children}</div>
    </div>
  );
}
