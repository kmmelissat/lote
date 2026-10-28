import { esTipoExportacion, exportar } from "@/features/export/exportar";
import { negocioActual } from "@/lib/negocio";

// Descarga un tema del negocio como CSV. Los datos son privados y llevan costos: solo dueña y administradora.
export async function GET(_request: Request, { params }: RouteContext<"/api/exportar/[tipo]">) {
  const { tipo } = await params;
  if (!esTipoExportacion(tipo)) return new Response("No existe", { status: 404 });

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return new Response("Sin permiso", { status: 403 });

  const csv = await exportar(supabase, negocio.id, tipo);
  const dia = new Date().toLocaleDateString("sv-SE", { timeZone: "America/El_Salvador" });
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lote-${tipo}-${dia}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
