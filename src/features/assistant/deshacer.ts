import { textos } from "@/lib/textos";
import type { Deps, Respuesta } from "./tipos";
import { textoDeError } from "./ayudas";

const t = textos.asistente;

export async function deshacerUltima(d: Deps): Promise<Respuesta> {
  const ultima = await d.puerto.ultimaAccionDeshacible();
  return ultima ? deshacer(d, ultima.id) : { texto: t.nadaQueDeshacer };
}

export async function deshacer(d: Deps, accionId: string): Promise<Respuesta> {
  const r = await d.puerto.deshacerAccion(accionId);
  if (r.ok) return { texto: t.deshecho(r.valor) };
  if (r.error.tipo === "cambiado") return { texto: t.noSePuedeDeshacer };
  if (r.error.tipo === "no_deshacible") return { texto: t.nadaQueDeshacer };
  return { texto: textoDeError(r.error) };
}
