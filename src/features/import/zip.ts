// ZIP mínimo para leer un .xlsx (que es un zip de XML). Solo STORE y DEFLATE; sin ZIP64.

const LOCAL = 0x04034b50;
const CENTRAL = 0x02014b50;
const EOCD = 0x06054b50;

const u16 = (v: DataView, o: number) => v.getUint16(o, true);
const u32 = (v: DataView, o: number) => v.getUint32(o, true);

function finDelZip(bytes: Uint8Array, view: DataView): number {
  const min = Math.max(0, bytes.length - 22 - 65_535);
  for (let i = bytes.length - 22; i >= min; i--) {
    if (view.getUint32(i, true) === EOCD) return i;
  }
  throw new Error("zip");
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Archivos de un zip, por ruta con `/`. */
export async function unzip(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const fin = finDelZip(bytes, view);
  const n = u16(view, fin + 10);
  let off = u32(view, fin + 16);
  const archivos = new Map<string, Uint8Array>();
  const dec = new TextDecoder();

  for (let i = 0; i < n; i++) {
    if (u32(view, off) !== CENTRAL) throw new Error("zip");
    const metodo = u16(view, off + 10);
    const comprimido = u32(view, off + 20);
    const nombreLen = u16(view, off + 28);
    const extraLen = u16(view, off + 30);
    const commentLen = u16(view, off + 32);
    const localOff = u32(view, off + 42);
    const nombre = dec.decode(bytes.subarray(off + 46, off + 46 + nombreLen)).replace(/\\/g, "/");
    off += 46 + nombreLen + extraLen + commentLen;
    if (nombre.endsWith("/")) continue;
    if (u32(view, localOff) !== LOCAL) throw new Error("zip");

    const dataOff = localOff + 30 + u16(view, localOff + 26) + u16(view, localOff + 28);
    const payload = bytes.subarray(dataOff, dataOff + comprimido);
    const contenido = metodo === 0 ? payload.slice() : metodo === 8 ? await inflate(payload) : null;
    if (!contenido) throw new Error("zip");
    archivos.set(nombre, contenido);
  }
  return archivos;
}
