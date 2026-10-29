import { createHmac } from "node:crypto";
import { headers } from "next/headers";

// Del dispositivo solo se guarda un hash del IP (con una clave propia), para limitar los intentos.
export async function huellaDelDispositivo(): Promise<string> {
  const secreto = process.env.HUELLA_SECRETO;
  // Sin clave propia el hash del IP sería predecible: en producción es un error de configuración, no un valor por defecto.
  if (!secreto && process.env.NODE_ENV === "production") throw new Error("Falta HUELLA_SECRETO");
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "sin-ip";
  return createHmac("sha256", secreto ?? "lote").update(ip).digest("hex").slice(0, 32);
}

/** El WhatsApp se escribe sin el +503; acá se le pone. Si viene un contacto completo (de otra pantalla), se respeta. */
export function contactoDe(formData: FormData): string {
  const telefono = String(formData.get("telefono") ?? "").replace(/[^\d]/g, "");
  if (telefono) return `+503 ${telefono}`;
  return String(formData.get("contacto") ?? "").trim();
}
