import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { nombreBase, type Centavos } from "@/domain";
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

export type AnuncioPromocion = {
  clave: string;
  titulo: string;
  detalle: string | null;
  /** Lo que cuesta sin la promoción y con ella; null si no se puede decir (productos de distinto precio en "llevá y pagá") */
  precios: { antes: string; ahora: string; ahorro: string } | null;
  fotos: string[];
};

type PromocionPublicaLista = Parameters<typeof anuncioDePromocion>[0] & { id: string };
type ProductoDeLista = { codigo: number; nombre: string; variante: string | null; precio: Centavos; fotos: string[] };

/** Las promociones de la vitrina listas para pintar: título, qué cubren, fotos y el precio de antes frente al de ahora. */
export function anunciosDePromociones(promociones: PromocionPublicaLista[], productos: ProductoDeLista[]): AnuncioPromocion[] {
  const porCodigo = new Map(productos.map((p) => [p.codigo, p]));
  return promociones.map((pr) => {
    const nombreDe = (c: number) => {
      const o = porCodigo.get(c);
      return o ? nombreBase(o.nombre, o.variante) : undefined;
    };
    const cubiertos = pr.productos.flatMap((x) => {
      const o = porCodigo.get(x.codigo);
      return o ? [{ ...x, precio: o.precio, foto: o.fotos[0] }] : [];
    });
    let antes: number | null = null;
    let ahora: number | null = null;
    if (pr.tipo === "pack" && pr.precioPack !== null) {
      antes = cubiertos.reduce((suma, x) => suma + x.precio * x.cantidad, 0);
      ahora = pr.precioPack;
    } else if (pr.tipo === "llevas_pagas" && pr.lleva && pr.paga && cubiertos.length && cubiertos.every((x) => x.precio === cubiertos[0].precio)) {
      antes = pr.lleva * cubiertos[0].precio;
      ahora = pr.paga * cubiertos[0].precio;
    }
    const fotos = [...new Set(cubiertos.flatMap((x) => (x.foto ? [x.foto] : [])))].slice(0, 3);
    return {
      clave: pr.id,
      ...anuncioDePromocion(pr, nombreDe),
      precios:
        antes !== null && ahora !== null && antes > ahora
          ? { antes: formatearDolares(antes), ahora: formatearDolares(ahora), ahorro: formatearDolares(antes - ahora) }
          : null,
      fotos,
    };
  });
}
