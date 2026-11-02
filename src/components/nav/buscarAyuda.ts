import { textos } from "@/lib/textos";
import { normalizar } from "./buscarDestinos";

type PreguntaDeAyuda = { id: string; pregunta: string };

const MAXIMO = 3;
const palabras = (s: string) => normalizar(s).split(/[^a-z0-9ñ]+/).filter((p) => p.length > 1);

/** Las preguntas de la ayuda que hablan de lo escrito: todas las palabras tienen que estar en la pregunta o en su respuesta. */
export function buscarAyuda(consulta: string, preguntas: readonly (PreguntaDeAyuda & { respuesta: string })[] = textos.ayuda.preguntas): PreguntaDeAyuda[] {
  const buscadas = palabras(consulta);
  if (!buscadas.length) return [];
  return preguntas
    .map((p) => {
      const enPregunta = normalizar(p.pregunta);
      const enRespuesta = normalizar(p.respuesta);
      let puntos = 0;
      for (const b of buscadas) {
        if (enPregunta.includes(b)) puntos += 3;
        else if (enRespuesta.includes(b)) puntos += 1;
        else return null;
      }
      return { id: p.id, pregunta: p.pregunta, puntos };
    })
    .filter((x): x is PreguntaDeAyuda & { puntos: number } => x !== null)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, MAXIMO)
    .map(({ id, pregunta }) => ({ id, pregunta }));
}
