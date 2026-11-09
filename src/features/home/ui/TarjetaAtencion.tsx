import type { Route } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { ruta } from "@/lib/ruta";
import { textos } from "@/lib/textos";
import { Panel } from "./Panel";
import type { ResumenInicio } from "../resumen";

const t = textos.inicio;

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
      <Panel role="region" aria-labelledby="atencion" className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 id="atencion" className="text-lg font-semibold">
            {t.alDiaTitulo}
          </h2>
          <p className="text-texto-2">{t.alDiaTexto}</p>
        </div>
        <LotitoMas nombre="thumbsup" className="w-20 shrink-0" />
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
