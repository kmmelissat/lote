/**
 * Las respuestas de Lotito son texto con un poco de forma: listas ("- ", "• ", "1. ") y **negritas**.
 * Esto las parte en bloques para dibujarlas sin HTML crudo (nada de lo que escribe la IA se interpreta como código).
 */
export type Trozo = { texto: string; negrita: boolean };
export type Bloque = { tipo: "parrafo"; trozos: Trozo[] } | { tipo: "lista"; numerada: boolean; items: Trozo[][] };

const VINETA = /^\s*(?:[-•*]|(\d+)[.)])\s+(.*)$/;

/** "Te quedó **$33.00**" → [{texto: "Te quedó "}, {texto: "$33.00", negrita: true}] */
export function trozosDe(linea: string): Trozo[] {
  return linea
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((parte) => (parte.startsWith("**") && parte.endsWith("**") && parte.length > 4 ? { texto: parte.slice(2, -2), negrita: true } : { texto: parte, negrita: false }));
}

export function bloquesDe(texto: string): Bloque[] {
  const bloques: Bloque[] = [];
  for (const linea of texto.split("\n")) {
    const vineta = linea.match(VINETA);
    const ultimo = bloques.at(-1);
    if (vineta) {
      const numerada = vineta[1] !== undefined;
      if (ultimo?.tipo === "lista" && ultimo.numerada === numerada) ultimo.items.push(trozosDe(vineta[2]));
      else bloques.push({ tipo: "lista", numerada, items: [trozosDe(vineta[2])] });
    } else if (linea.trim()) {
      // Las líneas seguidas de un mismo párrafo se juntan con un salto, como estaban
      if (ultimo?.tipo === "parrafo") ultimo.trozos.push({ texto: "\n", negrita: false }, ...trozosDe(linea));
      else bloques.push({ tipo: "parrafo", trozos: trozosDe(linea) });
    } else if (ultimo?.tipo === "parrafo") {
      // Una línea vacía corta el párrafo
      bloques.push({ tipo: "parrafo", trozos: [] });
    }
  }
  return bloques.filter((b) => b.tipo === "lista" || b.trozos.length > 0);
}
