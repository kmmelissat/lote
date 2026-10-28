import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { rangoPeriodo } from "@/domain";
import { HORAS_APARTADO_FRIO, resumenInicio } from "@/features/home/resumen";
import { buscarPedidos } from "@/features/orders/repositorio";
import { contarUnidades } from "@/features/products/repositorio";
import { resumenDePeriodo } from "@/features/profit/repositorio";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.inicio;

export const metadata: Metadata = { title: t.titulo };

export default function InicioPage() {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      <Contenido />
    </>
  );
}

async function Contenido() {
  const { supabase, negocio } = await negocioActual();
  const ahora = new Date();
  const periodo = rangoPeriodo("semana", ahora);

  const [unidades, pedidos, ganancia] = await Promise.all([
    contarUnidades(supabase, negocio.id),
    buscarPedidos(supabase, negocio.id, ["pendiente", "pagado", "preparando"]),
    // El costo solo lo ve quien gestiona: para el resto no se pide la ganancia.
    negocio.puedeGestionar ? resumenDePeriodo(supabase, negocio.id, periodo) : null,
  ]);

  // Sin unidades de ningún tipo es que todavía no hay productos.
  if (unidades.disponibles + unidades.apartadas + unidades.vendidas === 0) {
    return (
      <EmptyState
        titulo={t.vacioTitulo}
        texto={t.vacioTexto}
        accion={<ButtonLink href="/nuevo">{t.vacioAccion}</ButtonLink>}
      />
    );
  }

  const r = resumenInicio(unidades, pedidos, ahora);
  const hayAccion = r.porPagar > 0 || r.porEnviar > 0;

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="contadores" className="flex flex-col gap-2">
        <h2 id="contadores" className="sr-only">
          {t.contadores}
        </h2>
        <dl className="grid grid-cols-3 gap-3">
          {[
            [t.disponibles, r.disponibles],
            [t.apartados, r.apartadas],
            [t.vendidos, r.vendidas],
          ].map(([etiqueta, valor]) => (
            <Card key={etiqueta} className="flex flex-col border border-borde">
              <dt className="text-sm text-texto-2">{etiqueta}</dt>
              <dd className="text-2xl font-bold">{valor}</dd>
            </Card>
          ))}
        </dl>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">{t.accionTitulo}</h2>
        {hayAccion ? (
          <ul className="flex flex-col gap-2">
            {r.porPagar > 0 && (
              <li>
                <Link href="/pedidos?estado=pendiente" className="block">
                  <Card className="border border-borde hover:bg-teal-fondo">{t.porPagar(r.porPagar)}</Card>
                </Link>
              </li>
            )}
            {r.porEnviar > 0 && (
              <li>
                <Link href="/pedidos?estado=pagado" className="block">
                  <Card className="border border-borde hover:bg-teal-fondo">{t.porEnviar(r.porEnviar)}</Card>
                </Link>
              </li>
            )}
          </ul>
        ) : (
          <p className="text-texto-2">{t.nadaPendiente}</p>
        )}
      </section>

      {r.seEnfrian.length > 0 && (
        <section className="flex flex-col gap-2">
          <div>
            <h2 className="font-bold">{t.seEnfrianTitulo}</h2>
            <p className="text-sm text-texto-2">{t.seEnfrianAyuda(HORAS_APARTADO_FRIO)}</p>
          </div>
          <ul className="flex flex-col gap-2">
            {r.seEnfrian.map((p) => (
              <li key={p.id}>
                <Link href={`/pedidos/${p.codigo}`} className="block">
                  <Card className="flex items-center justify-between gap-3 border border-borde hover:bg-teal-fondo">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.cliente ?? textos.pedidos.sinCliente}</p>
                      <p className="text-sm text-texto-2">{t.venceEn(tiempoRestante(p.venceEn!, ahora))}</p>
                    </div>
                    <p className="font-bold">{formatearDolares(p.total)}</p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ganancia && (
        <Card className="flex flex-col gap-1 border border-borde">
          <p className="text-sm text-texto-2">{t.gananciaSemana}</p>
          <p className="text-2xl font-bold">{formatearDolares(ganancia.gananciaDespuesDeGastos)}</p>
          {ganancia.estimada && <p className="text-sm text-ambar-texto">{t.gananciaEstimada}</p>}
          <Link href="/ganancia" className="mt-1 inline-flex min-h-11 items-center text-teal underline">
            {t.verGanancia}
          </Link>
        </Card>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">{t.accesos}</h2>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/nuevo">{t.nuevoProducto}</ButtonLink>
          {negocio.puedeVender && (
            <ButtonLink variante="secundario" href="/pedidos/nuevo">
              {t.registrarVenta}
            </ButtonLink>
          )}
          <ButtonLink variante="secundario" href="/asistente">
            {t.hablarAsistente}
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
