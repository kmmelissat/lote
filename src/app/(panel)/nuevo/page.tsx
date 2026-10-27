import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.nuevo.titulo };

export default function NuevoPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{textos.nuevo.titulo}</h1>
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
