import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Ctx, Respuesta } from "../tipos";
import { registrar, textoDeError } from "../ayudas";

const t = textos.asistente;

export async function registrarGasto({ d, entrada, intencion, salida }: Ctx<"gasto">): Promise<Respuesta> {
  return registrar(d, entrada, intencion, salida, async () => {
    const r = await d.puerto.registrarGasto({
      categoria: intencion.categoria,
      monto: intencion.monto,
      nota: intencion.nota,
    });
    if (!r.ok) return { respuesta: { texto: textoDeError(r.error) } };
    const monto = formatearDolares(intencion.monto);
    return {
      respuesta: { texto: t.gastoRegistrado(monto, t.categoriaGasto[intencion.categoria], intencion.nota) },
      inverso: { tipo: "gasto", gasto_id: r.valor.id },
      descripcion: t.descGasto(monto, intencion.nota ?? t.categoriaGasto[intencion.categoria]),
    };
  });
}
