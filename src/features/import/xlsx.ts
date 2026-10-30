import { unzip } from "./zip";

function xml(bytes: Uint8Array) {
  return new TextDecoder("utf-8").decode(bytes).replace(/^\uFEFF/, "");
}

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");
}

function attr(tag: string, nombre: string) {
  return new RegExp(`\\b${nombre}="([^"]*)"`, "i").exec(tag)?.[1];
}

function interiores(xmlFuente: string, etiqueta: string): string[] {
  const re = new RegExp(`<(?:[\\w.]+:)?${etiqueta}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.]+:)?${etiqueta}>`, "gi");
  return [...xmlFuente.matchAll(re)].map((m) => m[1] ?? "");
}

function textosT(xmlFuente: string): string {
  return interiores(xmlFuente, "t").map(decode).join("");
}

function sharedStrings(xmlFuente: string): string[] {
  return interiores(xmlFuente, "si").map(textosT);
}

function colDe(ref: string): number {
  const letras = /^([A-Z]+)/i.exec(ref)?.[1]?.toUpperCase() ?? "A";
  let n = 0;
  for (const c of letras) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

function filaDe(ref: string): number {
  return Number(/(\d+)$/.exec(ref)?.[1] ?? "1");
}

function valorDeV(inner: string): string {
  return interiores(inner, "v")[0]?.trim() ?? "";
}

function valorCelda(inner: string, tipo: string | undefined, strings: string[]): string {
  if (tipo === "s") {
    const i = Number(valorDeV(inner));
    return Number.isInteger(i) ? (strings[i] ?? "") : "";
  }
  if (tipo === "inlineStr") return textosT(inner);
  if (tipo === "str") return decode(valorDeV(inner) || textosT(inner));
  if (tipo === "b") return valorDeV(inner) === "1" ? "TRUE" : "FALSE";
  if (tipo === "e") return "";
  return decode(valorDeV(inner));
}

function filasDeHoja(xmlFuente: string, strings: string[]): string[][] {
  const celdas = [...xmlFuente.matchAll(/<(?:[\w.]+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:[\w.]+:)?c>)/gi)];
  const porFila = new Map<number, Map<number, string>>();
  let maxCol = 0;
  for (const m of celdas) {
    const ref = attr(m[1] ?? "", "r");
    if (!ref) continue;
    const fila = filaDe(ref);
    const col = colDe(ref);
    const valor = valorCelda(m[2] ?? "", attr(m[1] ?? "", "t"), strings).trim();
    let row = porFila.get(fila);
    if (!row) {
      row = new Map();
      porFila.set(fila, row);
    }
    row.set(col, valor);
    if (col > maxCol) maxCol = col;
  }
  const nums = [...porFila.keys()].sort((a, b) => a - b);
  if (!nums.length) return [];
  const out: string[][] = [];
  for (let f = nums[0]!; f <= nums[nums.length - 1]!; f++) {
    const row = porFila.get(f);
    const linea = Array.from({ length: maxCol + 1 }, (_, c) => row?.get(c) ?? "");
    if (linea.some((c) => c !== "")) out.push(linea);
  }
  return out;
}

/** True si el archivo empieza como un zip (xlsx, xlsm, docx…). */
export function pareceXlsx(buffer: ArrayBuffer): boolean {
  const u = new Uint8Array(buffer);
  return u[0] === 0x50 && u[1] === 0x4b;
}

/** True si es el Excel viejo (.xls), un documento OLE. */
export function pareceExcelViejo(buffer: ArrayBuffer): boolean {
  const u = new Uint8Array(buffer);
  return u[0] === 0xd0 && u[1] === 0xcf;
}

/** Primera pestaña de un .xlsx, como filas de texto (encabezado incluido). */
export async function parseXlsx(buffer: ArrayBuffer): Promise<string[][]> {
  const archivos = await unzip(buffer);
  const stringsXml = archivos.get("xl/sharedStrings.xml");
  const strings = stringsXml ? sharedStrings(xml(stringsXml)) : [];
  const hoja = [...archivos.keys()]
    .filter((k) => /^xl\/worksheets\/[^/]+\.xml$/i.test(k))
    .sort((a, b) => a.localeCompare(b, "en"))[0];
  if (!hoja) throw new Error("xlsx");
  const filas = filasDeHoja(xml(archivos.get(hoja)!), strings);
  if (!filas.length) throw new Error("vacio");
  return filas;
}
