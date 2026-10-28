import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TarjetaPrimerosPasos } from "@/features/home/TarjetaPrimerosPasos";
import { DonaInventario } from "@/features/home/ui/DonaInventario";
import { GraficoSemanas } from "@/features/home/ui/GraficoSemanas";
import { PedidosRecientes } from "@/features/home/ui/PedidosRecientes";
import { TarjetaAtencion } from "@/features/home/ui/TarjetaAtencion";
import { TarjetaDato } from "@/features/home/ui/TarjetaDato";
import { faltanPasos, primerosPasos } from "@/features/home/primerosPasos";
import { resumenInicio } from "@/features/home/resumen";
import { buscarPedidos, paginaDePedidos } from "@/features/orders/repositorio";
import { listarMetodos } from "@/features/payments/repositorio";
import { contarUnidades } from "@/features/products/repositorio";
import { resumenPorSemana } from "@/features/profit/repositorio";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.inicio;

const SEMANAS_DEL_GRAFICO = 6;

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

  const [unidades, pedidos, recientes, semanas, metodos] = await Promise.all([
    contarUnidades(supabase, negocio.id),
    buscarPedidos(supabase, negocio.id, ["pendiente", "pagado", "preparando"]),
    paginaDePedidos(supabase, negocio.id, 0, 5),
    // El costo solo lo ve quien gestiona: para el resto no se pide la ganancia.
    negocio.puedeGestionar ? resumenPorSemana(supabase, negocio.id, ahora, SEMANAS_DEL_GRAFICO) : null,
    // Los primeros pasos son para quien configura el negocio.
    negocio.puedeGestionar ? listarMetodos(supabase, negocio.id) : null,
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

  // La semana actual es la última del gráfico: no hace falta pedirla aparte.
  const ganancia = semanas?.at(-1)?.resumen ?? null;

  const r = resumenInicio(unidades, pedidos, ahora);
  const pasos = metodos
    ? primerosPasos({
        tieneProductos: true,
        tieneMetodoPago: metodos.some((m) => m.activo),
        tienePedidos: r.apartadas + r.vendidas > 0 || pedidos.length > 0,
      })
    : [];

  return (
    <div className="flex flex-col gap-3">
      {faltanPasos(pasos) && <TarjetaPrimerosPasos pasos={pasos} />}

      <section aria-labelledby="contadores" className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <h2 id="contadores" className="sr-only">
          {t.contadores}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          <TarjetaDato
            etiqueta={t.disponibles}
            valor={r.disponibles}
            texto={t.quePasa.disponibles}
            href="/productos?estado=disponible"
            chip={r.disponibles === 0 ? { texto: t.agotado, tono: "ambar" } : undefined}
          />
          <TarjetaDato
            etiqueta={t.apartados}
            valor={r.apartadas}
            texto={t.quePasa.apartados}
            href="/pedidos?estado=pendiente"
            chip={r.seEnfrian.length > 0 ? { texto: t.seEnfrianChip(r.seEnfrian.length), tono: "ambar" } : undefined}
          />
          <TarjetaDato etiqueta={t.vendidos} valor={r.vendidas} texto={t.quePasa.vendidos} href="/productos?estado=vendido" />
          {ganancia ? (
            <TarjetaDato
              etiqueta={t.gananciaSemana}
              valor={formatearDolares(ganancia.gananciaDespuesDeGastos)}
              texto={t.quePasa.ganancia}
              href="/ganancia"
              chip={ganancia.estimada ? { texto: t.gananciaEstimada, tono: "ambar" } : undefined}
            />
          ) : (
            <TarjetaDato etiqueta={t.porEnviarEtiqueta} valor={r.porEnviar} texto={t.quePasa.porEnviar} href="/pedidos?estado=pagado" />
          )}
        </div>
        <DonaInventario unidades={unidades} />
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          {semanas ? <GraficoSemanas semanas={semanas} /> : <PedidosRecientes pedidos={recientes} />}
        </div>
        <TarjetaAtencion r={r} ahora={ahora} />
      </div>
      {semanas && <PedidosRecientes pedidos={recientes} />}

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">{t.accesos}</h2>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/nuevo">{t.nuevoProducto}</ButtonLink>
          {negocio.puedeVender && (
            <ButtonLink variante="secundario" href="/pedidos/nuevo">
              {t.registrarVenta}
            </ButtonLink>
          )}
          <ButtonLink variante="secundario" href="/clientes">
            {textos.nav.clientes}
          </ButtonLink>
          <ButtonLink variante="secundario" href="/asistente">
            {t.hablarAsistente}
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
