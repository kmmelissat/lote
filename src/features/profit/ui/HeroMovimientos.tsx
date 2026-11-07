import Link from "next/link";
import { coloresDinero } from "@/components/ui/coloresDinero";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.dinero;

/**
 * Lo primero de Movimientos: lo que quedó (entradas menos salidas de lo que se está viendo), grande, con lo que entró y lo que salió al lado.
 * Es la una cosa fuerte de la pantalla.
 */
export function HeroMovimientos({
  entradas,
  salidas,
  neto,
  cantidad,
  titulo,
  ayuda,
}: {
  entradas: number;
  salidas: number;
  neto: number;
  cantidad: number;
  titulo: string;
  ayuda: string;
}) {
  return (
    <section aria-label={titulo} className="grid grid-cols-1 gap-5 rounded-[24px] border border-teal-oscuro bg-teal-oscuro p-5 text-white md:grid-cols-[1fr_1.2fr] md:items-center md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-bold text-celeste">{titulo}</h2>
        <p className={`font-logo text-5xl font-bold tabular-nums md:text-6xl ${neto < 0 ? "text-rosa" : "text-limon"}`}>
          {neto < 0 ? "−" : ""}
          {formatearDolares(Math.abs(neto))}
        </p>
        <p className="text-sm text-white/80">
          {t.pie.movimientos(cantidad)} · {ayuda}
        </p>
        <Link href="/balance/detalle" className="inline-flex min-h-11 w-fit items-center font-bold text-celeste underline underline-offset-4 md:min-h-10">
          {textos.gestion.libro.verBalance}
        </Link>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <div className={`rounded-[20px] border border-teal-oscuro ${coloresDinero.entra.fondo} p-4 text-teal-oscuro`}>
          <dt className="text-sm font-bold">{t.pie.entradas}</dt>
          <dd className="font-logo text-2xl font-bold tabular-nums md:text-3xl">+{formatearDolares(entradas)}</dd>
        </div>
        <div className={`rounded-[20px] border border-teal-oscuro ${coloresDinero.sale.fondo} p-4 text-teal-oscuro`}>
          <dt className="text-sm font-bold">{t.pie.salidas}</dt>
          <dd className="font-logo text-2xl font-bold tabular-nums md:text-3xl">−{formatearDolares(salidas)}</dd>
        </div>
      </dl>
    </section>
  );
}
