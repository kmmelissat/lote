import { timingSafeEqual } from "node:crypto";
import { crearColaSupabase } from "@/features/whatsapp/cola";
import { enviarAvisosPendientes } from "@/features/whatsapp/enviarCola";
import { canalWhatsApp } from "@/features/whatsapp";
import { createServiceClient } from "@/lib/supabase/servicio";

// Lo llama Vercel Cron (ver vercel.json) con "Authorization: Bearer <CRON_SECRET>". Sin sesión de nadie:
// el secreto es la única puerta, y esta ruta es pública en proxy.ts por eso.
function autorizado(request: Request): boolean {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return false;
  const recibido = Buffer.from(request.headers.get("authorization") ?? "");
  const esperado = Buffer.from(`Bearer ${secreto}`);
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
}

export async function GET(request: Request) {
  if (!autorizado(request)) return new Response("No autorizado", { status: 401 });

  try {
    const resumen = await enviarAvisosPendientes({
      cola: crearColaSupabase(createServiceClient()),
      canal: canalWhatsApp(),
      ahora: new Date(),
    });
    return Response.json(resumen);
  } catch {
    return Response.json({ error: "No se pudo procesar la cola" }, { status: 500 });
  }
}
