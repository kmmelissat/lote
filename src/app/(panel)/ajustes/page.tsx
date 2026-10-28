import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/nav/PageHeader";
import { Card } from "@/components/ui/Card";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

export const metadata: Metadata = { title: textos.ajustes.titulo };

export default async function Page() {
  const { negocio } = await negocioActual();
  return (
    <>
      <PageHeader titulo={textos.ajustes.titulo} descripcion={textos.ajustes.descripcion} />
      <ul className="grid gap-3 md:grid-cols-2">
        {negocio.rol === "duena" && (
          <li>
            <Link href="/ajustes/tienda" className="block">
              <Card className="flex flex-col gap-1 hover:bg-teal-fondo">
                <span className="font-medium">{textos.ajustes.tienda.enlace}</span>
                <span className="text-sm text-texto-2">{textos.ajustes.tienda.enlaceTexto}</span>
              </Card>
            </Link>
          </li>
        )}
        <li>
          <Link href="/ajustes/vitrina" className="block">
            <Card className="flex flex-col gap-1 hover:bg-teal-fondo">
              <span className="font-medium">{textos.ajustes.vitrina.enlace}</span>
              <span className="text-sm text-texto-2">{textos.ajustes.vitrina.enlaceTexto}</span>
            </Card>
          </Link>
        </li>
        <li>
          <Link href="/ajustes/envios" className="block">
            <Card className="flex flex-col gap-1 hover:bg-teal-fondo">
              <span className="font-medium">{textos.ajustes.envios.enlace}</span>
              <span className="text-sm text-texto-2">{textos.ajustes.envios.enlaceTexto}</span>
            </Card>
          </Link>
        </li>
        <li>
          <Link href="/ajustes/pagos" className="block">
            <Card className="flex flex-col gap-1 hover:bg-teal-fondo">
              <span className="font-medium">{textos.ajustes.pagos.enlace}</span>
              <span className="text-sm text-texto-2">{textos.ajustes.pagos.enlaceTexto}</span>
            </Card>
          </Link>
        </li>
        <li>
          <Link href="/ajustes/exportar" className="block">
            <Card className="flex flex-col gap-1 hover:bg-teal-fondo">
              <span className="font-medium">{textos.exportar.enlace}</span>
              <span className="text-sm text-texto-2">{textos.exportar.enlaceTexto}</span>
            </Card>
          </Link>
        </li>
        {negocio.rol === "duena" && (
          <li>
            <Link href="/ajustes/equipo" className="block">
              <Card className="flex flex-col gap-1 hover:bg-teal-fondo">
                <span className="font-medium">{textos.equipo.enlace}</span>
                <span className="text-sm text-texto-2">{textos.equipo.enlaceTexto}</span>
              </Card>
            </Link>
          </li>
        )}
        <li>
          <Link href="/ajustes/ayuda" className="block">
            <Card className="flex flex-col gap-1 hover:bg-teal-fondo">
              <span className="font-medium">{textos.ayuda.enlace}</span>
              <span className="text-sm text-texto-2">{textos.ayuda.enlaceTexto}</span>
            </Card>
          </Link>
        </li>
      </ul>
    </>
  );
}
