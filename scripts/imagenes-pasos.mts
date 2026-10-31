// Lotito en cada paso del seguimiento (public/seguimiento/paso-*.webp): recibe, empaca, va en camino, entrega, y las dos
// del retiro en tienda. Parte de los monitos originales (public/monitos) para mantener al personaje.
//
//   pnpm imagenes-pasos            genera las que falten
//   pnpm imagenes-pasos --todas    vuelve a generarlas todas

import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import OpenAI, { toFile } from "openai";
import sharp from "sharp";

// El mismo personaje que en imagenes-landing.mts
const PERSONAJE =
  "ESTE es el personaje: un gorila cartoon chiquito (NO un mono kawaii redondo, NO un chimpancé realista). " +
  "Tiene un solo mechón en la coronilla, orejas redondas a los lados, hocico ANCHO en forma de corazón, y una pancita en forma de corazón. " +
  "La cara de corazón y la pancita de corazón son CREMA #fff7e8 y se tienen que ver clarito. " +
  "Los ojos y la boca van en #003844 SOBRE la cara crema, grandes y legibles. " +
  "Cuerpo de un solo color plano, trazo grueso #003844, rellenos lisos, sin pelo realista, sin degradados. " +
  "Mantené ESTA silueta. Squash/stretch, un lean, energía de sticker de caricatura. " +
  "Fondo transparente, sin texto, sin letras, sin logos.";

const PASOS: { archivo: string; ref: string; cuerpo: string; extra: string }[] = [
  {
    archivo: "paso-recibido",
    ref: "celular",
    cuerpo: "celeste #8fd6f4",
    extra: "Sosteniendo con una mano una libretita crema con una palomita (check) dibujada y con la otra una lapicera. Ojos abiertos contentos, sonrisa de 'anotado'.",
  },
  {
    archivo: "paso-empacado",
    ref: "caja",
    cuerpo: "mango #ff9a2e",
    extra: "Empacando: cerrando una caja de cartón con un rollo de cinta, un moño rosa encima. Concentrado y contento, la lengüita afuera.",
  },
  {
    archivo: "paso-camino",
    ref: "saluda",
    cuerpo: "teal #006c67",
    extra: "Corriendo apurado con un paquete envuelto bajo el brazo y una gorrita de repartidor, con una pierna al aire y rayitas de velocidad detrás. Sonrisa grande.",
  },
  {
    archivo: "paso-entregado",
    ref: "thumbsup",
    cuerpo: "rosa #f194b4",
    extra: "Entregando con las dos manos un paquete con moño, inclinándose hacia adelante con ojos cerrados de felicidad y sonrisa grande. Un par de estrellitas alrededor.",
  },
  {
    archivo: "paso-listo",
    ref: "asoma",
    cuerpo: "teal oscuro #003844",
    extra: "Asomado detrás de un mostrador crema, apoyando una bolsa de papel kraft con un moño. Ojos felices, sonrisa chiquita. Cuerpo teal oscuro; la cara y pancita crema bien claras.",
  },
  {
    archivo: "paso-recogido",
    ref: "thumbsup",
    cuerpo: "limón #ffe27a con trazo #003844",
    extra: "Saliendo contento con una bolsa de compras colgando de un brazo y el pulgar arriba del otro. Ojos cerrados felices, sonrisa grande.",
  },
];

if (!process.env.OPENAI_API_KEY) {
  console.error("Falta OPENAI_API_KEY en .env.local");
  process.exit(1);
}
mkdirSync("public/seguimiento", { recursive: true });
const todas = process.argv.includes("--todas");
const openai = new OpenAI();

await Promise.all(
  PASOS.map(async ({ archivo, ref, cuerpo, extra }) => {
    const ruta = `public/seguimiento/${archivo}.webp`;
    if (!todas && existsSync(ruta)) return console.log(`· ${archivo}: ya está`);
    // Amarillo de fondo: así se ve la carita (en el SVG es un hueco).
    const png = await sharp(`public/monitos/monito_${ref}.svg`)
      .resize(1024, 1024, { fit: "contain", background: { r: 255, g: 226, b: 122, alpha: 1 } })
      .flatten({ background: "#ffe27a" })
      .png()
      .toBuffer();
    const imagen = await toFile(png, `${ref}.png`, { type: "image/png" });
    const r = await openai.images.edit({
      model: "gpt-image-1-mini",
      image: imagen,
      prompt:
        `${PERSONAJE} Color del cuerpo: ${cuerpo}. ${extra} ` +
        "La zona amarilla del hocico ES LA CARA: pintala crema y dibujá bien los ojos y la boca. " +
        "Sacá el fondo amarillo; el fondo final es transparente. Cuerpo completo dentro del cuadro, sin cortar nada.",
      background: "transparent",
      quality: "high",
      size: "1024x1024",
      n: 1,
    });
    const b64 = r.data?.[0]?.b64_json;
    if (!b64) return console.warn(`   ✗ ${archivo}: vino vacía`);
    await writeFile(ruta, await sharp(Buffer.from(b64, "base64")).trim().resize(512, 512, { fit: "inside" }).webp({ quality: 90 }).toBuffer());
    console.log(`   ✓ ${archivo}`);
  }),
);
