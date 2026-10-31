// Ilustraciones del trencito del seguimiento (public/seguimiento/*.webp): la locomotora y los dos vagones (cargado y vacío).
//
//   pnpm imagenes-tren            genera las que falten
//   pnpm imagenes-tren --todas    vuelve a generarlas todas

import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import OpenAI from "openai";
import sharp from "sharp";

const ESTILO =
  "Ilustración plana estilo sticker, trazo grueso en azul petróleo oscuro (#003844), colores cálidos y alegres, sombreado mínimo, formas redondeadas y juguetonas. " +
  "Vista lateral pura (de perfil) mirando hacia la derecha, un solo vagón o locomotora centrado y completo con sus ruedas, fondo transparente, " +
  "sin texto, sin letras, sin números, sin logos, sin vías, sin humo, sin personas, sin animales.";

const PIEZAS: Record<string, string> = {
  locomotora: "Locomotora de tren de juguete chiquita y simpática: caldera mango #ff9a2e, cabina verde azulado #006c67 con ventana celeste, chimenea redonda, ruedas grandes",
  "vagon-actual": "Vagón de tren de juguete largo y ancho, abierto por arriba, de color amarillo limón #ffe27a, visto exactamente de perfil, del que asoman tres paquetitos envueltos con moños (uno rosa, uno celeste, uno mango), dos ruedas grandes visibles",
  "vagon-falta": "Vagón de tren de juguete largo y ancho, abierto por arriba y VACÍO, color crema claro con trazo azul petróleo, visto exactamente de perfil, plano, sin perspectiva ni vista 3/4, dos ruedas grandes visibles",
};

if (!process.env.OPENAI_API_KEY) {
  console.error("Falta OPENAI_API_KEY en .env.local");
  process.exit(1);
}
mkdirSync("public/seguimiento", { recursive: true });
const todas = process.argv.includes("--todas");
const openai = new OpenAI();

await Promise.all(
  Object.entries(PIEZAS).map(async ([nombre, pieza]) => {
    const ruta = `public/seguimiento/${nombre}.webp`;
    if (!todas && existsSync(ruta)) return console.log(`· ${nombre}: ya está`);
    const r = await openai.images.generate({
      model: "gpt-image-1-mini",
      prompt: `${pieza}. ${ESTILO}`,
      size: "1024x1024",
      quality: "medium",
      background: "transparent",
      output_format: "png",
      n: 1,
    });
    const b64 = r.data?.[0]?.b64_json;
    if (!b64) return console.warn(`   ✗ ${nombre}: vino vacía`);
    // Recorta el aire alrededor para que todas las piezas se acomoden por su borde
    await writeFile(ruta, await sharp(Buffer.from(b64, "base64")).trim().resize({ width: 480, withoutEnlargement: true }).webp({ quality: 90 }).toBuffer());
    console.log(`   ✓ ${nombre}`);
  }),
);
