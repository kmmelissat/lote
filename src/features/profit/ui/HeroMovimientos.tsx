import Link from "next/link";
import { TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.dinero;

/**
 * Lo primero del panel lateral de Movimientos: lo que quedó (entradas menos salidas de lo que se está viendo), grande,
 * con lo que entró y lo que salió debajo.
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
    <section
      aria-label={titulo}
      className={`${TARJETA_PUNCH} flex flex-col gap-1 !border-teal !bg-teal text-white`}
    >
      <h2 className="text-sm font-medium text-white/80">{titulo}</h2>
      <p
        className={`text-5xl font-bold tabular-nums tracking-tight ${neto < 0 ? "text-chip-rojo" : ""}`}
      >
        {neto < 0 ? "−" : ""}
        {formatearDolares(Math.abs(neto))}
      </p>
      <p className="text-xs text-white/70">
        {t.pie.movimientos(cantidad)} · {ayuda}
      </p>
      <dl className="mt-3 flex flex-col text-sm">
        <div className="flex items-center justify-between gap-3 border-t border-white/15 py-2.5">
          <dt className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full bg-chip-verde"
            />
            {t.pie.entradas}
          </dt>
          <dd className="font-semibold tabular-nums text-chip-verde">
            +{formatearDolares(entradas)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-white/15 py-2.5">
          <dt className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full bg-chip-rojo"
            />
            {t.pie.salidas}
          </dt>
          <dd className="font-semibold tabular-nums text-chip-rojo">
            −{formatearDolares(salidas)}
          </dd>
        </div>
      </dl>
      <Link
        href="/balance/detalle"
        className="mt-1 w-fit text-sm font-medium text-white underline-offset-2 hover:underline"
      >
        {textos.gestion.libro.verBalance}
      </Link>
    </section>
  );
}
