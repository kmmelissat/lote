import { estiloBotonPunch, TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import { enlaceWhatsApp } from "@/features/catalog/enlaces";
import { formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Pedido } from "../repositorio";

const t = textos.pedidos;

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

/** Quién compró: su nombre, cómo escribirle, por dónde y cuándo pidió, y el estado del pedido. */
export function ClientePedido({ pedido: p, cliente }: { pedido: Pedido; cliente: string }) {
  const whatsapp = enlaceWhatsApp(p.contacto, t.detalle.mensajeCliente(cliente.split(" ")[0], p.codigo));
  return (
    <section aria-label={t.detalle.cliente} className={`${TARJETA_PUNCH} flex flex-col gap-4`}>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ficha-rosa font-bold text-chip-texto-rosa">
          {iniciales(cliente)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{cliente}</p>
          <p className="truncate text-sm text-texto-2">
            {t.canales[p.canal]} · {formatearFecha(p.creadoEn)}
            {p.contacto && ` · ${p.contacto}`}
          </p>
        </div>
      </div>
      {p.venceEn && p.saldo > 0 && p.estado === "pendiente" && (
        <p className="text-sm font-semibold">{t.detalle.venceEn(formatearFecha(p.venceEn))}</p>
      )}
      {whatsapp && (
        <a href={whatsapp} target="_blank" rel="noreferrer" className={`${estiloBotonPunch("secundario")} w-full justify-center`}>
          {t.detalle.escribirle}
        </a>
      )}
    </section>
  );
}
