import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { formatearHora } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.mostrador;

export function ChipCaja({ cajaDesde }: { cajaDesde: string | null }) {
  return (
    <Link
      href="/mostrador/caja"
      className={`flex min-h-11 items-center gap-2 self-start rounded-full border-2 border-teal-oscuro px-4 text-sm font-medium ${cajaDesde ? "bg-teal-fondo" : "bg-limon"}`}
    >
      <Icon nombre={cajaDesde ? "efectivo" : "alerta"} className="size-4" />
      {cajaDesde
        ? t.caja.abierta(formatearHora(new Date(cajaDesde)))
        : t.caja.cerradaCorto}
      <span className="font-bold underline underline-offset-2">
        {cajaDesde ? t.caja.ver : t.caja.abrir}
      </span>
    </Link>
  );
}
