import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { puedeCancelarse } from "@/domain";
import { listarPagos, obtenerPedido } from "@/features/orders/repositorio";
import { cobraAlEntregar, siguientePaso } from "@/features/orders/siguientePaso";
import { mensajeDeCobro } from "@/features/payments/mensajeCobroPedido";
import { obtenerEnvio, obtenerPagoPaquetera, obtenerTarifas } from "@/features/shipping/repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { AvisoCreado } from "@/features/products/ui/AvisoCreado";
import { AccionesPedido } from "@/features/orders/ui/AccionesPedido";
import { AccionPedido } from "@/features/orders/ui/AccionPedido";
import { ProductosDelPedido } from "@/features/orders/ui/ProductosDelPedido";
import { ProgresoPedido } from "@/features/orders/ui/ProgresoPedido";
import { ResumenPedido } from "@/features/orders/ui/ResumenPedido";
import { CobroPedido } from "@/features/payments/ui/CobroPedido";
import { EnlaceSeguimiento } from "@/features/tracking/ui/EnlaceSeguimiento";
import { EnvioPedido } from "@/features/shipping/ui/EnvioPedido";
import { PagoPaquetera } from "@/features/shipping/ui/PagoPaquetera";

const t = textos.pedidos;

export const metadata: Metadata = { title: t.titulo };

export default function PedidoPage({ params }: PageProps<"/pedidos/[codigo]">) {
  return (
    <>
      <AvisoCreado />
      <Detalle params={params} />
    </>
  );
}

async function Detalle({ params }: Pick<PageProps<"/pedidos/[codigo]">, "params">) {
  const codigo = Number((await params).codigo);
  if (!Number.isInteger(codigo)) notFound();

  const { supabase, negocio } = await negocioActual();
  const p = await obtenerPedido(supabase, negocio.id, codigo);
  if (!p) notFound();

  const ahora = new Date();
  const [pagos, envio, tarifas, mensaje] = await Promise.all([
    listarPagos(supabase, p.id),
    obtenerEnvio(supabase, p.id),
    obtenerTarifas(supabase, negocio.id),
    mensajeDeCobro(supabase, negocio.id, p, ahora),
  ]);

  const cliente = p.cliente ?? t.sinCliente;
  const esperaPaquetera = envio?.modo === "paquetera";
  const siguiente = siguientePaso(p, envio, ahora);

  return (
    <>
      <PageHeader
        titulo={t.pedido(p.codigo)}
        descripcion={cliente}
        volver={{ href: "/pedidos", etiqueta: t.volver }}
        accion={<StatusChip estado={p.estado} />}
      />

      <div className="flex flex-col gap-4">
        <ProgresoPedido
          estado={p.estado}
          cobraAlEntregar={cobraAlEntregar(p)}
          paquetera={esperaPaquetera}
          listo={Boolean(envio?.listo)}
          titulo={siguiente.titulo}
          ayuda={siguiente.ayuda}
          accion={
            negocio.puedeVender && (
              <AccionPedido
                grande
                pedidoId={p.id}
                codigo={p.codigo}
                cliente={cliente}
                estado={p.estado}
                contraEntrega={p.contraEntrega}
                saldo={p.saldo}
                esperaRecojo={esperaPaquetera && !envio.listo}
              />
            )
          }
        />

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
          {/* En el celular el resumen va primero; en escritorio queda a la izquierda y se queda a la vista */}
          <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-4">
            <ResumenPedido pedido={p} cliente={cliente} />
            <EnlaceSeguimiento pedidoId={p.id} />
            {negocio.puedeVender && <AccionesPedido pedidoId={p.id} siguiente={null} puedeCancelar={puedeCancelarse(p.estado)} />}
          </aside>

          <div className="flex min-w-0 flex-col gap-4">
            <ProductosDelPedido pedido={p} />

            <CobroPedido
              pedidoId={p.id}
              estado={p.estado}
              total={p.total}
              saldo={p.saldo}
              pagos={pagos}
              contraEntrega={p.contraEntrega}
              retiro={envio?.modo === "retiro"}
              mensaje={mensaje}
              puedeVender={negocio.puedeVender}
            />

            <EnvioPedido
              pedidoId={p.id}
              estado={p.estado}
              cliente={p.cliente}
              envio={envio}
              tarifas={tarifas}
              puedeVender={negocio.puedeVender}
            />

            {negocio.puedeGestionar && envio?.modo === "paquetera" && envio.costo > 0 && p.estado !== "cancelado" && (
              <PagoPaquetera pedidoId={p.id} costo={envio.costo} pago={await obtenerPagoPaquetera(supabase, p.id)} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
