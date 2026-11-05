import Link from "next/link";
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
    <section aria-label={titulo} className="grid grid-cols-1 gap-5 rounded-[24px] border-2 border-teal-oscuro bg-teal-oscuro p-5 text-white md:grid-cols-[1fr_1.2fr] md:items-center md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-bold text-celeste">{titulo}</h2>
        <p className={`font-logo text-5xl font-bold tabular-nums md:text-6xl ${neto < 0 ? "text-rosa" : "text-limon"}`}>
          {neto < 0 ? "−" : ""}
          {formatearDolares(Math.abs(neto))}
        </p>
        <p className="text-sm text-white/80">
          {t.pie.movimientos(cantidad)} · {ayuda}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-[20px] border-2 border-teal-oscuro bg-limon p-4 text-teal-oscuro">
          <dt className="text-sm font-bold">{t.pie.entradas}</dt>
          <dd className="font-logo text-2xl font-bold tabular-nums md:text-3xl">+{formatearDolares(entradas)}</dd>
        </div>
        <div className="rounded-[20px] border-2 border-teal-oscuro bg-rosa p-4 text-teal-oscuro">
          <dt className="text-sm font-bold">{t.pie.salidas}</dt>
          <dd className="font-logo text-2xl font-bold tabular-nums md:text-3xl">−{formatearDolares(salidas)}</dd>
        </div>
      </dl>
    </section>
  );
}

/**
 * Lo que se movió fuera de ventas y gastos (préstamos, mercadería, deudas, envíos, ajustes). Se dice aparte para que el «Te quedó» de
 * arriba no confunda: esto cambia el balance, no la ganancia. No se dibuja si no hubo nada.
 */
export function OtrosMovimientos({ entran, salen }: { entran: number; salen: number }) {
  if (entran === 0 && salen === 0) return null;
  const o = textos.gestion.libro.otros;
  return (
    <section aria-label={o.titulo} className="flex flex-col gap-2 rounded-[20px] bg-fondo p-4 text-sm">
      <h2 className="font-bold">{o.titulo}</h2>
      <p className="flex flex-wrap gap-x-4 gap-y-1 font-bold tabular-nums">
        {entran > 0 && <span className="text-teal">{o.entraron(formatearDolares(entran))}</span>}
        {salen > 0 && <span className="text-error">{o.salieron(formatearDolares(salen))}</span>}
      </p>
      <p className="text-texto-2">{o.ayuda}</p>
      <Link href="/balance/detalle" className="inline-flex min-h-11 w-fit items-center font-bold text-teal underline underline-offset-4 md:min-h-10">
        {o.verBalance}
      </Link>
    </section>
  );
}
