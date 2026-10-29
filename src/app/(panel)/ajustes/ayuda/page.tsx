import type { Metadata } from "next";
import { PageHeader } from "@/components/nav/PageHeader";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";

const t = textos.ayuda;

export const metadata: Metadata = { title: t.titulo };

export default function AyudaPage() {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} volver={{ href: "/ajustes", etiqueta: t.volver }} />
      <ul className="flex max-w-2xl flex-col gap-3">
        {t.preguntas.map((p) => (
          <li key={p.pregunta}>
            {/* <details> ya se abre con teclado y lo leen los lectores de pantalla */}
            <Card className="p-0">
              <details className="group">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-medium [&::-webkit-details-marker]:hidden">
                  {p.pregunta}
                  <Icon nombre="flecha" className="size-5 shrink-0 text-texto-2 transition-transform duration-150 group-open:rotate-180" />
                </summary>
                <p className="px-4 pb-4 text-texto-2">{p.respuesta}</p>
              </details>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
