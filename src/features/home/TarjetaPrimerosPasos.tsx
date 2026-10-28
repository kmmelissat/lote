import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import type { PasoInicial } from "./primerosPasos";

const t = textos.inicio.primerosPasos;

const enlaces: Record<PasoInicial["clave"], string> = {
  producto: "/nuevo",
  pago: "/ajustes/pagos",
  pedido: "/pedidos/nuevo",
};

export function TarjetaPrimerosPasos({ pasos }: { pasos: PasoInicial[] }) {
  const hechos = pasos.filter((p) => p.hecho).length;
  return (
    <section aria-labelledby="primeros-pasos" className="flex flex-col gap-2">
      <h2 id="primeros-pasos" className="font-bold">
        {t.titulo}
        <span className="ml-2 text-sm font-normal text-texto-2">{t.avance(hechos, pasos.length)}</span>
      </h2>
      <Card className="border border-borde">
        <ol className="flex flex-col gap-1">
          {pasos.map((p) => (
            <li key={p.clave}>
              <Link href={enlaces[p.clave]} className="flex min-h-11 items-center gap-3 rounded-xl px-1 hover:bg-teal-fondo">
                <span
                  aria-hidden="true"
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                    p.hecho ? "bg-teal text-white" : "border border-borde-control"
                  }`}
                >
                  {p.hecho && <Icon nombre="check" className="size-4" />}
                </span>
                <span className="flex flex-col">
                  <span className={p.hecho ? "text-texto-2 line-through" : "font-medium"}>
                    {t.pasos[p.clave].titulo}
                    {p.hecho && <span className="sr-only"> ({t.listo})</span>}
                  </span>
                  {!p.hecho && <span className="text-sm text-texto-2">{t.pasos[p.clave].texto}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  );
}
