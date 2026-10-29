import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

const t = textos.vitrina.ficha;

/** Los detalles que cuenta la tienda (Material, Medidas…) y, si es usado, cómo está. Si no hay nada, no se muestra. */
export function FichaDelProducto({ detalles, estado, usado }: { detalles: { nombre: string; valor: string }[]; estado: string | null; usado: boolean }) {
  if (!detalles.length && !(usado && estado)) return null;
  return (
    <section aria-labelledby="ficha" className="flex flex-col gap-3">
      <h2 id="ficha" className="text-sm font-bold">
        {t.titulo}
      </h2>
      {usado && estado && (
        <p className="flex items-start gap-2 rounded-2xl bg-limon px-4 py-3 text-sm font-medium">
          <Icon nombre="info" className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="font-bold">{t.estado}:</span> {estado}
          </span>
        </p>
      )}
      {detalles.length > 0 && (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {detalles.map((d) => (
            <div key={d.nombre} className="flex flex-col border-b border-teal-oscuro/15 pb-1.5">
              <dt className="text-xs text-texto-2">{d.nombre}</dt>
              <dd className="font-medium">{d.valor}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
