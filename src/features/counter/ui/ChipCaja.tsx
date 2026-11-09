import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { formatearHora } from "@/lib/formato";
import { textos } from "@/lib/textos";

const t = textos.mostrador;

export function ChipCaja({ cajaDesde }: { cajaDesde: string | null }) {
  return (
    <Link
      href="/vender/caja"
      className={`flex min-h-10 items-center gap-2 self-start rounded-xl border px-3.5 text-sm font-medium ${cajaDesde ? "border-linea bg-gris-50" : "border-transparent bg-chip-amarillo text-chip-texto-amarillo"}`}
    >
      <Icon nombre={cajaDesde ? "efectivo" : "alerta"} className="size-4" />
      {cajaDesde
        ? t.caja.abierta(formatearHora(new Date(cajaDesde)))
        : t.caja.cerradaCorto}
      <span className="font-semibold underline underline-offset-2">
        {cajaDesde ? t.caja.ver : t.caja.abrir}
      </span>
    </Link>
  );
}
