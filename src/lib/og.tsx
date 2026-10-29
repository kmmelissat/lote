import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import sharp from "sharp";
import { urlFoto } from "./fotos";
import { textos } from "./textos";

// Lo que comparten las imágenes de vista previa (las que se ven al pegar un enlace en WhatsApp o Instagram):
// tamaño, colores de la marca, fuentes, el gorila y las fotos ya listas para dibujar.

export const TAMANO_OG = { width: 1200, height: 630 };

/**
 * Dibuja la imagen y la entrega en JPEG: con fotos, el PNG pasa de 600 KB y WhatsApp deja de mostrar la
 * vista previa pasados unos 300 KB.
 */
export async function imagenOg(contenido: ReactElement): Promise<Response> {
  const png = await new ImageResponse(contenido, { ...TAMANO_OG, fonts: await fuentesOg() }).arrayBuffer();
  const jpg = await sharp(Buffer.from(png)).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpg), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}

export const COLOR = {
  tealOscuro: "#003844",
  teal: "#006c67",
  crema: "#fff7e8",
  limon: "#ffe27a",
  rosa: "#f194b4",
  rosaPalido: "#fdeaf1",
  mango: "#ff9a2e",
  blanco: "#ffffff",
  texto2: "#4a6b73",
};

const fuente = (archivo: string) => readFile(join(process.cwd(), "assets/fuentes", archivo));

let fuentes: ReturnType<typeof cargarFuentes> | null = null;
async function cargarFuentes() {
  const [jakarta500, jakarta700, fredoka] = await Promise.all([fuente("jakarta-500.ttf"), fuente("jakarta-700.ttf"), fuente("fredoka-600.ttf")]);
  return [
    { name: "Jakarta", data: jakarta500, weight: 500 as const, style: "normal" as const },
    { name: "Jakarta", data: jakarta700, weight: 700 as const, style: "normal" as const },
    { name: "Fredoka", data: fredoka, weight: 600 as const, style: "normal" as const },
  ];
}

/** Las fuentes se leen una sola vez por proceso. */
export const fuentesOg = () => (fuentes ??= cargarFuentes());

let gorila: Promise<string> | null = null;
/** El isotipo en teal oscuro, listo para un <img>. */
export function gorilaOg(): Promise<string> {
  return (gorila ??= readFile(join(process.cwd(), "public/lote-iso.svg"), "utf8").then(
    (svg) => `data:image/svg+xml;base64,${Buffer.from(svg.replaceAll("#006C67", COLOR.tealOscuro)).toString("base64")}`,
  ));
}

/**
 * Una foto del bucket como PNG cuadrado (el dibujante de imágenes no entiende WebP). null si no se pudo:
 * la imagen se arma igual, sin esa foto.
 */
export async function fotoOg(ruta: string | null | undefined, lado = 600): Promise<string | null> {
  if (!ruta) return null;
  try {
    const r = await fetch(urlFoto(ruta));
    if (!r.ok) return null;
    const png = await sharp(Buffer.from(await r.arrayBuffer())).resize(lado, lado, { fit: "cover" }).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

/** El logo de Lote como sticker, igual que en la app: el gorila y "lote" sobre una etiqueta limón. */
export function LogoOg({ gorila, escala = 1 }: { gorila: string; escala?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignSelf: "flex-start",
        alignItems: "center",
        gap: 8 * escala,
        background: COLOR.limon,
        border: `${3 * escala}px solid ${COLOR.tealOscuro}`,
        borderRadius: 16 * escala,
        boxShadow: `${4 * escala}px ${4 * escala}px 0 0 ${COLOR.tealOscuro}`,
        padding: `${4 * escala}px ${14 * escala}px ${4 * escala}px ${10 * escala}px`,
        transform: "rotate(-2deg)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={gorila} width={34 * escala} height={34 * escala} alt="" />
      <span style={{ fontFamily: "Fredoka", fontSize: 34 * escala, color: COLOR.tealOscuro, lineHeight: 1 }}>{textos.nombre.toLowerCase()}</span>
    </div>
  );
}

/** Una foto pegada como sticker: borde blanco grueso, sombra dura y un giro. Sin foto, un cuadro limón con el gorila. */
export function StickerOg({ foto, lado, giro, gorila, sombra = COLOR.tealOscuro }: { foto: string | null; lado: number; giro: number; gorila: string; sombra?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: lado,
        height: lado,
        background: COLOR.limon,
        border: `8px solid ${COLOR.blanco}`,
        borderRadius: 28,
        boxShadow: `10px 10px 0 0 ${sombra}`,
        transform: `rotate(${giro}deg)`,
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {foto ? <img src={foto} width={lado - 16} height={lado - 16} alt="" style={{ objectFit: "cover" }} /> : <img src={gorila} width={lado / 2.5} height={lado / 2.5} alt="" />}
    </div>
  );
}

/** Si la tienda o el producto ya no existen: la marca sola, para que el enlace igual se vea bien. */
export function VaciaOg({ gorila }: { gorila: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: COLOR.crema }}>
      <LogoOg gorila={gorila} escala={3} />
    </div>
  );
}
