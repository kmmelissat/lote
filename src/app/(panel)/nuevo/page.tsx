import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/nav/PageHeader";
import { Card } from "@/components/ui/Card";
import { textos } from "@/lib/textos";

const RUTAS: Record<string, string> = {
  producto: "/productos/nuevo",
  lote: "/productos/lote",
  venta: "/pedidos/nuevo",
  asistente: "/asistente",
  chat: "/pegar-chat",
};

export const metadata: Metadata = { title: textos.nuevo.titulo };

export default function NuevoPage() {
  return (
    <>
      <PageHeader titulo={textos.nuevo.titulo} descripcion={textos.nuevo.descripcion} />
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {textos.nuevo.opciones.map((o) => (
          <li key={o.id}>
            {o.id in RUTAS ? (
              <Link href={RUTAS[o.id]} className="block">
                <Card className="font-medium hover:bg-teal-fondo">{o.etiqueta}</Card>
              </Link>
            ) : (
              <Card className="font-medium">{o.etiqueta}</Card>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
