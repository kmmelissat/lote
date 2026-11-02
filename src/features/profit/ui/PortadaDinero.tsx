import Link from "next/link";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import type { PuntoDeEquilibrio, ResumenPeriodo } from "@/domain";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.dinero;
const g = textos.ganancia;

/** El tramo de la meta: cuánto había que vender para pagar los gastos, cuánto llevás y, si ya pasaste la línea, el día. */
function CaminoAMeta({ p, gastos, periodoTexto }: { p: PuntoDeEquilibrio; gastos: number; periodoTexto: string }) {
  const necesarias = formatearDolares(p.necesarias);
  const centavos = Math.round(p.margen * 100);
  const vendido = formatearDolares(p.vendido);
  const dia = p.diaDeCruce ? formatearFecha(new Date(`${p.diaDeCruce}T12:00:00Z`)) : null;
  // La barra llega hasta lo mayor de las dos cifras; la bandera marca la línea de los gastos
  const tope = Math.max(p.necesarias, p.vendido);
  const lleno = Math.min(100, (p.vendido / tope) * 100);
  const meta = Math.min(100, (p.necesarias / tope) * 100);
  return (
    <div className="flex flex-col gap-1">
      <h2 className="font-logo text-xl font-bold">{p.cubierto ? t.equilibrio.titulo : t.equilibrio.tituloPendiente}</h2>
      <p className="mb-7 text-sm text-white/80">
        {p.cubierto
          ? t.equilibrio.cubierto(formatearDolares(gastos), centavos, necesarias, vendido, periodoTexto, dia)
          : t.equilibrio.pendiente(formatearDolares(gastos), centavos, necesarias, vendido, formatearDolares(p.falta), periodoTexto)}
      </p>
      <div
        role="img"
        aria-label={`${t.equilibrio.llevas(vendido)}. ${t.equilibrio.marca(necesarias)}.`}
        className="relative h-5 rounded-full border-2 border-white bg-white/15"
      >
        <span className="block h-full rounded-full bg-mango" style={{ width: `${lleno}%` }} />
        <svg aria-hidden="true" viewBox="0 0 24 24" className="absolute -top-7 size-7 -translate-x-3.5 fill-rosa stroke-white" strokeWidth="1.8" strokeLinejoin="round" style={{ left: `${meta}%` }}>
          <path d="M6 21V4h11l-2.5 4.5L17 13H6" />
        </svg>
      </div>
      <div className="mt-1 flex justify-between gap-3 text-xs text-white/80">
        <span>{formatearDolares(0)}</span>
        <span>{t.equilibrio.marca(necesarias)}</span>
        <span>{t.equilibrio.llevas(vendido)}</span>
      </div>
    </div>
  );
}

/**
 * Lo primero que se ve: lo que te quedó, grande y en limón sobre fondo oscuro, y al lado el camino hasta cubrir los gastos.
 * Es la una cosa fuerte de la pantalla; todo lo demás va más callado.
 */
export function HeroDinero({
  ganancia,
  etiqueta,
  comparacion,
  incompleta,
  equilibrio,
  periodoTexto,
  hayGastos,
  gastos,
  enStock,
}: {
  ganancia: number;
  etiqueta: string;
  comparacion: string;
  incompleta: boolean;
  equilibrio: PuntoDeEquilibrio | null;
  periodoTexto: string;
  hayGastos: boolean;
  /** Lo que se gastó en el periodo (sin contar el producto) */
  gastos: number;
  /** Lo que costó el producto que sigue sin venderse */
  enStock: number;
}) {
  return (
    <section aria-label={etiqueta} className="grid grid-cols-1 gap-6 rounded-[24px] border-2 border-teal-oscuro bg-teal-oscuro p-5 text-white md:grid-cols-[1fr_1.25fr] md:items-center md:p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-bold text-celeste">{etiqueta}</h2>
        <p className="font-logo text-5xl font-bold tabular-nums text-limon md:text-6xl">{formatearDolares(ganancia)}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-limon px-3 py-0.5 text-sm font-bold text-teal-oscuro">{comparacion}</span>
          {incompleta && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-0.5 text-sm font-bold text-teal-oscuro">
              <Icon nombre="alerta" className="size-4" />
              {g.incompleta}
            </span>
          )}
        </div>
      </div>
      {equilibrio ? (
        <CaminoAMeta p={equilibrio} gastos={gastos} periodoTexto={periodoTexto} />
      ) : (
        <p className="text-sm text-white/80">{hayGastos ? t.equilibrio.sinCostos : t.equilibrio.sinGastos}</p>
      )}
      {enStock > 0 && (
        <p className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t-2 border-white/20 pt-4 text-sm md:col-span-2">
          <span>{t.equilibrio.enStock(formatearDolares(enStock))}</span>
          <Link href="/dinero/cuadre" className="inline-flex min-h-11 items-center font-bold text-limon underline underline-offset-4 md:min-h-10">
            {t.equilibrio.verCuadre}
          </Link>
        </p>
      )}
    </section>
  );
}

