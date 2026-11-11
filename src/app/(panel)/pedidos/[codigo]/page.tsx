import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { puedeCancelarse } from "@/domain";
import { listarPagos, motivoDeCancelacion, obtenerPedido } from "@/features/orders/repositorio";
import { cobraAlEntregar, siguientePaso } from "@/features/orders/siguientePaso";
import { mensajeDeCobro } from "@/features/payments/mensajeCobroPedido";
import { obtenerEnvio, obtenerPagoPaquetera, obtenerTarifas } from "@/features/shipping/repositorio";
import { cuentasDelNegocio, devueltoDelPedido } from "@/features/gestion/repositorio";
import { gananciaDelPedido } from "@/features/profit/repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { AvisoCreado } from "@/features/products/ui/AvisoCreado";
import { AccionesPedido } from "@/features/orders/ui/AccionesPedido";
import { AccionPedido } from "@/features/orders/ui/AccionPedido";
import { ProductosDelPedido } from "@/features/orders/ui/ProductosDelPedido";
import { ProgresoPedido } from "@/features/orders/ui/ProgresoPedido";
import { ClientePedido } from "@/features/orders/ui/ClientePedido";
import { DevolucionPedido } from "@/features/payments/ui/DevolucionPedido";
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
  const [pagos, envio, tarifas, mensaje, pagoPaquetera, cuentas, devuelto, motivo, ganancia] = await Promise.all([
    listarPagos(supabase, p.id),
    obtenerEnvio(supabase, p.id),
    obtenerTarifas(supabase, negocio.id),
    mensajeDeCobro(supabase, negocio.id, p, ahora),
    negocio.puedeGestionar ? obtenerPagoPaquetera(supabase, p.id) : null,
    negocio.puedeGestionar ? cuentasDelNegocio(supabase, negocio.id) : [],
    negocio.puedeGestionar && p.estado === "cancelado" ? devueltoDelPedido(supabase, negocio.id, p.id) : 0,
    p.estado === "cancelado" ? motivoDeCancelacion(supabase, p.id) : null,
    negocio.puedeGestionar ? gananciaDelPedido(supabase, negocio.id, p.id, p.creadoEn) : null,
  ]);

  const cliente = p.cliente ?? t.sinCliente;
  const esperaPaquetera = envio?.modo === "paquetera";
  const siguiente = siguientePaso(p, envio, ahora);

  return (
    <>
      <PageHeader
        titulo={t.pedido(p.codigo)}
        volver={{ href: "/pedidos", etiqueta: t.volver }}
        accion={negocio.puedeVender && <AccionesPedido pedidoId={p.id} siguiente={null} puedeCancelar={puedeCancelarse(p.estado)} cobrado={p.total - p.saldo} />}
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <ProgresoPedido
            estado={p.estado}
            motivo={motivo ? textos.pedidos.acciones.motivos[motivo] : undefined}
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
          <ProductosDelPedido pedido={p} ganancia={ganancia} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <ClientePedido pedido={p} cliente={cliente} />

          <EnvioPedido
            pedidoId={p.id}
            estado={p.estado}
            cliente={p.cliente}
            envio={envio}
            tarifas={tarifas}
            puedeVender={negocio.puedeVender}
            seguimiento={p.estado === "cancelado" ? undefined : <EnlaceSeguimiento pedidoId={p.id} />}
            pagoPaquetera={
              negocio.puedeGestionar && envio?.modo === "paquetera" && envio.costo > 0 && p.estado !== "cancelado" ? (
                <PagoPaquetera pedidoId={p.id} costo={envio.costo} pago={pagoPaquetera} cuentas={cuentas} />
              ) : undefined
            }
          />

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

          {negocio.puedeGestionar && p.estado === "cancelado" && p.total - p.saldo > 0 && (
            <DevolucionPedido codigo={p.codigo} cobrado={p.total - p.saldo} devuelto={devuelto} cuentas={cuentas} />
          )}
        </div>
      </div>
    </>
  );
}
