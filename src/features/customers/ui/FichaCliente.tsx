import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { colorDeEstado, StatusChip } from "@/components/ui/StatusChip";
import { TarjetaDato } from "@/components/ui/TarjetaDato";
import { enlaceWhatsApp } from "@/features/catalog/enlaces";
import { formatearDolares, formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { ClienteConResumen } from "../repositorio";
import { inicialDe } from "./cara";

const t = textos.clientes;

/** La ficha de una clienta: quién es, lo que ha comprado, lo que debe y el historial de pedidos. */
export function FichaCliente({ cliente: c, negocio }: { cliente: ClienteConResumen; negocio: string }) {
  const debe = c.resumen.saldo > 0;
  const escribir = enlaceWhatsApp(
    c.contacto,
    debe ? t.cobrarMensaje(c.nombre.split(" ")[0], formatearDolares(c.resumen.saldo), negocio) : `Hola ${c.nombre.split(" ")[0]}`,
  );

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center gap-4">
        <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-full bg-teal-fondo font-logo text-3xl font-bold text-teal-oscuro">
          {inicialDe(c.nombre)}
        </span>
        <div className="min-w-0 flex-1 basis-56">
          <p className="truncate font-logo text-2xl font-bold leading-tight">{c.nombre}</p>
          <p className="text-texto-2">{c.contacto ?? t.sinContacto}</p>
          {c.resumen.ultimoPedido && (
            <p className="text-sm text-texto-2">
              {t.ultimoPedido}: {formatearFecha(c.resumen.ultimoPedido)}
            </p>
          )}
        </div>
        {escribir && (
          <ButtonLink href={escribir} target="_blank" rel="noopener noreferrer" variante={debe ? "mango" : "secundario"} icono="chat">
            {debe ? t.cobrar : t.escribirle}
          </ButtonLink>
        )}
      </Card>

      <section aria-label={t.stats.titulo} className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <TarjetaDato etiqueta={t.comprado} valor={formatearDolares(c.resumen.comprado)} texto={t.stats.compraronNota} banda={colorDeEstado("pagado")} icono="carrito" />
        <TarjetaDato
          etiqueta={t.saldo}
          valor={formatearDolares(c.resumen.saldo)}
          texto={debe ? t.debe(formatearDolares(c.resumen.saldo)) : t.alDia}
          banda={colorDeEstado("pendiente")}
          icono="moneda"
        />
        <TarjetaDato etiqueta={t.historial} valor={c.resumen.pedidos} texto={t.pedidos(c.resumen.pedidos)} banda={colorDeEstado("enviado")} icono="pedidos" />
      </section>

      {c.notas && (
        <Card className="flex flex-col gap-1">
          <h2 className="text-xs font-bold uppercase tracking-wide text-texto-2">{t.notas}</h2>
          <p className="leading-relaxed">{c.notas}</p>
        </Card>
      )}

      <section aria-labelledby="historial" className="flex flex-col gap-3">
        <h2 id="historial" className="font-logo text-xl font-semibold">
          {t.historial}
        </h2>
        {!c.pedidos.length ? (
          <Card className="text-center text-texto-2">{t.sinPedidos}</Card>
        ) : (
          <Card className="overflow-hidden p-0 md:p-0">
            <ul>
              {c.pedidos.map((p) => (
                <li key={p.codigo} className="relative flex flex-col gap-1.5 border-t border-borde px-4 py-3 first:border-t-0 hover:bg-teal-fondo">
                  <span className="flex items-start justify-between gap-3">
                    {/* El enlace cubre toda la fila */}
                    <Link href={`/pedidos/${p.codigo}`} className="font-medium after:absolute after:inset-0">
                      {textos.pedidos.pedido(p.codigo)}
                    </Link>
                    <span className="font-bold tabular-nums">{formatearDolares(p.total)}</span>
                  </span>
                  {p.productos && <span className="truncate text-sm text-texto-2">{p.productos}</span>}
                  <span className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <StatusChip estado={p.estado} discreto />
                    <span className="text-texto-2">
                      {formatearFecha(p.creadoEn)}
                      {p.saldo > 0 && p.estado !== "cancelado" ? ` · ${t.debe(formatearDolares(p.saldo))}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