const FONDO = { rosa: "bg-rosa", ambar: "bg-ambar", limon: "bg-limon" } as const;

/** Un número en un bloque de color con sombra dura: se toca y lleva a donde está el detalle. */
export function BloqueDato({
  color,
  etiqueta,
  valor,
  texto,
  href,
  icono,
}: {
  color: keyof typeof FONDO;
  etiqueta: string;
  valor: string;
  texto: string;
  href: string;
  icono: NombreIcono;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col gap-0.5 rounded-[24px] border-2 border-teal-oscuro p-4 shadow-dura-chica transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura active:translate-x-0.5 active:translate-y-0.5 active:shadow-none md:p-5 ${FONDO[color]}`}
    >
      <span className="flex items-center gap-2 text-sm font-bold">
        <Icon nombre={icono} className="size-4" />
        {etiqueta}
      </span>
      <span className="font-logo text-3xl font-bold tabular-nums md:text-4xl">{valor}</span>
      <span className="text-sm text-teal-oscuro/75">{texto}</span>
    </Link>
  );
}

/** La cuenta del periodo como un recibo: vendiste, menos lo que costó, menos los gastos, igual a lo que te quedó. */
export function ReciboDelPeriodo({ r, cubierto }: { r: ResumenPeriodo; cubierto: boolean }) {
  const c = g.cascada;
  const lineas: { etiqueta: string; valor: number; resta: boolean }[] = [
    { etiqueta: c.vendido, valor: r.vendido, resta: false },
    { etiqueta: c.costo, valor: r.costoProductos, resta: true },
    ...(r.descuentos > 0 ? [{ etiqueta: c.descuentos, valor: r.descuentos, resta: true }] : []),
    ...(r.envioAbsorbido > 0 ? [{ etiqueta: c.envio, valor: r.envioAbsorbido, resta: true }] : []),
    { etiqueta: c.gastos, valor: r.gastos, resta: true },
  ];
  return (
    <section aria-labelledby="recibo" className="relative pb-3.5">
      {/* El papel: crema con el borde de abajo en dientes, como un recibo cortado a mano */}
      <div
        className="relative -rotate-1 rounded-t-[10px] border-2 border-b-0 border-teal-oscuro bg-crema px-5 pb-7 pt-6"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 12px), 97.5% 100%, 92.5% calc(100% - 12px), 87.5% 100%, 82.5% calc(100% - 12px), 77.5% 100%, 72.5% calc(100% - 12px), 67.5% 100%, 62.5% calc(100% - 12px), 57.5% 100%, 52.5% calc(100% - 12px), 47.5% 100%, 42.5% calc(100% - 12px), 37.5% 100%, 32.5% calc(100% - 12px), 27.5% 100%, 22.5% calc(100% - 12px), 17.5% 100%, 12.5% calc(100% - 12px), 7.5% 100%, 2.5% calc(100% - 12px), 0 100%)" }}
      >
        {cubierto && (
          <span aria-hidden="true" className="absolute right-3 top-3 rotate-[9deg] rounded-[10px] border-[3px] border-teal bg-white/70 px-3 font-logo text-base font-bold tracking-widest text-teal">
            {t.recibo.sello}
          </span>
        )}
        <h2 id="recibo" className="font-logo text-xl font-bold">
          {t.recibo.titulo}
        </h2>
        <p className="mb-3 text-sm text-texto-2">{t.pedidos(r.pedidos)}</p>
        <dl>
          {lineas.map((l) => (
            <div key={l.etiqueta} className="flex items-baseline justify-between gap-3 border-b-2 border-dotted border-teal-oscuro/30 py-2 text-sm">
              <dt>{l.etiqueta}</dt>
              <dd className={`font-bold tabular-nums ${l.resta ? "text-error" : ""}`}>
                {l.resta ? "− " : ""}
                {formatearDolares(l.valor)}
              </dd>
            </div>
          ))}
          <div className="mt-3 flex items-baseline justify-between gap-3 border-t-2 border-teal-oscuro pt-3">
            <dt className="font-bold">= {c.queda}</dt>
            <dd className="font-logo text-3xl font-bold tabular-nums text-teal">{formatearDolares(r.gananciaDespuesDeGastos)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

/**
 * Lo primero de Movimientos: lo que quedó (entradas menos salidas de lo que se está viendo), grande, con lo que entró y lo que salió al lado.
 * Es la una cosa fuerte de la pantalla.
 */
export function HeroMovimientos({
  entradas,
  salidas,
  neto,
  cantidad,
  titulo = t.neto.titulo,
  ayuda = t.neto.ayuda,
}: {
  entradas: number;
  salidas: number;
  neto: number;
  cantidad: number;
  titulo?: string;
  ayuda?: string;
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
