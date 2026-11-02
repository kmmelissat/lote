"use server";

import { redirect } from "next/navigation";
import { ACTIVIDADES, telefonoElSalvador } from "@/domain";
import { esFacebook, facebookDe } from "@/features/catalog/enlaces";
import { slugConSufijo, slugDe } from "@/lib/slug";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";
import {
  contextoDeNegocio,
  esCanal,
  esTrato,
  LIMITE_FRASE,
  LIMITE_NOMBRE_PERSONA,
  rubrosValidos,
  TRATO_POR_DEFECTO,
} from "../negocioNuevo";

export type EstadoCrear = {
  error?: string;
  nombre?: string;
  instagram?: string;
  facebook?: string;
};

const UNICO_VIOLADO = "23505";
const YA_TIENE_NEGOCIO = "ya_tiene_negocio";

const texto = (d: FormData, campo: string, max: number) => String(d.get(campo) ?? "").trim().slice(0, max);

/**
 * Crea el negocio con lo que se contó en el cuaderno. Solo el nombre es obligatorio: todo lo demás es opcional y, si alguna
 * parte secundaria falla (el contexto, una categoría, el teléfono), el negocio igual queda creado y se arregla en Ajustes.
 */
export async function crearNegocio(_anterior: EstadoCrear, formData: FormData): Promise<EstadoCrear> {
  const nombre = texto(formData, "nombre", 80);
  const instagram = texto(formData, "instagram", 40).replace(/^@/, "");
  const facebook = facebookDe(texto(formData, "facebook", 200));
  // Sin respuesta (o con una rara) se queda con lo de siempre
  const conVitrina = formData.get("vitrina") !== "no";
  const actividad = ACTIVIDADES.find((a) => a === formData.get("actividad")) ?? "compro_vendo";
  const canales = formData.getAll("canal").filter(esCanal);
  const enPersona = canales.includes("presencial");
  // El teléfono solo vale si marcó WhatsApp; si lo escribió mal, se le avisa en vez de guardar algo roto
  const crudoTelefono = canales.includes("whatsapp") ? texto(formData, "whatsapp", 20) : "";
  const telefono = crudoTelefono ? telefonoElSalvador(crudoTelefono) : null;
  const persona = texto(formData, "persona", LIMITE_NOMBRE_PERSONA);
  const trato = esTrato(formData.get("trato")) ? (formData.get("trato") as string) : TRATO_POR_DEFECTO;
  const rubros = rubrosValidos(formData.getAll("rubro"));
  const contexto = contextoDeNegocio(rubros, texto(formData, "frase", LIMITE_FRASE));

  const falla = (error: string): EstadoCrear => ({ error, nombre, instagram, facebook });
  if (!nombre) return falla(textos.crearNegocio.errorNombre);
  if (facebook && !esFacebook(facebook)) {
    // Con espacios es el nombre de la página, no su enlace: se le dice qué pegar
    return falla(/\s/.test(facebook) ? textos.crearNegocio.errorFacebookNombre : textos.crearNegocio.errorFacebook);
  }
  if (crudoTelefono && !telefono) return falla(textos.crearNegocio.errorWhatsapp);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const base = slugDe(nombre);
  for (const slug of [base, slugConSufijo(base, Math.random().toString(36).slice(2, 6))]) {
    const { data: negocioId, error } = await supabase.rpc("crear_negocio", {
      p_nombre: nombre,
      p_slug: slug,
      p_usuario_instagram: instagram || undefined,
    });
    if (!error) {
      // Lo demás se guarda aparte: si algo falla, el negocio ya existe y se cambia desde Ajustes
      const ajustes: Database["public"]["Tables"]["negocio"]["Update"] = {
        ...(!conVitrina ? { vitrina_activa: false } : {}),
        ...(actividad !== "compro_vendo" ? { actividad } : {}),
        ...(enPersona ? { tiene_local: true } : {}),
        ...(telefono ? { whatsapp: telefono } : {}),
      };
      if (Object.keys(ajustes).length) await supabase.from("negocio").update(ajustes).eq("id", negocioId);
      // Aparte: si la base todavía tiene el límite viejo de 600 letras (contexto_largo.sql) y es más largo, esto falla y no arrastra lo de arriba
      if (contexto) await supabase.from("negocio").update({ contexto_ia: contexto }).eq("id", negocioId);
      // Aparte: si todavía no se corrió facebook.sql no hay columna, y el negocio se crea igual
      if (facebook) await supabase.from("negocio").update({ usuario_facebook: facebook }).eq("id", negocioId);
      // Cómo se llama y cómo quiere que le hablen: es de la persona, no del negocio, y no lo ve nadie más
      await supabase.auth.updateUser({ data: { nombre_persona: persona || undefined, trato } });
      redirect("/inicio?bienvenida=1");
    }
    // Volvió atrás después de crear el suyo: no se crea otro, se lo lleva al que ya tiene.
    if (error.message === YA_TIENE_NEGOCIO) redirect("/inicio");
    // Si el enlace ya existe, se reintenta una vez con un sufijo; cualquier otro error se muestra.
    if (error.code !== UNICO_VIOLADO) break;
  }

  return falla(textos.crearNegocio.errorGeneral);
}
