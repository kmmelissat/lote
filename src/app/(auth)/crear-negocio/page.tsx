import type { Metadata } from "next";
import { textos } from "@/lib/textos";
import { CrearNegocioForm } from "@/features/auth/ui/CrearNegocioForm";

export const metadata: Metadata = { title: textos.crearNegocio.titulo };

export default function CrearNegocioPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{textos.crearNegocio.titulo}</h1>
        <p className="text-texto-2">{textos.crearNegocio.descripcion}</p>
      </div>
      <CrearNegocioForm />
    </>
  );
}
