import Image from "next/image";
import Link from "next/link";
import { BotonIconoLink } from "@/components/ui/BotonIcono";
import { Icon } from "@/components/ui/Icon";
import { TablaPunch, type ColumnaTabla } from "@/components/ui/TablaPunch";
import { StatusChip } from "@/components/ui/StatusChip";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares, formatearFecha, tiempoRestante } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Pedido } from "../repositorio";
import { urgenciaDeVencimiento } from "../vencimiento";
import { AccionPedido } from "./AccionPedido";

const t = textos.pedidos;

export const clasesUrgencia = {
  normal: "text-texto-2",
  pronto: "text-ambar-texto",
  critica: "font-medium text-error",
} as const;

// Lo que sirve de chip: "Esperando pago" o "Contra entrega" mientras está pendiente, y el canal después.
function chipDe(p: Pedido) {
  if (p.estado === "pendiente") {
    return p.contraEntrega
      ? { texto: t.lista.contraEntrega, clase: "bg-chip-celeste text-chip-texto-celeste", icono: "camion" as const }
      : { texto: t.lista.esperandoPago, clase: "bg-chip-amarillo text-chip-texto-amarillo", icono: "reloj" as const };
  }
  return { texto: t.canales[p.canal], clase: "bg-gris-100 text-chip-texto-neutro", icono: null };
}

function Chip({ p, mostrarEstado }: { p: Pedido; mostrarEstado: boolean }) {
  // En la vista de todos hay pedidos de cualquier estado: ahí el chip dice el estado.
  if (mostrarEstado) return <StatusChip estado={p.estado} discreto />;
  const chip = chipDe(p);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ring-teal-oscuro/10 ${chip.clase}`}>
      {chip.icono && <Icon nombre={chip.icono} className="size-4" />}
      {chip.texto}
    </span>
  );
}

function Avisos({ p, ahora }: { p: Pedido; ahora: Date }) {
  const vence = p.estado === "pendiente" && !p.contraEntrega ? p.venceEn : null;
  const debe = p.estado !== "pendiente" && p.estado !== "cancelado" && p.saldo > 0;
  return (
    <>
      {vence && (
        <span className={`text-sm ${clasesUrgencia[urgenciaDeVencimiento(vence, ahora)]}`}>
          {vence > ahora ? t.vence(tiempoRestante(vence, ahora)) : t.venceVencido}
        </span>
      )}
      {debe && <span className="text-sm text-ambar-texto">{t.lista.debe(formatearDolares(p.saldo))}</span>}
    </>
  );
}

function Foto({ p }: { p: Pedido }) {
  const foto = p.items.find((i) => i.foto)?.foto;
  return foto ? (
    <Image src={urlFoto(foto)} alt="" width={48} height={48} className="size-12 shrink-0 rounded-[14px] border border-linea object-cover" />
  ) : (
    <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-ficha-celeste text-teal-oscuro">
      <Icon nombre="caja" className="size-5" />
    </span>
  );
}

const productosDe = (p: Pedido) => p.items.map((i) => `${i.nombre} ×${i.cantidad}`).join(", ");

function Accion({ p, puedeVender }: { p: Pedido; puedeVender: boolean }) {
  return puedeVender ? (
    <AccionPedido
      pedidoId={p.id}
      codigo={p.codigo}
      cliente={p.cliente ?? t.sinCliente}
      estado={p.estado}
      contraEntrega={p.contraEntrega}
      saldo={p.saldo}
    />
  ) : null;
}

/**
 * Los pedidos como tabla cuando hay lugar (el ancho del propio contenedor, no el de la pantalla: con el menú
 * lateral abierto cabe menos) y como lista apilada cuando no. Cada fila lleva su botón para avanzar el pedido.
 */
export function ListaPedidos({
  pedidos,
  ahora,
  puedeVender,
  mostrarEstado = false,
}: {
  pedidos: Pedido[];
  ahora: Date;
  puedeVender: boolean;
  mostrarEstado?: boolean;
}) {
  const columnas: ColumnaTabla<Pedido>[] = [
    {
      id: "producto",
      encabezado: t.lista.producto,
      ancho: "max-w-64",
      celda: (p) => (
        <div className="flex items-center gap-3">
          <Foto p={p} />
          <span className="truncate font-semibold" title={productosDe(p)}>
            {p.items[0]?.nombre ?? t.pedido(p.codigo)}
            {p.items.length > 1 && <span className="font-normal text-texto-2"> {textos.inicio.masProductos(p.items.length - 1)}</span>}
          </span>
        </div>
      ),
    },
    { id: "cliente", encabezado: t.lista.cliente, ancho: "max-w-40", celda: (p) => <span className="block truncate">{p.cliente ?? t.sinCliente}</span> },
    {
      id: "pedido",
      encabezado: t.lista.pedido,
      sinCorte: true,
      celda: (p) => (
        <>
          <Link href={`/pedidos/${p.codigo}`} className="font-semibold text-teal-oscuro hover:underline">
            #{p.codigo}
          </Link>
          <span className="block text-texto-2">{formatearFecha(p.creadoEn)}</span>
        </>
      ),
    },
    { id: "total", encabezado: t.lista.total, alinear: "derecha", sinCorte: true, celda: (p) => <span className="font-semibold">{formatearDolares(p.total)}</span> },
    {
      id: "estado",
      encabezado: t.lista.estado,
      celda: (p) => (
        <div className="flex flex-col items-start gap-1">
          <Chip p={p} mostrarEstado={mostrarEstado} />
          <Avisos p={p} ahora={ahora} />
        </div>
      ),
    },
    {
      id: "accion",
      encabezado: t.lista.accion,
      alinear: "derecha",
      etiquetaOculta: true,
      celda: (p) => (
        <div className="flex items-center justify-end gap-2">
          <Accion p={p} puedeVender={puedeVender} />
          <BotonIconoLink variante="suave" tamano="chico" icono="diagonal" etiqueta={t.lista.detalles} href={`/pedidos/${p.codigo}`} />
        </div>
      ),
    },
  ];

  return (
    <TablaPunch
      etiqueta={t.titulo}
      columnas={columnas}
      filas={pedidos}
      clave={(p) => p.id}
      apilada={(p) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <Foto p={p} />
            <div className="min-w-0 flex-1">
              {/* El enlace cubre toda la fila; el botón de acción queda por encima (z-10) */}
              <Link href={`/pedidos/${p.codigo}`} className="block truncate font-semibold after:absolute after:inset-0">
                {p.cliente ?? t.sinCliente}
              </Link>
              <p className="truncate text-sm text-texto-2">
                {t.pedido(p.codigo)} · {formatearFecha(p.creadoEn)}
              </p>
              <p className="truncate text-sm text-texto-2">{productosDe(p)}</p>
            </div>
            <p className="font-semibold tabular-nums">{formatearDolares(p.total)}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pl-15">
            <div className="flex flex-col items-start gap-1">
              <Chip p={p} mostrarEstado={mostrarEstado} />
              <Avisos p={p} ahora={ahora} />
            </div>
            <Accion p={p} puedeVender={puedeVender} />
          </div>
        </div>
      )}
    />
  );
}
