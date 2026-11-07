import type { Route } from "next";
import { normalizarTexto } from "@/domain";
import { conBusqueda } from "@/lib/ruta";
import { rutaRubro } from "./explorar";
import { CATEGORIAS, RUBROS, nombreDeRubro, type RubroId } from "./rubros";

export type SugerenciaCategoria = { href: Route; nombre: string; rubro: RubroId; enRubro: string | null };

const limpio = (s: string) => normalizarTexto(s).trim().replace(/\s+/g, " ");
/** Quita la "s" o "es" del final de una palabra, igual que la base ("pasteles" → "pastel") */
export const singularPalabra = (w: string) => (w.length > 4 && w.endsWith("es") ? w.slice(0, -2) : w.length > 2 && w.endsWith("s") ? w.slice(0, -1) : w);

/** Lo mismo en cada palabra de un texto, sin tildes ni mayúsculas */
export const singular = (s: string) => limpio(s).split(" ").map(singularPalabra).join(" ");

/** Una letra por letra, sin tildes ni mayúsculas: el mismo largo que el original, para marcar las coincidencias. */
const plano = (s: string) =>
  s
    .split("")
    .map((c) => c.normalize("NFD")[0].toLowerCase())
    .join("");

/** El texto partido en trozos, con `marcado` en los que dicen lo buscado (sin importar tildes, mayúsculas ni plurales simples). */
export function trozosResaltados(texto: string, q: string): { texto: string; marcado: boolean }[] {
  const base = plano(texto);
  const marcas = new Array<boolean>(texto.length).fill(false);
  for (const cruda of plano(q).split(/\s+/).filter(Boolean)) {
    const palabra = singularPalabra(cruda);
    let desde = 0;
    for (let i = base.indexOf(palabra, desde); palabra && i !== -1; i = base.indexOf(palabra, desde)) {
      marcas.fill(true, i, i + palabra.length);
      desde = i + palabra.length;
    }
  }
  const trozos: { texto: string; marcado: boolean }[] = [];
  for (let i = 0; i < texto.length; ) {
    let j = i;
    while (j < texto.length && marcas[j] === marcas[i]) j++;
    trozos.push({ texto: texto.slice(i, j), marcado: marcas[i] });
    i = j;
  }
  return trozos;
}

const enlaceCategoria = (rubro: RubroId, sub?: string): Route => conBusqueda(rutaRubro(rubro), sub ? new URLSearchParams({ sub }) : "");

export function categoriaSugerida(rubro: RubroId, sub?: string): SugerenciaCategoria {
  return { href: enlaceCategoria(rubro, sub), nombre: sub ?? nombreDeRubro(rubro), rubro, enRubro: sub ? nombreDeRubro(rubro) : null };
}

/** Los rubros y categorías del catálogo cuyo nombre dice lo buscado (sin tildes, mayúsculas ni plurales). */
export function categoriasQueCoinciden(texto: string, max = 3): SugerenciaCategoria[] {
  const q = singular(texto);
  if (q.length < 2) return [];
  const palabras = q.split(" ");
  const dice = (nombre: string) => {
    const n = singular(nombre);
    return palabras.every((p) => n.includes(p));
  };
  const rubros = RUBROS.filter((r) => r.id !== "otros" && dice(r.nombre)).map((r) => categoriaSugerida(r.id));
  const subs = CATEGORIAS.filter((c) => c.rubro !== "otros" && dice(c.nombre)).map((c) => categoriaSugerida(c.rubro, c.nombre));
  return [...rubros, ...subs].slice(0, max);
}

