import { fotosDelGrupo } from "@/features/products/fotosVariantes";
import { textos } from "@/lib/textos";
import { agruparParaVitrina, DIAS_NUEVO, type TarjetaVitrina } from "./agruparVitrina";
import { partesDe } from "./opciones";
import type { ProductoPublico } from "./repositorio";
import type { VarianteCompra } from "./ui/ZonaDeCompra";

export type FichaPublica = {
  /** Las variantes hermanas con unidades o apartadas, de menor a mayor código; vacío si el producto no tiene variantes */
  hermanas: ProductoPublico[];
  /** Lo que se elige al comprar: las hermanas, o el producto solo */
  variantes: VarianteCompra[];
  /** El producto entero: sus variantes juntas, o él solo */
  familia: ProductoPublico[];
  galeria: { fotos: string[]; de: Record<string, string> };
  disponibles: number;
  vendidas: number;
  nuevo: boolean;
  /** El sello de la foto: lo que se rebaja la variante más barata (la que se ve en la vitrina) */
  sello: string | undefined;
  /** "Ropa · Marca · Nuevo" */
  meta: string;
  /** Más de la tienda: primero lo de la misma categoría, después lo demás, sin repetir este producto ni sus variantes */
  parecidos: TarjetaVitrina[];
  masDe: TarjetaVitrina[];
};

/** Lo que muestra la página pública de un producto, armado con todo lo que la tienda tiene a la vista. */
export function armarFichaPublica(p: ProductoPublico, todos: readonly ProductoPublico[], ahora: Date): FichaPublica {
  const hermanas = p.grupo ? todos.filter((o) => o.grupo === p.grupo && o.variante) : [];
  // El producto de esta página siempre cuenta, aunque ya no tenga unidades
  if (p.grupo && !hermanas.some((o) => o.codigo === p.codigo)) hermanas.push(p);
  hermanas.sort((a, b) => a.codigo - b.codigo);

  const variantes: VarianteCompra[] = p.grupo
    ? hermanas.map((o) => ({ codigo: o.codigo, partes: partesDe(o.variante), disponibles: o.disponibles, precio: o.precio, precioAnterior: o.precioAnterior, fotos: o.fotos }))
    : [{ codigo: p.codigo, partes: [], disponibles: p.disponibles, precio: p.precio, precioAnterior: p.precioAnterior, fotos: [] }];

  const familia = hermanas.length ? hermanas : [p];
  const creado = familia.map((o) => o.creadoEn?.getTime() ?? 0).reduce((a, b) => Math.max(a, b), 0);
  const masBarata = familia.reduce((m, o) => (o.precio < m.precio ? o : m), familia[0]);
  const sello =
    masBarata.precioAnterior !== null && masBarata.precioAnterior > masBarata.precio
      ? textos.vitrina.etiquetas.oferta(Math.round((1 - masBarata.precio / masBarata.precioAnterior) * 100))
      : undefined;

  const otros = agruparParaVitrina(todos.filter((o) => (p.grupo ? o.grupo !== p.grupo : o.codigo !== p.codigo)));
  const parecidos = p.categoria ? otros.filter((o) => o.categoria === p.categoria).slice(0, 4) : [];

  return {
    hermanas,
    variantes,
    familia,
    galeria: hermanas.length ? fotosDelGrupo(hermanas) : { fotos: p.fotos, de: {} },
    disponibles: familia.reduce((n, o) => n + o.disponibles, 0),
    vendidas: familia.reduce((n, o) => n + o.vendidas, 0),
    nuevo: creado > 0 && ahora.getTime() - creado < DIAS_NUEVO * 86_400_000,
    sello,
    meta: [p.categoria, p.marca, p.condicion === "usado" ? textos.productos.form.usado : textos.productos.form.nuevo].filter(Boolean).join(" · "),
    parecidos,
    masDe: otros.filter((o) => !parecidos.includes(o)).slice(0, 4),
  };
}
