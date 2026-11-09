import type { Route } from "next";
import Link from "next/link";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { ruta } from "@/lib/ruta";
import { textos } from "@/lib/textos";
import { Panel } from "./Panel";
import type { ResumenInicio } from "../resumen";

const t = textos.inicio;

type Pendiente = { clave: string; icono: NombreIcono; tono: string; titulo: string; detalle: string; href: Route; accion: string };

/** Lo que hay que hacer hoy, de más a menos urgente: primero los apartados que vencen, luego cobrar y enviar. */
function pendientes(r: ResumenInicio, ahora: Date): Pendiente[] {
  const sinCliente = textos.pedidos.sinCliente;
  const lista: Pendiente[] = r.seEnfrian.slice(0, 3).map((p) => ({
    clave: `apartado-${p.id}`,
    icono: "reloj",
    tono: "bg-ficha-rosa",
    titulo: `${p.cliente ?? sinCliente} · ${formatearDolares(p.total)}`,
    detalle: t.venceEn(tiempoRestante(p.venceEn!, ahora)),
    href: ruta(`/pedidos/${p.codigo}`),
    accion: t.cobrarAccion,
  }));
  if (r.porPagar > 0)
    lista.push({ clave: "por-pagar", icono: "moneda", tono: "bg-ficha-amarillo", titulo: t.porPagar(r.porPagar), detalle: t.porPagarAyuda, href: "/pedidos?estado=pendiente", accion: t.verAccion });
  if (r.porEnviar > 0)
    lista.push({ clave: "por-enviar", icono: "camion", tono: "bg-ficha-celeste", titulo: t.porEnviar(r.porEnviar), detalle: t.porEnviarAyuda, href: "/pedidos?estado=pagado", accion: t.enviarAccion });
  return lista;
}

/** Lo que hay que hacer hoy: una sola acción principal, grande, y el resto como pendientes chicos debajo. */
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
    <section
      aria-labelledby="atencion"
      className="flex h-full flex-col gap-5 rounded-3xl bg-linear-to-br from-ficha-amarillo/60 via-ficha-rosa/30 to-ficha-celeste/40 p-5 shadow-xs md:p-6"
    >
      <h2 id="atencion" className="flex items-center justify-between gap-3 text-sm font-semibold uppercase tracking-wide text-teal-oscuro/80">
        {t.accionTitulo}
        <span className="rounded-full bg-superficie px-2.5 py-0.5 text-sm font-bold normal-case tracking-normal text-teal-oscuro">{resto.length + 1}</span>
      </h2>

      <div className="flex flex-col gap-4">
        <span aria-hidden="true" className={`flex size-12 items-center justify-center rounded-2xl text-teal-oscuro ${principal.tono}`}>
          <Icon nombre={principal.icono} className="size-6" />
        </span>
        <div>
          <p className="text-2xl font-semibold leading-tight tracking-tight text-teal-oscuro">{principal.titulo}</p>
          <p className="mt-1 text-texto-2">{principal.detalle}</p>
        </div>
        <Link
          href={principal.href}
          className="inline-flex h-12 items-center justify-center gap-2 self-start rounded-[14px] bg-teal-oscuro px-5 font-semibold text-white shadow-sm transition-colors hover:bg-teal-oscuro/90 focus-visible:outline-2 focus-visible:outline-offset-2 max-sm:self-stretch"
        >
          {principal.accion}
          <Icon nombre="adelante" className="size-4" />
        </Link>
      </div>

      {resto.length > 0 && (
        <ul className="mt-auto flex flex-col gap-1.5 border-t border-teal-oscuro/10 pt-3">
          {resto.map((p) => (
            <li key={p.clave}>
              <Link href={p.href} className="flex min-h-10 items-center gap-2.5 rounded-xl px-2 text-sm font-medium text-teal-oscuro transition-colors hover:bg-superficie/60">
                <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${p.tono}`} />
                <span className="min-w-0 flex-1 truncate">{p.titulo}</span>
                <Icon nombre="adelante" className="size-4 shrink-0 text-texto-2" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
