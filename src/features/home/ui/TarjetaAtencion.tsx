import Link from "next/link";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { LotitoMas } from "@/components/ui/LotitoMas";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { Card } from "@/components/ui/Card";
import { HORAS_APARTADO_FRIO, type ResumenInicio } from "../resumen";

const t = textos.inicio;

const fila = "flex min-h-12 items-center gap-3 rounded-xl border-2 border-teal-oscuro bg-superficie px-3 py-2 font-medium transition-colors hover:bg-teal-fondo";

/** Una fila de acción: ícono, qué es y a dónde lleva. */
function Fila({ href, icono, children }: { href: string; icono: NombreIcono; children: React.ReactNode }) {
  return (
    <Link href={href} className={fila}>
      <Icon nombre={icono} className="size-5 shrink-0" />
      <span className="min-w-0 flex-1">{children}</span>
      <Icon nombre="diagonal" className="size-4 shrink-0" />
    </Link>
  );
}

/** Lo que hay que hacer hoy (y, si todavía faltan, el siguiente de los primeros pasos como una fila más): es lo primero que se ve en Inicio, y lo único con relleno de color y sombra. */
export function TarjetaAtencion({ r, ahora, pasos }: { r: ResumenInicio; ahora: Date; pasos?: React.ReactNode }) {
  const hayAccion = r.porPagar > 0 || r.porEnviar > 0 || r.seEnfrian.length > 0;
  if (!hayAccion && !pasos) {
    return (
      <Card role="region" aria-labelledby="atencion" className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 id="atencion" className="text-lg font-bold">
            {t.alDiaTitulo}
          </h2>
          <p className="text-texto-2">{t.alDiaTexto}</p>
        </div>
        <LotitoMas nombre="thumbsup" className="w-20 shrink-0" />
      </Card>
    );
  }

  return (
    // Una nota adhesiva pegada con cinta: torcida a propósito, con Lotito asomando por arriba.
    <section
      aria-labelledby="atencion"
      className="relative mb-2 mt-10 flex rotate-[-0.8deg] flex-col md:rotate-[-0.3deg] gap-3 rounded-[10px_10px_24px_10px] border-2 border-teal-oscuro bg-limon p-4 pt-6 shadow-dura before:absolute before:-top-3.5 before:left-1/2 before:h-6 before:w-24 before:-translate-x-1/2 before:rotate-2 before:rounded-sm before:border-2 before:border-teal-oscuro before:bg-rosa/85 before:content-[''] md:p-5 md:pt-7"
    >
      <LotitoMas nombre="asoma" className="pointer-events-none absolute -top-[3.9rem] right-4 w-28 md:right-8" />
      <h2 id="atencion" className="font-logo text-xl font-semibold">
        {t.accionTitulo}
      </h2>

      {hayAccion && (
      <ul className="flex flex-col gap-2">
        {r.porPagar > 0 && (
          <li>
            <Fila href="/pedidos?estado=pendiente" icono="reloj">{t.porPagar(r.porPagar)}</Fila>
          </li>
        )}
        {r.porEnviar > 0 && (
          <li>
            <Fila href="/pedidos?estado=pagado" icono="camion">{t.porEnviar(r.porEnviar)}</Fila>
          </li>
        )}
        {r.seEnfrian.length > 0 && (
          <li className="mt-1">
            <p className="font-medium">{t.seEnfrianTitulo}</p>
            <p className="mb-1 text-sm text-teal-oscuro/80">{t.seEnfrianAyuda(HORAS_APARTADO_FRIO)}</p>
            <ul className="flex flex-col gap-2">
              {r.seEnfrian.slice(0, 3).map((p) => (
                <li key={p.id}>
                  <Link href={`/pedidos/${p.codigo}`} className={`${fila} justify-between`}>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{p.cliente ?? textos.pedidos.sinCliente}</span>
                      <span className="block text-sm text-teal-oscuro/80">{t.venceEn(tiempoRestante(p.venceEn!, ahora))}</span>
                    </span>
                    <span className="font-bold">{formatearDolares(p.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        )}
      </ul>
      )}

      {pasos}
    </section>
  );
}
