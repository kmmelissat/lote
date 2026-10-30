// Las ilustraciones del hero del mercadito (public/mercadito/*.webp), hechas con OpenAI, con fondo transparente.
//
//   pnpm imagenes-mercadito          genera las que falten
//   pnpm imagenes-mercadito --todas  vuelve a generarlas todas

import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import OpenAI from "openai";
import sharp from "sharp";

const ESTILO =
  "Ilustración plana estilo sticker, trazo grueso en azul petróleo oscuro (#003844), colores cálidos y alegres (mango, rosa, crema, verde azulado), sombreado mínimo. " +
  "Un solo objeto centrado y completo, fondo transparente, sin texto, sin marcas, sin manos ni personas.";

const OBJETOS: Record<string, string> = {
  tartaleta: "Tartaleta de frutas (fresa, kiwi y arándano) sobre un platito pequeño",
  suculenta: "Suculenta en una maceta de barro pintada a mano",
  blusa: "Blusa de lino blanca doblada con cuidado",
  case: "Case de celular rosa con lunares rojos, visto por detrás, con el hueco de la cámara",
  taza: "Taza de barro con café caliente humeando y un pan dulce al lado",
  aretes: "Par de aretes dorados de argolla",
  monstera: "Planta monstera en maceta blanca",
  vinilo: "Disco de vinilo negro saliendo a medias de su funda de colores",
  bolso: "Bolso de palma tejido con asas de cuero",
  macarons: "Tres macarons de colores apilados",
};

if (!process.env.OPENAI_API_KEY) {
  console.error("Falta OPENAI_API_KEY en .env.local");
  process.exit(1);
}
const todas = process.argv.includes("--todas");
const openai = new OpenAI();

await Promise.all(
  Object.entries(OBJETOS).map(async ([nombre, objeto]) => {
    const ruta = `public/mercadito/${nombre}.webp`;
    if (!todas && existsSync(ruta)) return console.log(`· ${nombre}: ya está`);
    const r = await openai.images.generate({
      model: "gpt-image-1-mini",
      prompt: `${objeto}. ${ESTILO}`,
      size: "1024x1024",
      quality: "medium",
      background: "transparent",
      output_format: "png",
      n: 1,
    });
    const b64 = r.data?.[0]?.b64_json;
    if (!b64) return console.warn(`   ✗ ${nombre}: vino vacía`);
    await writeFile(ruta, await sharp(Buffer.from(b64, "base64")).resize(512, 512).webp({ quality: 90 }).toBuffer());
    console.log(`   ✓ ${nombre}`);
  }),
);
