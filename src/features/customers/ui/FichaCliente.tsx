import Link from "next/link";
import { estiloBotonPunch, TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { StatusChip } from "@/components/ui/StatusChip";
import { TablaPunch, type ColumnaTabla } from "@/components/ui/TablaPunch";
import { enlaceWhatsApp } from "@/features/catalog/enlaces";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { ClienteConResumen } from "../repositorio";
import { inicialDe } from "./cara";

const t = textos.clientes;

type Pedido = ClienteConResumen["pedidos"][number];

function Dato({ etiqueta, valor, nota, icono, ficha, texto }: { etiqueta: string; valor: string | number; nota: string; icono: NombreIcono; ficha: string; texto: string }) {
  return (
    <div className={`${TARJETA_PUNCH} flex flex-col gap-3`}>
      <span aria-hidden="true" className={`flex size-9 items-center justify-center rounded-full ${ficha} ${texto}`}>
        <Icon nombre={icono} className="size-4" />
      </span>
      <div>
        <p className="text-sm text-texto-2">{etiqueta}</p>
        <p className="text-2xl font-semibold tabular-nums">{valor}</p>
        <p className="text-xs text-texto-2">{nota}</p>
      </div>
    </div>
  );
}

const debeDe = (p: Pedido) => (p.saldo > 0 && p.estado !== "cancelado" && !(p.contraEntrega && p.estado !== "entregado") ? t.debe(formatearDolares(p.saldo)) : null);

/** La ficha de un cliente: quién es, lo que ha comprado, lo que debe y el historial de pedidos. */
export function FichaCliente({ cliente: c, negocio }: { cliente: ClienteConResumen; negocio: string }) {
  const debe = c.resumen.saldo > 0;
  const primero = c.nombre.split(" ")[0];
  const escribir = enlaceWhatsApp(c.contacto, debe ? t.cobrarMensaje(primero, formatearDolares(c.resumen.saldo), negocio) : `Hola ${primero}`);
  const contactos = [c.contacto, c.usuario, c.correo].filter(Boolean);

  const columnas: ColumnaTabla<Pedido>[] = [
    {
      id: "pedido",
      encabezado: t.historial,
      sinCorte: true,
      celda: (p) => (
        <Link href={`/pedidos/${p.codigo}`} className="font-semibold text-teal-oscuro hover:underline">
          {textos.pedidos.pedido(p.codigo)}
        </Link>
      ),
    },
    { id: "productos", encabezado: textos.pedidos.lista.producto, ancho: "max-w-64", celda: (p) => <span className="block truncate text-texto-2">{p.productos}</span> },
    { id: "fecha", encabezado: textos.pedidos.lista.pedido, sinCorte: true, celda: (p) => <span className="text-texto-2">{formatearFecha(p.creadoEn)}</span> },
    {
      id: "estado",
      encabezado: textos.pedidos.lista.estado,
      celda: (p) => (
        <div className="flex flex-col items-start gap-1">
          <StatusChip estado={p.estado} discreto />
          {debeDe(p) && <span className="text-sm text-ambar-texto">{debeDe(p)}</span>}
        </div>
      ),
    },
    { id: "total", encabezado: textos.pedidos.lista.total, alinear: "derecha", sinCorte: true, celda: (p) => <span className="font-semibold">{formatearDolares(p.total)}</span> },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <section aria-labelledby="historial" className="order-2 flex flex-col gap-3 lg:order-1">
        <h2 id="historial" className="text-lg font-semibold">
          {t.historial}
        </h2>
        {!c.pedidos.length ? (
          <p className={`${TARJETA_PUNCH} text-center text-texto-2`}>{t.sinPedidos}</p>
        ) : (
          <TablaPunch
            etiqueta={t.historial}
            columnas={columnas}
            filas={c.pedidos}
            clave={(p) => String(p.codigo)}
            apilada={(p) => (
              <div className="flex flex-col gap-1.5">
                <span className="flex items-start justify-between gap-3">
                  {/* El enlace cubre toda la fila */}
                  <Link href={`/pedidos/${p.codigo}`} className="font-semibold after:absolute after:inset-0">
                    {textos.pedidos.pedido(p.codigo)}
                  </Link>
                  <span className="font-semibold tabular-nums">{formatearDolares(p.total)}</span>
                </span>
                {p.productos && <span className="truncate text-sm text-texto-2">{p.productos}</span>}
                <span className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <StatusChip estado={p.estado} discreto />
                  <span className="text-texto-2">
                    {formatearFecha(p.creadoEn)}
                    {debeDe(p) ? ` · ${debeDe(p)}` : ""}
                  </span>
                </span>
              </div>
            )}
          />
        )}
      </section>

      <div className="order-1 flex flex-col gap-4 lg:order-2">
        <section className={`${TARJETA_PUNCH} flex flex-col gap-4`}>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ficha-rosa text-lg font-bold text-chip-texto-rosa">
              {inicialDe(c.nombre)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{c.nombre}</p>
              {c.resumen.ultimoPedido && (
                <p className="text-sm text-texto-2">
                  {t.ultimoPedido}: {formatearFecha(c.resumen.ultimoPedido)}
                </p>
              )}
            </div>
          </div>
          <ul className="flex flex-col gap-1 text-sm text-texto-2">
            {contactos.length ? contactos.map((v) => <li key={v} className="break-all">{v}</li>) : <li>{t.sinContacto}</li>}
          </ul>
          {escribir && (
            <a
              href={escribir}
              target="_blank"
              rel="noopener noreferrer"
              className={`${estiloBotonPunch(debe ? "primario" : "secundario")} w-full`}
            >
              <Icon nombre="chat" className="size-4" />
              {debe ? t.cobrar : t.escribirle}
            </a>
          )}
        </section>

        <section aria-label={t.stats.titulo} className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <Dato etiqueta={t.comprado} valor={formatearDolares(c.resumen.comprado)} nota={t.stats.compraronNota} icono="carrito" ficha="bg-ficha-verde" texto="text-chip-texto-verde" />
          <Dato etiqueta={t.saldo} valor={formatearDolares(c.resumen.saldo)} nota={debe ? t.debe(formatearDolares(c.resumen.saldo)) : c.resumen.alEntregar > 0 ? t.alEntregar(formatearDolares(c.resumen.alEntregar)) : t.alDia} icono="moneda" ficha="bg-ficha-amarillo" texto="text-chip-texto-amarillo" />
        </section>

        {c.notas && (
          <section className={`${TARJETA_PUNCH} flex flex-col gap-1`}>
            <h2 className="text-sm font-semibold">{t.notas}</h2>
            <p className="text-sm leading-relaxed text-texto-2">{c.notas}</p>
          </section>
        )}
      </div>
    </div>
  );
}
