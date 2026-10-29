import { textos } from "@/lib/textos";

const t = textos.vitrina.etiquetas;

/** Un producto se marca "Nuevo" durante estos días desde que se creó */
export const DIAS_NUEVO = 14;
const MIN_VENDIDAS = 5;

/** Las etiquetas de un vistazo: "Nuevo", "Últimas unidades" y cuántas se vendieron. Solo salen las que aplican. */
export function Etiquetas({ disponibles, umbral, vendidas, nuevo }: { disponibles: number; umbral: number; vendidas: number; nuevo: boolean }) {
  const ultimas = disponibles > 0 && disponibles <= umbral;
  const etiquetas = [
    nuevo ? { texto: t.nuevo, fondo: "bg-rosa-palido" } : null,
    ultimas ? { texto: disponibles === 1 ? t.ultima : t.ultimas, fondo: "bg-limon" } : null,
    vendidas >= MIN_VENDIDAS ? { texto: t.vendidas(vendidas), fondo: "bg-teal-fondo" } : null,
  ].filter((e) => e !== null);
  if (!etiquetas.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {etiquetas.map((e) => (
        <li key={e.texto} className={`rounded-full border-2 border-teal-oscuro px-3 py-0.5 text-xs font-bold ${e.fondo}`}>
          {e.texto}
        </li>
      ))}
    </ul>
  );
}
