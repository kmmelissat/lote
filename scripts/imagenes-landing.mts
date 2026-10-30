// Ilustraciones de la landing (public/landing/*.webp): productos del mock, chat, ganancia y Lotito.
//
//   pnpm imagenes-landing            genera las que falten
//   pnpm imagenes-landing --todas    vuelve a generarlas todas
//   pnpm imagenes-landing --lotitos  solo regenera a Lotito a partir de public/monitos

import { mkdirSync, existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import OpenAI, { toFile } from "openai";
import sharp from "sharp";

const ESTILO =
  "Ilustración plana estilo sticker, trazo grueso en azul petróleo oscuro (#003844), colores cálidos y alegres (mango, rosa, crema, verde azulado), sombreado mínimo. " +
  "Un solo objeto centrado y completo, fondo transparente, sin texto, sin logos, sin marcas de agua, sin manos ni personas.";

const OBJETOS: Record<string, string> = {
  chaqueta: "Chaqueta negra de mezclilla doblada, vista de frente, simple y clara",
  disco: "Disco de vinilo negro saliendo a medias de una funda rosa y amarilla",
  llaveros: "Tres llaveros juntos: uno de corazón rosa, uno de estrella mango y uno de llave verde",
  chat: "Dos burbujas de diálogo, una verde azulado y una crema, como una conversación, sin letras adentro",
  ganancia: "Una pila de tres monedas de oro y un billete enrollado, vista de 3/4",
};

const PERSONAJE =
  "ESTE es el personaje: un gorila cartoon chiquito (NO un mono kawaii redondo, NO un chimpancé realista). " +
  "Tiene un solo mechón en la coronilla, orejas redondas a los lados, hocico ANCHO en forma de corazón, y una pancita en forma de corazón. " +
  "La cara de corazón y la pancita de corazón son CREMA #fff7e8 y se tienen que ver clarito. " +
  "Los ojos y la boca van en #003844 SOBRE la cara crema, grandes y legibles. " +
  "Cuerpo de un solo color plano, trazo grueso #003844, rellenos lisos, sin pelo realista, sin degradados. " +
  "Mantené ESTA silueta y ESTA pose. No lo pongas derecho ni rígido: squash/stretch, un lean, energía de sticker de caricatura. " +
  "Fondo transparente, sin texto, sin logos.";

const LOTITOS: { archivo: string; ref: string; cuerpo: string; extra: string }[] = [
  {
    archivo: "lotito-asoma",
    ref: "asoma",
    cuerpo: "rosa #f194b4",
    extra: "Asomado por un borde, las dos manitos apoyadas, cabeza inclinada. Ojos cerrados de felicidad y sonrisa chiquita, como el original. Cuerpo rosa, cara y hocico crema.",
  },
  {
    archivo: "lotito-saluda",
    ref: "saluda",
    cuerpo: "mango #ff9a2e",
    extra: "De pie saludando con una mano bien alta, el cuerpo se inclina al lado contrario. Ojos redondos abiertos y sonrisa grande. Cuerpo mango, cara y pancita corazón crema.",
  },
  {
    archivo: "lotito-thumbsup",
    ref: "thumbsup",
    cuerpo: "teal #006c67",
    extra: "De pie con el pulgar arriba, un poquito echado hacia atrás, orgulloso. Ojos cerrados felices y sonrisa grande, como el original. Cuerpo teal, cara y pancita corazón crema. Las rayitas del pulgar pueden quedarse.",
  },
  {
    archivo: "lotito-calculadora",
    ref: "calculadora",
    cuerpo: "celeste #8fd6f4",
    extra: "De pie sosteniendo una calculadora crema, inclinado hacia ella. Una ceja levantada, sonrisa pícara. Cuerpo celeste, cara y pancita corazón crema. Calculadora crema con botones #003844.",
  },
  {
    archivo: "lotito-celular",
    ref: "celular",
    cuerpo: "teal oscuro #003844",
    extra: "Sentado, un poquito encorvado, mirando el celular. Ojos entrecerrados y sonrisa cómplice. Cuerpo teal oscuro, cara y pancita corazón crema. Celular crema.",
  },
];

if (!process.env.OPENAI_API_KEY) {
  console.error("Falta OPENAI_API_KEY en .env.local");
  process.exit(1);
}
mkdirSync("public/landing", { recursive: true });
const todas = process.argv.includes("--todas");
const openai = new OpenAI();

const soloLotitos = process.argv.includes("--lotitos");

await Promise.all([
  ...(soloLotitos
    ? []
    : Object.entries(OBJETOS).map(async ([nombre, objeto]) => {
        const ruta = `public/landing/${nombre}.webp`;
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
      })),
  ...LOTITOS.map(async ({ archivo, ref, cuerpo, extra }) => {
    const ruta = `public/landing/${archivo}.webp`;
    if (!todas && !soloLotitos && existsSync(ruta)) return console.log(`· ${archivo}: ya está`);
    // Amarillo como en la landing: así se ve la carita (en el SVG es un hueco).
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
        "Sacá el fondo amarillo; el fondo final es transparente.",
      background: "transparent",
      quality: "high",
      size: "1024x1024",
      n: 1,
    });
    const b64 = r.data?.[0]?.b64_json;
    if (!b64) return console.warn(`   ✗ ${archivo}: vino vacía`);
    await writeFile(ruta, await sharp(Buffer.from(b64, "base64")).resize(512, 512).webp({ quality: 90 }).toBuffer());
    console.log(`   ✓ ${archivo}`);
  }),
]);
