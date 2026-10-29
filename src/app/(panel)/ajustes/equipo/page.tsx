import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { listarEquipo, listarInvitaciones } from "@/features/team/repositorio";
import { EquipoPanel } from "@/features/team/ui/EquipoPanel";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.equipo;

export const metadata: Metadata = { title: t.titulo };

export default function EquipoPage() {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} volver={{ href: "/ajustes", etiqueta: t.volver }} />
      <Contenido />
    </>
  );
}

async function Contenido() {
  const { supabase, negocio } = await negocioActual();
  // Solo la dueña maneja el equipo (tabla de permisos de app.md 4.10).
  if (negocio.rol !== "duena") notFound();

  const [miembros, invitaciones] = await Promise.all([
    listarEquipo(supabase, negocio.id),
    listarInvitaciones(supabase, negocio.id),
  ]);
  return <EquipoPanel miembros={miembros} invitaciones={invitaciones} yo={negocio.usuarioId} />;
}
