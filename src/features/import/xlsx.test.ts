import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { parseXlsx, pareceExcelViejo, pareceXlsx } from "./xlsx";

function crc32(data: Uint8Array): number {
  let c = ~0;
  for (const b of data) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function set(view: DataView, o: number, u16s: [number, number][], u32s: [number, number][]) {
  for (const [off, v] of u16s) view.setUint16(o + off, v, true);
  for (const [off, v] of u32s) view.setUint32(o + off, v, true);
}

/** Zip de prueba. `deflate` imita a Excel (método 8); sin eso, STORE. */
function zipDe(files: Record<string, string>, deflate = false): ArrayBuffer {
  const enc = new TextEncoder();
  const locales: Uint8Array[] = [];
  const centrales: Uint8Array[] = [];
  let offset = 0;
  for (const [nombre, contenido] of Object.entries(files)) {
    const name = enc.encode(nombre);
    const data = enc.encode(contenido);
    const payload = deflate ? new Uint8Array(deflateRawSync(data)) : data;
    const metodo = deflate ? 8 : 0;
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length + payload.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    set(lv, 0, [[4, 20], [8, metodo], [26, name.length]], [[14, crc], [18, payload.length], [22, data.length]]);
    local.set(name, 30);
    local.set(payload, 30 + name.length);
    locales.push(local);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    set(cv, 0, [[4, 20], [6, 20], [10, metodo], [28, name.length]], [[16, crc], [20, payload.length], [24, data.length], [42, offset]]);
    central.set(name, 46);
    centrales.push(central);
    offset += local.length;
  }
  const cdSize = centrales.reduce((s, c) => s + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  set(ev, 0, [[8, locales.length], [10, locales.length]], [[12, cdSize], [16, offset]]);
  const out = new Uint8Array(offset + cdSize + 22);
  let p = 0;
  for (const l of locales) {
    out.set(l, p);
    p += l.length;
  }
  for (const c of centrales) {
    out.set(c, p);
    p += c.length;
  }
  out.set(eocd, p);
  return out.buffer;
}

function zipStore(files: Record<string, string>): ArrayBuffer {
  return zipDe(files, false);
}

const HOJA = `<?xml version="1.0"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="s"><v>0</v></c>
      <c r="B1" t="s"><v>1</v></c>
      <c r="C1" t="s"><v>2</v></c>
    </row>
    <row r="2">
      <c r="A2" t="s"><v>3</v></c>
      <c r="B2"><v>25</v></c>
      <c r="C2"><v>1</v></c>
    </row>
    <row r="3">
      <c r="A3" t="inlineStr"><is><t>Llavero, rosa</t></is></c>
      <c r="B3"><v>3.5</v></c>
    </row>
  </sheetData>
</worksheet>`;

const STRINGS = `<?xml version="1.0"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <si><t>nombre</t></si>
  <si><t>precio</t></si>
  <si><t>cantidad</t></si>
  <si><r><t>Chaqueta </t></r><r><t>negra</t></r></si>
</sst>`;

describe("parseXlsx", () => {
  it("lee la primera pestaña, shared strings, números y celdas vacías", async () => {
    const buf = zipStore({
      "xl/worksheets/sheet1.xml": HOJA,
      "xl/sharedStrings.xml": STRINGS,
    });
    expect(await parseXlsx(buf)).toEqual([
      ["nombre", "precio", "cantidad"],
      ["Chaqueta negra", "25", "1"],
      ["Llavero, rosa", "3.5", ""],
    ]);
  });

  it("lee un zip DEFLATE, como el Excel de verdad", async () => {
    const buf = zipDe(
      {
        "xl/worksheets/sheet1.xml": HOJA,
        "xl/sharedStrings.xml": STRINGS,
      },
      true,
    );
    expect(await parseXlsx(buf)).toEqual([
      ["nombre", "precio", "cantidad"],
      ["Chaqueta negra", "25", "1"],
      ["Llavero, rosa", "3.5", ""],
    ]);
  });

  it("decodifica entidades y deja de lado las filas vacías", async () => {
    const buf = zipStore({
      "xl/worksheets/sheet1.xml": `<worksheet><sheetData>
        <row r="1"><c r="A1" t="inlineStr"><is><t>A &amp; B</t></is></c></row>
        <row r="2"></row>
        <row r="4"><c r="A4" t="inlineStr"><is><t>siguiente</t></is></c></row>
      </sheetData></worksheet>`,
    });
    expect(await parseXlsx(buf)).toEqual([["A & B"], ["siguiente"]]);
  });

  it("falla si no hay hoja", async () => {
    await expect(parseXlsx(zipStore({ "hola.txt": "x" }))).rejects.toThrow();
  });
});

describe("pareceXlsx / pareceExcelViejo", () => {
  it("reconoce el encabezado de zip y el de OLE", () => {
    expect(pareceXlsx(zipStore({ a: "b" }))).toBe(true);
    expect(pareceXlsx(new TextEncoder().encode("nombre,precio").buffer)).toBe(false);
    const ole = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0]);
    expect(pareceExcelViejo(ole.buffer)).toBe(true);
    expect(pareceExcelViejo(zipStore({ a: "b" }))).toBe(false);
  });
});
