import { textos } from "@/lib/textos";

const t = textos.vitrina.etiquetas;

const MIN_VENDIDAS = 5;

/** Las etiquetas de un vistazo: "Nuevo", "Últimas unidades" y cuántas se vendieron. Solo salen las que aplican. */
export function Etiquetas({ disponibles, umbral, vendidas, nuevo }: { disponibles: number; umbral: number; vendidas: number; nuevo: boolean }) {
  // Con una sola unidad, la caja de compra ya dice "Queda 1"
  const ultimas = disponibles > 1 && disponibles <= umbral;
  const etiquetas = [
    nuevo ? { texto: t.nuevo, fondo: "bg-(--store-soft) text-(--store-on-soft)" } : null,
    ultimas ? { texto: disponibles === 1 ? t.ultima : t.ultimas, fondo: "bg-(--store-soft) text-(--store-on-soft)" } : null,
    vendidas >= MIN_VENDIDAS ? { texto: t.vendidas(vendidas), fondo: "bg-(--store-soft) text-(--store-on-soft)" } : null,
  ].filter((e) => e !== null);
  if (!etiquetas.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {etiquetas.map((e) => (
        <li key={e.texto} className={`rounded-full border border-teal-oscuro/30 px-3 py-0.5 text-xs font-bold ${e.fondo}`}>
          {e.texto}
        </li>
      ))}
    </ul>
  );
}
