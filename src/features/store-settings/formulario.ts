import { z } from "zod";
import { COLORES_MARCA, LIMITE_CONTEXTO } from "@/features/catalog/marca";
import { textos } from "@/lib/textos";

// Lo que llega del formulario de ajustes de la tienda. El orden de los campos es el orden en que se avisa el primer error.

const t = textos.ajustes.tienda;
const v = textos.ajustes.vitrina;

const texto = z.string().trim();
const entero = (min: number, max: number, mensaje: string) => z.coerce.number({ error: mensaje }).int(mensaje).min(min, mensaje).max(max, mensaje);

const esquema = z.object({
  nombre: texto.min(1, t.errorNombre).max(60, t.errorNombre),
  frase: texto.max(120, t.errorFrase),
  whatsapp: texto.refine((w) => {
    if (!w) return true;
    const digitos = w.replace(/\D/g, "").length;
    return /^\+?[\d\s-]+$/.test(w) && digitos >= 8 && digitos <= 15;
  }, t.errorWhatsapp),
  instagram: texto.transform((s) => s.replace(/^@/, "")).refine((s) => !s || /^[A-Za-z0-9._]{1,30}$/.test(s), t.errorInstagram),
  contexto: texto.max(LIMITE_CONTEXTO, t.errorContexto),
  plazo: entero(1, 168, v.errorPlazo),
  limite: entero(1, 20, v.errorLimite),
  umbral: entero(0, 50, v.errorUmbral),
  tiempo_entrega: texto.max(80, v.errorTiempoEntrega),
  politica_cambios: texto.max(300, v.errorPoliticaCambios),
  // La dirección de la vitrina (/c/<dirección>): la misma regla que la base, y nunca vacía
  slug: texto.transform((s) => s.toLowerCase()).refine((s) => /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(s), t.slug.errorFormato),
  color: texto.refine((c) => COLORES_MARCA.some((x) => x.hex === c), t.errorColor),
  logo: texto,
});

export type DatosTienda = z.output<typeof esquema> & {
  vitrina: boolean;
  apartar: boolean;
  explorar: boolean;
  local: boolean;
};

export function leerTienda(formData: FormData): { ok: true; datos: DatosTienda } | { ok: false; error: string } {
  const crudo = Object.fromEntries(Object.keys(esquema.shape).map((k) => [k, String(formData.get(k) ?? "")]));
  const r = esquema.safeParse(crudo);
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  const vitrina = formData.get("vitrina") === "on";
  return {
    ok: true,
    datos: {
      ...r.data,
      vitrina,
      apartar: formData.get("apartar") === "on",
      // Sin vitrina no se puede aparecer en Explorar
      explorar: vitrina && formData.get("explorar") === "on",
      local: formData.get("local") === "on",
    },
  };
}
