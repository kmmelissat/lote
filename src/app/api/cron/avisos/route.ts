import { timingSafeEqual } from "node:crypto";
import { canalWhatsApp } from "@/features/whatsapp";
import { correrTareaDeAvisos } from "@/features/whatsapp/tarea";
import { borrarRutas, encontrarSueltas } from "@/lib/fotosSueltas";
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
    const supabase = createServiceClient();
    const resumen = await correrTareaDeAvisos({
      supabase,
      canal: canalWhatsApp(),
      ahora: new Date(),
    });
    // Las ofertas con fechas también se ponen al día acá (Vercel Hobby solo deja una tarea al día)
    const { data: ofertas } = await supabase.rpc("sincronizar_ofertas");
    // Y las fotos que ya nadie usa (subidas que nunca se guardaron, importaciones deshechas); lo de más de 24 h
    const fotosBorradas = await encontrarSueltas(supabase)
      .then(({ sueltas }) => borrarRutas(supabase, sueltas.map((a) => a.ruta)))
      .catch(() => 0);
    return Response.json({ ...resumen, ofertas: ofertas ?? 0, fotosBorradas });
  } catch {
    return Response.json({ error: "No se pudo procesar la cola" }, { status: 500 });
  }
}
