import type { Centavos, EstadoPedido } from "@/domain";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.pedidos;

export type SiguientePaso = { titulo: string; ayuda?: string };

type PedidoParaPaso = { estado: EstadoPedido; total: Centavos; saldo: Centavos; contraEntrega: boolean; venceEn: Date | null };

/** Contra entrega con saldo: lo que falta se cobra al entregar, no antes. */
export const cobraAlEntregar = (p: { contraEntrega: boolean; saldo: Centavos }) => p.contraEntrega && p.saldo > 0;

/**
 * Lo que toca hacer ahora con el pedido, para el cartel de arriba del detalle. Depende de cómo se cobra (contra entrega
 * o antes) y de cómo se entrega: con paquetera hay un paso más, que ella pase a recogerlo.
 */
export function siguientePaso(p: PedidoParaPaso, envio: { modo: string; listo: boolean } | null, ahora: Date): SiguientePaso {
  const s = t.detalle.siguiente;
  const pagado = p.total - p.saldo;
  const saldoTexto = formatearDolares(p.saldo);
  const alEntregar = cobraAlEntregar(p);
  switch (p.estado) {
    case "pendiente":
      if (alEntregar) {
        return {
          titulo: s.contraEntrega(saldoTexto),
          ayuda: !envio ? s.contraEntregaSinEnvio : pagado > 0 ? s.contraEntregaAbono(formatearDolares(pagado)) : undefined,
        };
      }
      return {
        titulo: s.cobrar(saldoTexto),
        ayuda: p.venceEn ? (p.venceEn > ahora ? t.vence(tiempoRestante(p.venceEn, ahora)) : t.venceVencido) : undefined,
      };
    case "pagado":
      return { titulo: s.pagado, ayuda: s.pagadoAyuda };
    case "preparando":
      if (envio?.modo === "paquetera") {
        return envio.listo ? { titulo: s.listo, ayuda: s.listoAyuda } : { titulo: s.preparando, ayuda: s.preparandoPaquetera };
      }
      return { titulo: s.preparando, ayuda: s.preparandoAyuda };
    case "enviado":
      return { titulo: s.enviado, ayuda: alEntregar ? s.enviadoContra(saldoTexto) : s.enviadoAyuda };
    case "entregado":
      return { titulo: s.entregado };
    case "cancelado":
      return { titulo: t.detalle.cancelado };
  }
}
