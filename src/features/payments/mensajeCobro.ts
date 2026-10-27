import type { Centavos } from "@/domain";
import { formatearDolares, tiempoRestante } from "@/lib/formato";
import { textos } from "@/lib/textos";

export type TipoMetodo = "transferencia" | "billetera" | "efectivo" | "contra_entrega";

export type DatosCobro = {
  negocio: string;
  cliente: string | null;
  items: { nombre: string; cantidad: number; precioFinal: Centavos }[];
  total: Centavos;
  saldo: Centavos;
  /** Solo los métodos activos, con los datos que ve quien paga */
  metodos: { tipo: TipoMetodo; datos: string | null }[];
  venceEn: Date | null;
  ahora: Date;
};

const t = textos.cobro;

/** Arma el mensaje de cobro listo para copiar o mandar por WhatsApp. Los montos vienen ya calculados. */
export function armarMensajeCobro(d: DatosCobro): string {
  const lineas = [t.saludo(d.cliente, d.negocio), ""];
  for (const i of d.items) {
    lineas.push(`- ${i.nombre} ×${i.cantidad}: ${formatearDolares(i.precioFinal * i.cantidad)}`);
  }
  lineas.push("", `${t.total}: ${formatearDolares(d.total)}`);
  if (d.saldo < d.total) {
    lineas.push(t.yaPagaste(formatearDolares(d.total - d.saldo)), `${t.saldo}: ${formatearDolares(d.saldo)}`);
  }

  if (d.metodos.length) {
    lineas.push("", t.pagarPor);
    for (const m of d.metodos) {
      lineas.push(m.datos ? `${t.metodos[m.tipo]}: ${m.datos}` : t.metodos[m.tipo]);
    }
  }

  if (d.venceEn && d.venceEn > d.ahora) {
    lineas.push("", t.plazo(tiempoRestante(d.venceEn, d.ahora)));
  }
  lineas.push("", t.gracias);
  return lineas.join("\n");
}
