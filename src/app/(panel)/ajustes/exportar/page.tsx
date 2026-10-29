import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { Card } from "@/components/ui/Card";
import { TIPOS_EXPORTACION } from "@/features/export/exportar";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.exportar;

export const metadata: Metadata = { title: t.titulo };

export default function ExportarPage() {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} volver={{ href: "/ajustes", etiqueta: t.volver }} />
      <Lista />
    </>
  );
}

async function Lista() {
  const { negocio } = await negocioActual();
  if (!negocio.puedeGestionar) notFound();

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {TIPOS_EXPORTACION.map((tipo) => (
          <li key={tipo}>
            {/* Un enlace normal (no <Link>): es una descarga, no una navegación de la app */}
            <a href={`/api/exportar/${tipo}`} download className="block">
              <Card className="flex flex-col gap-1 hover:bg-teal-fondo">
                <span className="font-medium">{t.temas[tipo].titulo}</span>
                <span className="text-sm text-texto-2">{t.temas[tipo].texto}</span>
              </Card>
            </a>
          </li>
        ))}
      </ul>
      <p className="text-sm text-texto-2">{t.ayuda}</p>
    </div>
  );
}
