import type { Route } from "next";
import { normalizarTexto } from "@/domain";
import { conBusqueda } from "@/lib/ruta";
import { rutaRubro } from "./explorar";
import { CATEGORIAS, RUBROS, nombreDeRubro, type RubroId } from "./rubros";

export type SugerenciaCategoria = { href: Route; nombre: string; rubro: RubroId; enRubro: string | null };

const limpio = (s: string) => normalizarTexto(s).trim().replace(/\s+/g, " ");
/** Quita la "s" o "es" del final de cada palabra, igual que la base ("pasteles" → "pastel") */
export const singular = (s: string) =>
  limpio(s)
    .split(" ")
    .map((w) => (w.length > 4 && w.endsWith("es") ? w.slice(0, -2) : w.length > 2 && w.endsWith("s") ? w.slice(0, -1) : w))
    .join(" ");

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

