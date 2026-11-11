import { Icon } from "@/components/ui/Icon";

/** Lo urgente del producto en una franja amarilla: quién espera que vuelva, cuántas unidades están apartadas. No sale si no hay nada. */
export function FranjaProducto({ avisos }: { avisos: string[] }) {
  if (!avisos.length) return null;
  return (
    <section className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl bg-chip-amarillo px-4 py-3 text-sm font-medium text-chip-texto-amarillo ring-1 ring-inset ring-teal-oscuro/10">
      <Icon nombre="campana" className="size-4 shrink-0" />
      {avisos.map((a) => (
        <p key={a}>{a}</p>
      ))}
    </section>
  );
}
