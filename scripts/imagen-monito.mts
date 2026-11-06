// El monito emprendedor del mostrador del Marketplace (public/mercadito/monito.webp), hecho con OpenAI, fondo transparente.
//
//   pnpm imagen-monito                 lo genera si falta
//   pnpm imagen-monito --solo=monito   lo vuelve a generar (más opciones en opcionesImagenes.mts)

import { writeFile } from "node:fs/promises";
import OpenAI from "openai";
import sharp from "sharp";
import { opcionesImagenes } from "./opcionesImagenes.mts";

const PROMPT =
  "Un monito simpático y emprendedor, de cuerpo entero, parado y sonriendo, con delantal de mango, una gorra de visera y un cuadernito de cuentas bajo el brazo, " +
  "un saludo con una mano. Ilustración plana estilo sticker, trazo grueso en azul petróleo oscuro (#003844), colores cálidos y alegres (mango, rosa, crema, verde azulado), sombreado mínimo. " +
  "Personaje centrado y completo, fondo transparente, sin texto, sin marcas.";

if (!process.env.OPENAI_API_KEY) {
  console.error("Falta OPENAI_API_KEY en .env.local");
  process.exit(1);
}
const { calidad, toca } = opcionesImagenes(["monito"]);
const ruta = "public/mercadito/monito.webp";
if (!toca("monito", ruta)) {
  console.log("· monito: ya está");
  process.exit(0);
}
const r = await new OpenAI().images.generate({
  model: "gpt-image-1-mini",
  prompt: PROMPT,
  size: "1024x1024",
  quality: calidad,
  background: "transparent",
  output_format: "png",
  n: 1,
});
const b64 = r.data?.[0]?.b64_json;
if (!b64) {
  console.error("✗ monito: vino vacía");
  process.exit(1);
}
await writeFile(ruta, await sharp(Buffer.from(b64, "base64")).resize(512, 512).webp({ quality: 90 }).toBuffer());
console.log("✓ monito");
