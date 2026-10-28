import Link from "next/link";
import { Gorila } from "@/components/ui/Gorila";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { HORAS_APARTADO_FRIO, type ResumenInicio } from "../resumen";

const t = textos.inicio;

const fila = "block rounded-xl bg-white/10 px-3 py-2 hover:bg-white/20";

/** Lo que hay que atender hoy, en el color de marca para que sea lo primero que se vea. */
export function TarjetaAtencion({ r, ahora }: { r: ResumenInicio; ahora: Date }) {
  const hayAccion = r.porPagar > 0 || r.porEnviar > 0 || r.seEnfrian.length > 0;
  if (!hayAccion) {
    // Sin nada urgente la tarjeta se encoge a una línea: solo crece cuando hay algo que atender.
    return (
      <section
        aria-labelledby="atencion"
        className="flex min-w-0 items-center gap-3 rounded-tarjeta border border-borde bg-teal-fondo px-4 py-3"
      >
        <Gorila className="size-9 shrink-0 text-teal" />
        <div>
          <h2 id="atencion" className="font-bold">
            {t.nadaPendiente}
          </h2>
          <p className="text-sm text-texto-2">{t.nadaPendienteTexto}</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="atencion" className="flex min-w-0 flex-col gap-3 rounded-tarjeta bg-teal p-4 text-white">
      <h2 id="atencion" className="font-bold">
        {t.accionTitulo}
      </h2>

      <ul className="flex flex-col gap-2">
        {r.porPagar > 0 && (
          <li>
            <Link href="/pedidos?estado=pendiente" className={fila}>{t.porPagar(r.porPagar)}</Link>
          </li>
        )}
        {r.porEnviar > 0 && (
          <li>
            <Link href="/pedidos?estado=pagado" className={fila}>{t.porEnviar(r.porEnviar)}</Link>
          </li>
        )}
        {r.seEnfrian.length > 0 && (
          <li className="mt-1">
            <p className="font-medium">{t.seEnfrianTitulo}</p>
            <p className="mb-1 text-sm text-white/90">{t.seEnfrianAyuda(HORAS_APARTADO_FRIO)}</p>
            <ul className="flex flex-col gap-2">
              {r.seEnfrian.slice(0, 3).map((p) => (
                <li key={p.id}>
                  <Link href={`/pedidos/${p.codigo}`} className={`${fila} flex items-center justify-between gap-3`}>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{p.cliente ?? textos.pedidos.sinCliente}</span>
                      <span className="block text-sm text-white/90">{t.venceEn(tiempoRestante(p.venceEn!, ahora))}</span>
                    </span>
                    <span className="font-bold">{formatearDolares(p.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        )}
      </ul>
    </section>
  );
}
