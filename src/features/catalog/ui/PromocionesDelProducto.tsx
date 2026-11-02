import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

const t = textos.promociones;

/** Las promociones que aplican a este producto, antes de comprarlo: "Llevá 2, pagá 1", "Pack a $12". Nada si no hay. */
export function PromocionesDelProducto({ anuncios }: { anuncios: { clave: string; titulo: string; detalle: string | null }[] }) {
  if (!anuncios.length) return null;
  return (
    <section aria-label={t.enPromocion} className="flex flex-col gap-2">
      {anuncios.map((a) => (
        <p key={a.clave} className="flex items-start gap-3 rounded-2xl border-2 border-teal-oscuro bg-limon px-4 py-3">
          <Icon nombre="etiqueta" className="mt-0.5 size-5 shrink-0" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-bold">{a.titulo}</span>
            {a.detalle && <span className="text-sm">{a.detalle}</span>}
          </span>
        </p>
      ))}
    </section>
  );
}
