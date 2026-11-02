import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Centavos } from "@/domain";
import { diasEntre } from "@/lib/calendario";

const t = textos.promociones;

/** Lo que ofrece una promoción en una frase corta: "A $12.00 el pack" o "Llevá 2 y pagá 1". */
export function resumenDePromocion(p: { tipo: "pack" | "llevas_pagas"; precioPack: Centavos | null; lleva: number | null; paga: number | null }): string {
  if (p.tipo === "pack") return t.resumenPack(formatearDolares(p.precioPack ?? 0));
  return t.resumenLlevasPagas(p.lleva ?? 0, p.paga ?? 0);
}

/** El nombre que lleva una promoción si la persona no escribe uno. */
export function nombrePorDefecto(tipo: "pack" | "llevas_pagas", lleva: number, paga: number): string {
  return tipo === "pack" ? t.nombrePack : t.nombreLlevasPagas(lleva, paga);
}

/** Dónde está una promoción según sus fechas y si está encendida (las fechas son "AAAA-MM-DD"). */
export function estadoDePromocion(p: { activa: boolean; desde: string | null; hasta: string | null }, hoy: string): "apagada" | "programada" | "vencida" | "vigente" {
  if (!p.activa) return "apagada";
  if (p.desde && hoy < p.desde) return "programada";
  if (p.hasta && hoy > p.hasta) return "vencida";
  return "vigente";
}

/**
 * Cómo se anuncia una promoción en la vitrina: un título corto y, si hace falta, con qué se junta. `nombreDe` da el nombre
 * de un producto por su código (sin el de variante); un producto que ya no se muestra se deja afuera.
 */
export function anuncioDePromocion(
  p: { tipo: "pack" | "llevas_pagas"; precioPack: Centavos | null; lleva: number | null; paga: number | null; productos: { codigo: number; cantidad: number }[] },
  nombreDe: (codigo: number) => string | undefined,
): { titulo: string; detalle: string | null } {
  const nombres = p.productos.flatMap((x) => {
    const nombre = nombreDe(x.codigo);
    return nombre ? [t.cantidadDe(p.tipo === "pack" ? x.cantidad : 1, nombre)] : [];
  });
  // En "llevá y pagá" los productos suelen ser variantes de uno mismo: se nombra una vez
  const unicos = [...new Set(nombres)];
  if (p.tipo === "pack") {
    return { titulo: t.etiquetaPack(formatearDolares(p.precioPack ?? 0)), detalle: unicos.length ? t.enPack(unicos.join(", ")) : null };
  }
  return { titulo: t.etiquetaLlevasPagas(p.lleva ?? 0, p.paga ?? 0), detalle: unicos.length > 1 ? t.valeParaTodos(unicos.join(", ")) : null };
}

function cuando(dias: number): string {
  if (dias <= 0) return t.cuandoHoy;
  return dias === 1 ? t.cuandoManana : t.cuandoEnDias(dias);
}

/** El estado de una promoción dicho con todas sus letras: "Programada · empieza en 6 días", "Activa · termina mañana". */
export function textoDeEstado(
  p: { activa: boolean; desde: string | null; hasta: string | null },
  hoy: string,
): { estado: "apagada" | "programada" | "vencida" | "vigente"; texto: string } {
  const estado = estadoDePromocion(p, hoy);
  if (estado === "apagada") return { estado, texto: t.estadoApagada };
  if (estado === "vencida") return { estado, texto: t.estadoVencida };
  if (estado === "programada") return { estado, texto: t.estadoProgramada(cuando(diasEntre(hoy, p.desde as string))) };
  return { estado, texto: p.hasta ? t.estadoVigenteHasta(cuando(diasEntre(hoy, p.hasta))) : t.estadoVigente };
}
