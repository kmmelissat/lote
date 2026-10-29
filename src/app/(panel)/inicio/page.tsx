import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TarjetaPrimerosPasos } from "@/features/home/TarjetaPrimerosPasos";
import { GraficoSemanas } from "@/features/home/ui/GraficoSemanas";
import { PedidosRecientes } from "@/features/home/ui/PedidosRecientes";
import { TarjetaAtencion } from "@/features/home/ui/TarjetaAtencion";
import { TarjetaDato } from "@/features/home/ui/TarjetaDato";
import { TarjetaVitrina } from "@/features/home/ui/TarjetaVitrina";
import { TarjetaGanancia } from "@/features/home/ui/TarjetaGanancia";
import { faltanPasos, primerosPasos } from "@/features/home/primerosPasos";
import { resumenInicio } from "@/features/home/resumen";
import { buscarPedidos, paginaDePedidos } from "@/features/orders/repositorio";
import { listarMetodos } from "@/features/payments/repositorio";
import { contarUnidades } from "@/features/products/repositorio";
import { resumenPorSemana } from "@/features/profit/repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.inicio;

const SEMANAS_DEL_GRAFICO = 6;

export const metadata: Metadata = { title: t.titulo };

export default function InicioPage() {
  return <Contenido />;
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

  const encabezado = (
    <PageHeader
      titulo={t.saludo(negocio.nombre)}
      descripcion={t.resumenDisponibles(unidades.disponibles)}
      accion={
        <ButtonLink variante="mango" href="/productos/nuevo">
          {t.nuevoProducto}
        </ButtonLink>
      }
    />
  );

  // Sin unidades de ningún tipo es que todavía no hay productos.
  if (unidades.disponibles + unidades.apartadas + unidades.vendidas === 0) {
    return (
      <>
        <PageHeader titulo={t.saludo(negocio.nombre)} descripcion={t.resumenDisponibles(0)} />
        <EmptyState
          titulo={t.vacioTitulo}
          texto={t.vacioTexto}
          accion={<ButtonLink href="/productos/nuevo">{t.vacioAccion}</ButtonLink>}
        />
      </>
    );
  }

  // La semana actual es la última del gráfico: no hace falta pedirla aparte.
  const ganancia = semanas?.at(-1)?.resumen ?? null;
  const anterior = semanas?.at(-2)?.resumen.gananciaDespuesDeGastos ?? null;

  const r = resumenInicio(unidades, pedidos, ahora);
  const pasos = metodos
    ? primerosPasos({
        tieneProductos: true,
        tieneMetodoPago: metodos.some((m) => m.activo),
        tienePedidos: r.apartadas + r.vendidas > 0 || pedidos.length > 0,
      })
    : [];
  // Sin ningún pedido todavía no hay nada que graficar ni listar: se esconde en vez de mostrar widgets vacíos.
  const sinMovimiento = recientes.length === 0;
  // Sin nada que atender la tarjeta no existe: el gráfico ocupa su lugar para que no quede un hueco.
  const hayAtencion = r.porPagar > 0 || r.porEnviar > 0 || r.seEnfrian.length > 0;

  return (
    <>
      {encabezado}
      <div className="flex flex-col gap-3">
        {faltanPasos(pasos) && <TarjetaPrimerosPasos pasos={pasos} />}

        <section aria-labelledby="contadores" className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <h2 id="contadores" className="sr-only">
            {t.contadores}
          </h2>
          {ganancia && !sinMovimiento && (
            <TarjetaGanancia ganancia={ganancia.gananciaDespuesDeGastos} anterior={anterior} estimada={ganancia.estimada} />
          )}
          <div className={`grid grid-cols-1 gap-3 sm:grid-cols-3 ${ganancia && !sinMovimiento ? "lg:col-span-2" : "lg:col-span-3"}`}>
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
          </div>
        </section>

        {negocio.vitrinaActiva && <TarjetaVitrina slug={negocio.slug} />}

        {sinMovimiento ? (
          <TarjetaAtencion r={r} ahora={ahora} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className={`min-w-0 ${hayAtencion ? "lg:col-span-2" : "lg:col-span-3"}`}>
                {semanas ? <GraficoSemanas semanas={semanas} /> : <PedidosRecientes pedidos={recientes} />}
              </div>
              <TarjetaAtencion r={r} ahora={ahora} />
            </div>
            {semanas && <PedidosRecientes pedidos={recientes} />}
          </>
        )}
      </div>
    </>
  );
}
