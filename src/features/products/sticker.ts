// Sticker "VENDIDO" para stories: la foto del producto con una cinta encima. Se dibuja en el navegador
// (un canvas lee WebP sin problema y usa la tipografía de la app); nada de esto sale a ningún servidor.

export const ANCHO = 1080;
export const ALTO = 1920;

/** Parte un texto en hasta `maxLineas` líneas que quepan en `ancho`; la última termina en "…" si sobra texto. */
export function partirEnLineas(
  medir: (texto: string) => number,
  texto: string,
  ancho: number,
  maxLineas: number,
): string[] {
  const palabras = texto.trim().split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = "";
  let i = 0;
  for (; i < palabras.length; i++) {
    const prueba = actual ? `${actual} ${palabras[i]}` : palabras[i];
    if (medir(prueba) <= ancho || !actual) actual = prueba;
    else {
      if (lineas.length === maxLineas - 1) break;
      lineas.push(actual);
      actual = palabras[i];
    }
  }
  // Lo que no entró en la última línea se recorta con puntos suspensivos.
  const resto = palabras.slice(i).join(" ");
  let ultima = resto && lineas.length === maxLineas - 1 ? `${actual} ${resto}` : actual;
  if (medir(ultima) > ancho) {
    while (ultima.length > 1 && medir(`${ultima}…`) > ancho) ultima = ultima.slice(0, -1);
    ultima = `${ultima.trimEnd()}…`;
  }
  if (ultima) lineas.push(ultima);
  return lineas;
}

export type DatosSticker = {
  negocio: string;
  nombre: string;
  codigo: number;
  etiqueta: string;
  marca: string;
};

export type Colores = { fondo: string; cinta: string; textoCinta: string; texto: string; suave: string };

function recorteRedondo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();
}

export function dibujarSticker(
  ctx: CanvasRenderingContext2D,
  foto: HTMLImageElement,
  d: DatosSticker,
  colores: Colores,
  fuente: string,
): void {
  const fx = 90;
  const fy = 260;
  const lado = ANCHO - fx * 2;

  ctx.fillStyle = colores.fondo;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = colores.suave;
  ctx.font = `700 56px ${fuente}`;
  ctx.fillText(d.negocio, ANCHO / 2, 150, lado);

  // La foto llena el marco recortada al centro (sin deformarla).
  ctx.save();
  recorteRedondo(ctx, fx, fy, lado, lado, 48);
  const escala = Math.max(lado / foto.naturalWidth, lado / foto.naturalHeight);
  const sw = lado / escala;
  const sh = lado / escala;
  ctx.drawImage(foto, (foto.naturalWidth - sw) / 2, (foto.naturalHeight - sh) / 2, sw, sh, fx, fy, lado, lado);
  ctx.restore();

  // La cinta cruza la foto en diagonal.
  ctx.save();
  ctx.translate(ANCHO / 2, fy + lado / 2);
  ctx.rotate((-8 * Math.PI) / 180);
  ctx.fillStyle = colores.cinta;
  ctx.fillRect(-ANCHO, -130, ANCHO * 2, 260);
  ctx.fillStyle = colores.textoCinta;
  ctx.font = `700 190px ${fuente}`;
  ctx.fillText(d.etiqueta, 0, 8);
  ctx.restore();

  ctx.fillStyle = colores.texto;
  ctx.font = `700 72px ${fuente}`;
  const lineas = partirEnLineas((s) => ctx.measureText(s).width, d.nombre, lado, 2);
  lineas.forEach((linea, i) => ctx.fillText(linea, ANCHO / 2, 1290 + i * 90));

  ctx.fillStyle = colores.suave;
  ctx.font = `500 48px ${fuente}`;
  ctx.fillText(`#${d.codigo}`, ANCHO / 2, 1290 + lineas.length * 90 + 30);

  ctx.font = `700 44px ${fuente}`;
  ctx.fillText(d.marca, ANCHO / 2, ALTO - 110);
}
