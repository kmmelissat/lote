import Link from "next/link";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { TARJETA } from "@/components/ui/tarjeta";
import { HORAS_APARTADO_FRIO, type ResumenInicio } from "../resumen";

const t = textos.inicio;

const fila = "block rounded-xl bg-white/10 px-3 py-2 hover:bg-white/20";

/** Lo que hay que atender hoy, en el color de marca para que sea lo primero que se vea. */
export function TarjetaAtencion({ r, ahora }: { r: ResumenInicio; ahora: Date }) {
  const hayAccion = r.porPagar > 0 || r.porEnviar > 0 || r.seEnfrian.length > 0;
  // El menú ya avisa con el contador de Pedidos; acá solo aparece el detalle cuando hay algo que atender.
  if (!hayAccion) return null;

  return (
    <section aria-labelledby="atencion" className={`${TARJETA} flex flex-col gap-3 bg-teal text-white`}>
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
