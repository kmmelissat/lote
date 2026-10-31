import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

/** En Inicio: reseñas de clientes que esperan que las publiques. Solo aparece si hay alguna. */
export function AvisoResenas({ pendientes }: { pendientes: number }) {
  if (pendientes <= 0) return null;
  return (
    <Link
      href="/ajustes/resenas"
      className="flex items-center gap-3 rounded-[24px] border-2 border-teal-oscuro bg-superficie px-4 py-3 font-bold text-teal-oscuro transition-colors hover:bg-teal-fondo"
    >
      <Icon nombre="estrella" className="size-5 shrink-0" />
      <span className="flex-1">{textos.resenas.pendientes(pendientes)}</span>
      <Icon nombre="diagonal" className="size-5 shrink-0" />
    </Link>
  );
}
