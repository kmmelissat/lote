/** Los colores que más se ven en un logo, para ofrecerlos como marca. */

function hexDe(r: number, g: number, b: number) {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function muestrear(bitmap: ImageBitmap): string[] {
  const lado = 48;
  const lienzo = document.createElement("canvas");
  lienzo.width = lado;
  lienzo.height = lado;
  const ctx = lienzo.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(bitmap, 0, 0, lado, lado);
  const { data } = ctx.getImageData(0, 0, lado, lado);
  const cubetas = new Map<string, { n: number; r: number; g: number; b: number; sat: number }>();

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 140) continue;
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    if ((r + g + b) / 3 > 245) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = (max - min) / 255;
    const qr = Math.round(r / 24) * 24;
    const qg = Math.round(g / 24) * 24;
    const qb = Math.round(b / 24) * 24;
    const clave = `${qr},${qg},${qb}`;
    const c = cubetas.get(clave) ?? { n: 0, r: 0, g: 0, b: 0, sat: 0 };
    c.n += 1;
    c.r += r;
    c.g += g;
    c.b += b;
    c.sat += sat;
    cubetas.set(clave, c);
  }

  const ordenados = [...cubetas.values()]
    .map((c) => ({
      r: Math.round(c.r / c.n),
      g: Math.round(c.g / c.n),
      b: Math.round(c.b / c.n),
      peso: c.n * (0.35 + c.sat / c.n),
    }))
    .sort((a, b) => b.peso - a.peso);

  const elegidos: { r: number; g: number; b: number }[] = [];
  for (const c of ordenados) {
    if (elegidos.some((e) => Math.abs(e.r - c.r) + Math.abs(e.g - c.g) + Math.abs(e.b - c.b) < 80)) continue;
    elegidos.push(c);
    if (elegidos.length === 4) break;
  }
  return elegidos.map((c) => hexDe(c.r, c.g, c.b));
}

export async function coloresDeArchivo(archivo: File): Promise<string[]> {
  const bitmap = await createImageBitmap(archivo);
  try {
    return muestrear(bitmap);
  } finally {
    bitmap.close();
  }
}

export async function coloresDeUrl(src: string): Promise<string[]> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((ok, mal) => {
    img.onload = () => ok();
    img.onerror = () => mal(new Error("logo"));
    img.src = src;
  });
  const bitmap = await createImageBitmap(img);
  try {
    return muestrear(bitmap);
  } finally {
    bitmap.close();
  }
}
