"use server";

import { redirect } from "next/navigation";
import { esFacebook, facebookDe } from "@/features/catalog/enlaces";
import { slugConSufijo, slugDe } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

export type EstadoCrear = {
  error?: string;
  nombre?: string;
  instagram?: string;
  facebook?: string;
};

const UNICO_VIOLADO = "23505";
const YA_TIENE_NEGOCIO = "ya_tiene_negocio";

export async function crearNegocio(
  _anterior: EstadoCrear,
  formData: FormData,
): Promise<EstadoCrear> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const instagram = String(formData.get("instagram") ?? "")
    .trim()
    .replace(/^@/, "");

  const facebook = facebookDe(String(formData.get("facebook") ?? "").trim());
  // Sin respuesta (o con una rara) se queda con la vitrina, que es como nace todo negocio
  const conVitrina = formData.get("vitrina") !== "no";

  if (!nombre)
    return {
      error: textos.crearNegocio.errorNombre,
      nombre,
      instagram,
      facebook,
    };
  if (facebook && !esFacebook(facebook))
    return {
      error: textos.crearNegocio.errorFacebook,
      nombre,
      instagram,
      facebook,
    };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const base = slugDe(nombre);
  for (const slug of [
    base,
    slugConSufijo(base, Math.random().toString(36).slice(2, 6)),
  ]) {
    const { data: negocioId, error } = await supabase.rpc("crear_negocio", {
      p_nombre: nombre,
      p_slug: slug,
      p_usuario_instagram: instagram || undefined,
    });
    if (!error) {
      // Si no la quiere, se apaga ya: si esto falla queda prendida y se cambia desde Ajustes
      if (!conVitrina)
        await supabase
          .from("negocio")
          .update({ vitrina_activa: false })
          .eq("id", negocioId);
      // Aparte: si todavía no se corrió facebook.sql no hay columna, y el negocio se crea igual
      if (facebook)
        await supabase
          .from("negocio")
          .update({ usuario_facebook: facebook })
          .eq("id", negocioId);
      redirect("/inicio?bienvenida=1");
    }
    // Volvió atrás después de crear el suyo: no se crea otro, se lo lleva al que ya tiene.
    if (error.message === YA_TIENE_NEGOCIO) redirect("/inicio");
    // Si el enlace ya existe, se reintenta una vez con un sufijo; cualquier otro error se muestra.
    if (error.code !== UNICO_VIOLADO) break;
  }

  return {
    error: textos.crearNegocio.errorGeneral,
    nombre,
    instagram,
    facebook,
  };
}
