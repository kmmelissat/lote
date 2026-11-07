import { Icon, type NombreIcono } from "@/components/ui/Icon";

/** Una opción para elegir con borde y icono (cómo se recibe, cómo se paga). Es un radio de verdad, solo que escondido. */
export function OpcionRadio({
  nombre,
  valor,
  marcada,
  onElegir,
  icono,
  titulo,
  ayuda,
  derecha,
}: {
  nombre: string;
  valor: string;
  marcada: boolean;
  onElegir: () => void;
  icono: NombreIcono;
  titulo: string;
  ayuda?: string;
  derecha?: string;
}) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name={nombre} value={valor} checked={marcada} onChange={onElegir} className="peer sr-only" />
      <span className="flex items-center gap-3 rounded-2xl border border-teal-oscuro/25 bg-white p-3 transition-colors peer-checked:border-(--store-accent) peer-checked:bg-(--store-soft) peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--store-accent)">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-teal-oscuro/30 bg-superficie">
          <Icon nombre={icono} className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-bold">{titulo}</span>
          {ayuda && <span className="text-sm text-texto-2">{ayuda}</span>}
        </span>
        {derecha && <span className="shrink-0 text-sm font-bold">{derecha}</span>}
      </span>
    </label>
  );
}
