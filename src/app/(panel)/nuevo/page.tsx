import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { Card } from "@/components/ui/Card";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.nuevo.titulo };

export default function NuevoPage() {
  return (
    <>
      <PageHeader titulo={textos.nuevo.titulo} descripcion={textos.nuevo.descripcion} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {textos.nuevo.opciones.map((o) => (
          <li key={o.id}>
            <Card className="font-medium">{o.etiqueta}</Card>
          </li>
        ))}
      </ul>
    </>
  );
}
