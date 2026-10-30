import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TarjetaPrimerosPasos } from "@/features/home/TarjetaPrimerosPasos";
import { GraficoSemanas } from "@/features/home/ui/GraficoSemanas";
import { PedidosRecientes } from "@/features/home/ui/PedidosRecientes";
import { TarjetaAtencion } from "@/features/home/ui/TarjetaAtencion";
import { TarjetaDato } from "@/features/home/ui/TarjetaDato";
import { TarjetaExplorar } from "@/features/home/ui/TarjetaExplorar";
import { contarPendientes } from "@/features/reviews/repositorio";
import { AvisoResenas } from "@/features/reviews/ui/AvisoResenas";
import { TarjetaVitrina } from "@/features/home/ui/TarjetaVitrina";
import { TarjetaGanancia } from "@/features/home/ui/TarjetaGanancia";
import { COOKIE_COMPARTIO, COOKIE_PASOS_VISTOS, mostrarPasos, pasosVistos, primerosPasos } from "@/features/home/primerosPasos";
import { leerConfiguracion } from "@/features/home/configuracion";
import { TarjetaBienvenida } from "@/features/home/ui/TarjetaBienvenida";
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

export default async function InicioPage({ searchParams }: PageProps<"/inicio">) {
  const { bienvenida } = await searchParams;
  return <Contenido bienvenida={bienvenida === "1"} />;
}

async function Contenido({ bienvenida }: { bienvenida: boolean }) {
  const { supabase, negocio } = await negocioActual();
  const galletas = await cookies();
  const ahora = new Date();

  const [unidades, pedidos, recientes, semanas, metodos, config] = await Promise.all([
    contarUnidades(supabase, negocio.id),
    buscarPedidos(supabase, negocio.id, ["pendiente", "pagado", "preparando"]),
    paginaDePedidos(supabase, negocio.id, 0, 5),
    // El costo solo lo ve quien gestiona: para el resto no se pide la ganancia.
    negocio.puedeGestionar ? resumenPorSemana(supabase, negocio.id, ahora, SEMANAS_DEL_GRAFICO) : null,
    // Los primeros pasos son para quien configura el negocio.
    negocio.puedeGestionar ? listarMetodos(supabase, negocio.id) : null,
    negocio.puedeGestionar ? leerConfiguracion(supabase, negocio.id) : null,
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
  const sinProductos = unidades.disponibles + unidades.apartadas + unidades.vendidas === 0;
  const r = resumenInicio(unidades, pedidos, ahora);
  const pasos = metodos && config
    ? primerosPasos({
        tieneProductos: !sinProductos,
        tieneLogo: negocio.logo !== null,
        tieneContacto: config.tieneContacto,
        tieneMetodoPago: metodos.some((m) => m.activo),
        tieneEnvios: config.tieneEnvios,
        compartio: galletas.get(COOKIE_COMPARTIO)?.value === negocio.id,
        tienePedidos: r.apartadas + r.vendidas > 0 || pedidos.length > 0,
        vitrinaActiva: negocio.vitrinaActiva,
      })
    : [];
  const vistos = pasosVistos(galletas.get(COOKIE_PASOS_VISTOS)?.value, negocio.id);
  const tarjetaPasos = mostrarPasos(pasos, vistos) && (
    <TarjetaPrimerosPasos pasos={pasos} vistos={vistos} negocioId={negocio.id} slug={negocio.slug} />
  );
  const tarjetaBienvenida = bienvenida && (
    <TarjetaBienvenida nombre={negocio.nombre} negocioId={negocio.id} slug={negocio.slug} conVitrina={negocio.vitrinaActiva} />
  );

  if (sinProductos) {
    return (
      <>
        <PageHeader titulo={t.saludo(negocio.nombre)} descripcion={t.resumenDisponibles(0)} />
        <div className="flex flex-col gap-3">
          {tarjetaBienvenida}
          {/* Quien configura el negocio ve los pasos (el primero es agregar un producto); el resto, el aviso de siempre */}
          {tarjetaPasos || (
            <EmptyState
              titulo={t.vacioTitulo}
              texto={t.vacioTexto}
              accion={negocio.puedeGestionar ? <ButtonLink href="/productos/nuevo">{t.vacioAccion}</ButtonLink> : undefined}
            />
          )}
        </div>
      </>
    );
  }

  // La semana actual es la última del gráfico: no hace falta pedirla aparte.
  const ganancia = semanas?.at(-1)?.resumen ?? null;
  const anterior = semanas?.at(-2)?.resumen.gananciaDespuesDeGastos ?? null;
  const pendientesResenas = negocio.puedeGestionar ? await contarPendientes(supabase, negocio.id) : 0;

  // Sin ningún pedido todavía no hay nada que graficar ni listar: se esconde en vez de mostrar widgets vacíos.
  const sinMovimiento = recientes.length === 0;
  const hayGanancia = Boolean(ganancia && !sinMovimiento);
  // Sin nada que atender la tarjeta no existe: el gráfico ocupa su lugar para que no quede un hueco.
  const hayAtencion = r.porPagar > 0 || r.porEnviar > 0 || r.seEnfrian.length > 0;

  return (
    <>
      {encabezado}
      <div className="flex flex-col gap-3 md:gap-6">
        {(tarjetaBienvenida || tarjetaPasos) && (
          <div className="flex flex-col gap-3">
            {tarjetaBienvenida}
            {tarjetaPasos}
          </div>
        )}

        <AvisoResenas pendientes={pendientesResenas} />

        <section aria-labelledby="contadores">
          <h2 id="contadores" className="sr-only">
            {t.contadores}
          </h2>
          <div className={`grid grid-cols-3 gap-3 ${hayGanancia ? "xl:grid-cols-4" : ""}`}>
            {hayGanancia && ganancia && (
              <div className="col-span-3 xl:col-span-1">
                <TarjetaGanancia ganancia={ganancia.gananciaDespuesDeGastos} anterior={anterior} estimada={ganancia.estimada} />
              </div>
            )}
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

        {sinMovimiento ? (
          <TarjetaAtencion r={r} ahora={ahora} />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className={`min-w-0 ${hayAtencion ? "lg:col-span-2" : "lg:col-span-3"}`}>
                {semanas ? <GraficoSemanas semanas={semanas} /> : <PedidosRecientes pedidos={recientes} />}
              </div>
              <TarjetaAtencion r={r} ahora={ahora} />
            </div>
            {semanas && <PedidosRecientes pedidos={recientes} />}
          </div>
        )}

        {negocio.vitrinaActiva && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <TarjetaVitrina slug={negocio.slug} />
            <TarjetaExplorar visible={negocio.visibleEnExplorar} />
          </div>
        )}
      </div>
    </>
  );
}
