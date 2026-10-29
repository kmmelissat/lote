import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Monito } from "@/components/ui/Monito";
import { Icon } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares, formatearFecha, tiempoRestante } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Pedido } from "../repositorio";
import { urgenciaDeVencimiento } from "../vencimiento";
import { AccionPedido } from "./AccionPedido";

const t = textos.pedidos;

const clasesUrgencia = {
  normal: "text-texto-2",
  pronto: "text-ambar-texto",
  critica: "font-medium text-error",
} as const;

// Lo que sirve de chip: "Esperando pago" o "Contra entrega" mientras está pendiente, y el canal después.
function chipDe(p: Pedido) {
  if (p.estado === "pendiente") {
    return p.contraEntrega
      ? { texto: t.lista.contraEntrega, clase: "bg-azul-fondo text-teal-oscuro", icono: "camion" as const }
      : { texto: t.lista.esperandoPago, clase: "bg-perla text-ambar-texto", icono: "reloj" as const };
  }
  return { texto: t.canales[p.canal], clase: "bg-gris-fondo text-texto-2", icono: null };
}

function Chip({ p, mostrarEstado }: { p: Pedido; mostrarEstado: boolean }) {
  // En la vista de todos hay pedidos de cualquier estado: ahí el chip dice el estado.
  if (mostrarEstado) return <StatusChip estado={p.estado} />;
  const chip = chipDe(p);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${chip.clase}`}>
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
    <Image src={urlFoto(foto)} alt="" width={48} height={48} className="size-12 shrink-0 rounded-xl border-2 border-teal-oscuro/20 object-cover" />
  ) : (
    <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-teal-oscuro/20 bg-crema">
      <Monito nombre="caja" className="w-5 text-teal/50" />
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
  return (
    <div className="@container">
      {/* Tabla */}
      <div className="hidden overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-superficie shadow-dura @2xl:block">
        <table className="w-full text-left">
          <thead className="border-b-2 border-teal-oscuro bg-crema text-xs font-bold text-teal-oscuro">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">{t.lista.producto}</th>
              <th scope="col" className="px-2 py-2 font-medium">{t.lista.cliente}</th>
              <th scope="col" className="px-2 py-2 font-medium">{t.lista.pedido}</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">{t.lista.total}</th>
              <th scope="col" className="px-2 py-2 font-medium">{t.lista.estado}</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">{t.lista.accion}</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id} className="border-t border-borde first:border-t-0 hover:bg-limon/25">
                <td className="max-w-64 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Foto p={p} />
                    <span className="truncate font-medium" title={productosDe(p)}>
                      {p.items[0]?.nombre ?? t.pedido(p.codigo)}
                      {p.items.length > 1 && <span className="font-normal text-texto-2"> {textos.inicio.masProductos(p.items.length - 1)}</span>}
                    </span>
                  </div>
                </td>
                <td className="max-w-40 truncate px-2 py-3">{p.cliente ?? t.sinCliente}</td>
                <td className="px-2 py-3 text-sm">
                  <Link href={`/pedidos/${p.codigo}`} className="font-medium text-teal underline">
                    #{p.codigo}
                  </Link>
                  <span className="block text-texto-2">{formatearFecha(p.creadoEn)}</span>
                </td>
                <td className="whitespace-nowrap px-2 py-3 text-right font-bold">{formatearDolares(p.total)}</td>
                <td className="px-2 py-3">
                  <div className="flex flex-col items-start gap-1">
                    <Chip p={p} mostrarEstado={mostrarEstado} />
                    <Avisos p={p} ahora={ahora} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Accion p={p} puedeVender={puedeVender} />
                    <ButtonLink href={`/pedidos/${p.codigo}`} variante="secundario" className="h-9 max-md:min-h-11 px-4 text-sm">
                      {t.lista.detalles}
                    </ButtonLink>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lista apilada */}
      <ul className="overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-superficie shadow-dura @2xl:hidden">
        {pedidos.map((p) => (
          <li key={p.id} className="relative flex flex-col gap-2 border-t border-borde px-4 py-3 first:border-t-0 hover:bg-limon/25">
            <div className="flex items-start gap-3">
              <Foto p={p} />
              <div className="min-w-0 flex-1">
                {/* El enlace cubre toda la fila; el botón de acción queda por encima (z-10) */}
                <Link href={`/pedidos/${p.codigo}`} className="block truncate font-medium after:absolute after:inset-0">
                  {p.cliente ?? t.sinCliente}
                </Link>
                <p className="truncate text-sm text-texto-2">
                  {t.pedido(p.codigo)} · {formatearFecha(p.creadoEn)}
                </p>
                <p className="truncate text-sm text-texto-2">{productosDe(p)}</p>
              </div>
              <p className="font-bold">{formatearDolares(p.total)}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pl-15">
              <div className="flex flex-col items-start gap-1">
                <Chip p={p} mostrarEstado={mostrarEstado} />
                <Avisos p={p} ahora={ahora} />
              </div>
              <Accion p={p} puedeVender={puedeVender} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
