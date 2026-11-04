import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { hoyEnElSalvador } from "@/domain";
import { actualizarOfertas, ofertasDeTienda } from "@/features/offers/repositorio";
import { NuevaOferta } from "@/features/offers/ui/NuevaOferta";
import { listarProductos } from "@/features/products/repositorio";
import { estadoDePromocion } from "@/features/promotions/descripcion";
import { listarPromociones } from "@/features/promotions/repositorio";
import { NuevaPromocion, type TipoNueva } from "@/features/promotions/ui/NuevaPromocion";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.promociones;

export const metadata: Metadata = { title: t.nueva };

const TIPOS: TipoNueva[] = ["pack", "llevas_pagas", "oferta"];

export default function NuevaPromocionPage({ searchParams }: PageProps<"/productos/promociones/nueva">) {
  return (
    <>
      <PageHeader titulo={t.nueva} descripcion={t.nuevaDescripcion} volver={{ href: "/productos/promociones", etiqueta: t.volverLista }} />
      <Formulario searchParams={searchParams} />
    </>
  );
}

async function Formulario({ searchParams }: Pick<PageProps<"/productos/promociones/nueva">, "searchParams">) {
  const pedido = (await searchParams).tipo;
  const tipoInicial = TIPOS.find((x) => x === pedido) ?? "pack";
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) notFound();

  // Antes de leer, para que las ofertas que ya empezaron o terminaron se vean como están
  await actualizarOfertas(supabase, negocio.id).catch(() => undefined);
  // Con costos (solo los ve quien gestiona): así el formulario dice cuánto le queda a la tienda con cada promoción
  const [promociones, productos, ofertas] = await Promise.all([
    listarPromociones(supabase, negocio.id),
    listarProductos(supabase, negocio.id, true),
    ofertasDeTienda(supabase, negocio.id),
  ]);

  // En qué promoción (encendida y todavía vigente o por empezar) ya está cada producto, para avisar de los cruces
  const hoy = hoyEnElSalvador(new Date());
  const enPromocion = new Map<number, string>();
  for (const p of promociones) {
    const estado = estadoDePromocion(p, hoy);
    if (estado !== "vigente" && estado !== "programada") continue;
    for (const x of p.productos) if (!enPromocion.has(x.codigo)) enPromocion.set(x.codigo, p.nombre);
  }

  const opciones = productos.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    variante: p.variante,
    grupo: p.grupo,
    precio: p.precio,
    costo: p.costoUnitario ?? null,
    disponibles: p.disponibles,
    foto: p.fotos[0] ?? null,
    enPromocion: enPromocion.get(p.codigo) ?? null,
  }));

  return (
    <NuevaPromocion
      tipoInicial={tipoInicial}
      productos={opciones}
      // Llega al cliente ya armado y React lo valida como hijo de una lista: sin key avisa en la consola
      oferta={<NuevaOferta key="oferta" productos={opciones} ofertas={ofertas} alTerminar="/productos/promociones" />}
    />
  );
}
