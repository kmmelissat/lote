// Lee un CSV (coma, punto y coma o tabulador; comillas con "" escapadas). Sin dependencias.
export function parseCsv(texto: string): string[][] {
  const limpio = texto.replace(/^﻿/, "");
  const primera = limpio.split(/\r?\n/, 1)[0] ?? "";
  const delimitador = [";", "\t", ","].reduce((mejor, d) =>
    primera.split(d).length > primera.split(mejor).length ? d : mejor,
  );

  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let entreComillas = false;

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (entreComillas) {
      if (c === '"' && limpio[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') {
        entreComillas = false;
      } else {
        celda += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === delimitador) {
      fila.push(celda);
      celda = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && limpio[i + 1] === "\n") i++;
      fila.push(celda);
      celda = "";
      filas.push(fila);
      fila = [];
    } else {
      celda += c;
    }
  }
  fila.push(celda);
  filas.push(fila);

  return filas
    .map((f) => f.map((c) => c.trim()))
    .filter((f) => f.some((c) => c !== ""));
}
