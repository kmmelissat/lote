import { describe, expect, it } from "vitest";
import { esRutaFoto } from "./fotos";

const NEGOCIO = "3f2a1c9e-0b1d-4f6e-9a77-1c2d3e4f5a6b";
const OTRO = "aaaaaaaa-0b1d-4f6e-9a77-1c2d3e4f5a6b";

describe("esRutaFoto", () => {
  it("acepta una foto del propio negocio", () => {
    expect(esRutaFoto(`${NEGOCIO}/abc-123.webp`, NEGOCIO)).toBe(true);
  });

  it("rechaza fotos de otro negocio", () => {
    expect(esRutaFoto(`${OTRO}/abc.webp`, NEGOCIO)).toBe(false);
  });

  it("rechaza rutas raras", () => {
    for (const mala of [`${NEGOCIO}/../x.webp`, `${NEGOCIO}/a/b.webp`, `${NEGOCIO}/x.exe`, 5, null]) {
      expect(esRutaFoto(mala, NEGOCIO)).toBe(false);
    }
  });
});
