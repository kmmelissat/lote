// Opciones comunes de los scripts de imágenes. Cada imagen se cobra, así que por defecto se generan solo las que
// falten y en calidad media: se guardan a 512 px, y "high" cuesta unas 4 veces más sin que se note.
//
//   --todas                vuelve a generarlas todas
//   --solo=nombre,otro     solo esas (aunque ya existan)
//   --calidad=low|medium|high

import { existsSync } from "node:fs";

const CALIDADES = ["low", "medium", "high"] as const;
type Calidad = (typeof CALIDADES)[number];

function valor(opcion: string): string | undefined {
  return process.argv.find((a) => a.startsWith(`--${opcion}=`))?.slice(opcion.length + 3);
}

export function opcionesImagenes(nombres: string[], soloPorDefecto?: string[]) {
  const calidad = valor("calidad") ?? "medium";
  if (!(CALIDADES as readonly string[]).includes(calidad)) {
    console.error(`--calidad tiene que ser ${CALIDADES.join(", ")}`);
    process.exit(1);
  }
  const solo = valor("solo")?.split(",").filter(Boolean) ?? soloPorDefecto;
  const desconocidas = solo?.filter((n) => !nombres.includes(n)) ?? [];
  if (desconocidas.length) {
    console.error(`No existe: ${desconocidas.join(", ")}. Opciones: ${nombres.join(", ")}`);
    process.exit(1);
  }
  const todas = process.argv.includes("--todas");
  return {
    calidad: calidad as Calidad,
    /** Si esta imagen se genera: las pedidas con --solo siempre; si no, las que falten (o todas con --todas). */
    toca: (nombre: string, ruta: string) => (solo ? solo.includes(nombre) : todas || !existsSync(ruta)),
  };
}
