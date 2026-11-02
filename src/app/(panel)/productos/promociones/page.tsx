import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { hoyEnElSalvador } from "@/domain";
import { actualizarOfertas, ofertasDeTienda } from "@/features/offers/repositorio";
import { OfertasDeProductos } from "@/features/offers/ui/OfertasDeProductos";
import { listarProductos } from "@/features/products/repositorio";
import { estadoDePromocion } from "@/features/promotions/descripcion";
import { listarPromociones } from "@/features/promotions/repositorio";
import { FormPromocion } from "@/features/promotions/ui/FormPromocion";
import { ListaPromociones } from "@/features/promotions/ui/ListaPromociones";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.promociones;

export const metadata: Metadata = { title: t.titulo };

export default function PromocionesPage() {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} volver={{ href: "/productos", etiqueta: t.volver }} />
      <Pantalla />
    </>
  );
}

async function Pantalla() {
  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return <p className="text-texto-2">{t.errorPermiso}</p>;

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

  return (
    <div className="flex flex-col gap-8">
      <FormPromocion
        productos={productos.map((p) => ({
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
        }))}
      />
      <OfertasDeProductos
        ofertas={ofertas}
        productos={productos.map((p) => ({
          id: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          variante: p.variante,
          grupo: p.grupo,
          precio: p.precio,
          costo: p.costoUnitario ?? null,
          disponibles: p.disponibles,
          foto: p.fotos[0] ?? null,
          enPromocion: null,
        }))}
      />
      {promociones.length === 0 ? <EmptyState titulo={t.vacioTitulo} texto={t.vacioTexto} /> : <ListaPromociones promociones={promociones} />}
    </div>
  );
}
