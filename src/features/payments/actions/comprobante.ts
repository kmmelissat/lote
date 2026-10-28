"use server";

import { aCentavos, compararComprobante, type VeredictoComprobante } from "@/domain";
import { proveedorIA } from "@/features/ai";
import { saldoDelPedido } from "@/features/orders/repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.pedidos.cobrar.comprobante;

// Una captura de pantalla ya comprimida: JPEG, PNG o WebP en base64. Nada más se acepta.
const IMAGEN = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const MAXIMO_CARACTERES = 2_800_000;

export type ResultadoComprobante =
  | {
      ok: true;
      /** centavos; null si no se pudo leer */
      monto: number | null;
      fecha: string | null;
      referencia: string | null;
      saldo: number;
      veredicto: VeredictoComprobante;
    }
  | { ok: false; error: string };

/**
 * Lee un comprobante de pago con la IA y lo compara con el saldo del pedido. Solo propone: no registra
 * nada, la persona revisa y confirma con el botón de siempre. La imagen no se guarda en ningún lado.
 */
export async function leerComprobante(pedidoId: string, imagen: string): Promise<ResultadoComprobante> {
  if (imagen.length > MAXIMO_CARACTERES || !IMAGEN.test(imagen)) return { ok: false, error: t.errorImagen };

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeVender) return { ok: false, error: textos.pedidos.cobrar.errorPermiso };

  const saldo = await saldoDelPedido(supabase, pedidoId);
  if (saldo === null) return { ok: false, error: t.errorGeneral };

  const ia = proveedorIA();
  if (!ia) return { ok: false, error: t.sinIA };

  try {
    const lectura = await ia.leerComprobante(imagen);
    if (!lectura.esComprobante) return { ok: false, error: t.noEsComprobante };
    const monto = lectura.monto === null || !(lectura.monto > 0) ? null : aCentavos(lectura.monto);
    return {
      ok: true,
      monto,
      fecha: lectura.fecha,
      referencia: lectura.referencia,
      saldo,
      veredicto: compararComprobante(monto, saldo),
    };
  } catch {
    return { ok: false, error: t.errorGeneral };
  }
}
