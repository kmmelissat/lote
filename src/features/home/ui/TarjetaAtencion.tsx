import type { Route } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { accionesDe } from "@/components/nav/acciones";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { ruta } from "@/lib/ruta";
import { textos } from "@/lib/textos";
import { Panel } from "./Panel";
import type { ResumenInicio } from "../resumen";

const t = textos.inicio;

/** Estrellita de cuatro puntas que titila (la animación `.estrella` de globals.css). */
function Destello({ className, retraso }: { className: string; retraso: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" style={{ "--retraso": retraso } as React.CSSProperties} className={`estrella pointer-events-none absolute fill-teal-oscuro motion-reduce:animate-none ${className}`}>
      <path d="M12 0c.8 6.4 5.6 11.2 12 12-6.4.8-11.2 5.6-12 12-.8-6.4-5.6-11.2-12-12C6.4 11.2 11.2 6.4 12 0z" />
    </svg>
  );
}

const FICHAS = ["bg-ficha-amarillo", "bg-ficha-verde", "bg-ficha-rosa", "bg-ficha-celeste"];

type Pendiente = { clave: string; fondo: string; punto: string; cifra: string; titulo: string; detalle: string; href: Route; accion: string };

/** Lo que hay que hacer hoy, de más a menos urgente: primero los apartados que vencen, luego cobrar y enviar. */
function pendientes(r: ResumenInicio, ahora: Date): Pendiente[] {
  const lista: Pendiente[] = r.seEnfrian.slice(0, 3).map((p) => ({
    clave: `apartado-${p.id}`,
    fondo: "bg-ficha-rosa",
    punto: "bg-[#e0527f]",
    cifra: formatearDolares(p.total),
    titulo: p.cliente ?? textos.pedidos.sinCliente,
    detalle: `Apartado · ${t.venceEn(tiempoRestante(p.venceEn!, ahora))}`,
    href: ruta(`/pedidos/${p.codigo}`),
    accion: t.cobrarAccion,
  }));
  if (r.porPagar > 0)
    lista.push({ clave: "por-pagar", fondo: "bg-ficha-amarillo", punto: "bg-[#d19200]", cifra: String(r.porPagar), titulo: t.porPagarEtiqueta(r.porPagar), detalle: t.porPagarAyuda, href: "/pedidos?estado=pendiente", accion: t.verAccion });
  if (r.porEnviar > 0)
    lista.push({ clave: "por-enviar", fondo: "bg-ficha-celeste", punto: "bg-[#2a9fd0]", cifra: String(r.porEnviar), titulo: t.porEnviarTitulo(r.porEnviar), detalle: t.porEnviarAyuda, href: "/pedidos?estado=pagado", accion: t.enviarAccion });
  return lista;
}

/** Lo que hay que hacer hoy: un número grande, una sola acción y el resto como pendientes chicos. El color cambia con lo urgente. */
export function TarjetaAtencion({ r, ahora }: { r: ResumenInicio; ahora: Date }) {
  const [principal, ...resto] = pendientes(r, ahora);
  if (!principal) {
    return (
      <Panel role="region" aria-labelledby="atencion" className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="atencion" className="text-lg font-semibold">
              {t.accionesTitulo}
            </h2>
            <p className="text-sm text-texto-2">{t.alDiaTexto}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#b9e8c8] px-2 py-0.5 text-xs font-medium text-[#1b5433] ring-1 ring-inset ring-[#013c47]/8">
            <Icon nombre="check" className="size-4" />
            {t.alDiaTitulo}
          </span>
        </div>
        <ul className="grid flex-1 auto-rows-fr grid-cols-2 gap-3">
          {accionesDe().map((a, i) => (
            <li key={a.href} className="flex">
              <Link
                href={a.href}
                className={`group relative flex min-h-24 w-full overflow-hidden flex-col justify-between rounded-[20px] p-4 text-teal-oscuro transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 ${FICHAS[i % FICHAS.length]}`}
              >
                {a.href === "/asistente" && (
                  <>
                    <Destello className="right-4 top-3 size-4" retraso="0s" />
                    <Destello className="right-10 top-8 size-2.5" retraso="0.9s" />
                    <Destello className="right-3 top-12 size-3" retraso="1.7s" />
                  </>
                )}
                <span className="flex size-9 items-center justify-center rounded-[12px] bg-superficie/70">
                  <Icon nombre={a.icono} className="size-5" />
                </span>
                <span className="flex items-end justify-between gap-2 text-sm font-semibold leading-tight">
                  {a.etiqueta}
                  <Icon nombre="adelante" className="size-4 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    );
  }

  return (
    <section aria-labelledby="atencion" className={`flex h-full flex-col gap-6 rounded-3xl p-6 ${principal.fondo}`}>
      <h2 id="atencion" className="text-sm font-semibold text-teal-oscuro/70">
        {t.accionTitulo}
      </h2>

      <div className="flex flex-col gap-1">
        <p className="text-6xl font-semibold leading-none tracking-tighter text-teal-oscuro tabular-nums">{principal.cifra}</p>
        <p className="mt-2 text-lg font-semibold text-teal-oscuro">{principal.titulo}</p>
        <p className="text-sm text-teal-oscuro/70">{principal.detalle}</p>
      </div>

      <Link
        href={principal.href}
        className="group inline-flex h-12 items-center justify-between gap-4 self-start rounded-full bg-superficie py-1 pl-5 pr-1 font-semibold text-teal-oscuro transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 max-sm:self-stretch"
      >
        {principal.accion}
        <span className="flex size-10 items-center justify-center rounded-full bg-teal-oscuro text-white transition-transform group-hover:translate-x-0.5">
          <Icon nombre="adelante" className="size-4" />
        </span>
      </Link>

      {resto.length > 0 && (
        <ul className="mt-auto flex flex-col gap-1 border-t border-teal-oscuro/15 pt-3">
          {resto.map((p) => (
            <li key={p.clave}>
              <Link href={p.href} className="flex min-h-10 items-center gap-2.5 rounded-xl px-2 text-sm font-medium text-teal-oscuro transition-colors hover:bg-superficie/50">
                <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${p.punto}`} />
                <span className="min-w-0 flex-1 truncate">
                  <b className="font-semibold">{p.cifra}</b> {p.titulo}
                </span>
                <Icon nombre="adelante" className="size-4 shrink-0 opacity-60" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
