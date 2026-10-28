export type Celda = string | number | null | undefined;

const ES_NUMERO = /^-?\d+(\.\d+)?$/;

// Excel y Google Sheets ejecutan como fórmula lo que empieza con = + - @ (o tabulador / retorno).
// Un nombre de cliente o una nota con "=..." podría correr algo al abrir el archivo: se antepone
// una comilla para que se lea como texto. Los números no se tocan.
function seguro(valor: string): string {
  return /^[=+\-@\t\r]/.test(valor) && !ES_NUMERO.test(valor) ? `'${valor}` : valor;
}

function celda(valor: Celda): string {
  if (valor === null || valor === undefined) return "";
  const texto = seguro(String(valor));
  return /[",\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/** Arma un CSV con coma y saltos CRLF, con BOM para que Excel respete las tildes. */
export function aCsv(encabezados: readonly string[], filas: Celda[][]): string {
  const lineas = [encabezados, ...filas].map((fila) => fila.map(celda).join(","));
  return `﻿${lineas.join("\r\n")}\r\n`;
}
