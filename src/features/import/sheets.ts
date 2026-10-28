// Importar desde una hoja de Google: el servidor baja la hoja como CSV. Solo se acepta un enlace de
// docs.google.com y la dirección de descarga la armamos nosotros, nunca se usa el texto pegado tal cual:
// si no, esta función serviría para pedirle al servidor que visite cualquier dirección.

const ENLACE = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([A-Za-z0-9_-]{20,})(?:[/?#]|$)/;
const MAXIMO_BYTES = 2_000_000;

/** La dirección de descarga en CSV de una hoja pública, o null si no es un enlace de Google Sheets. */
export function urlDeExportacion(enlace: string): string | null {
  const texto = enlace.trim();
  const id = ENLACE.exec(texto)?.[1];
  if (!id) return null;
  // La pestaña viene en el enlace como gid=123; sin ella Google entrega la primera.
  const gid = /[#&?]gid=(\d{1,12})(?:&|$)/.exec(texto)?.[1];
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv${gid ? `&gid=${gid}` : ""}`;
}

export type ResultadoDescarga =
  | { ok: true; csv: string }
  | { ok: false; error: "privada" | "grande" | "red" };

/** Baja el CSV. `pedir` se inyecta para poder probarlo sin red. */
export async function descargarCsv(url: string, pedir: typeof fetch = fetch): Promise<ResultadoDescarga> {
  let r: Response;
  try {
    r = await pedir(url, { signal: AbortSignal.timeout(10_000), redirect: "follow" });
  } catch {
    return { ok: false, error: "red" };
  }
  // Una hoja privada no da error: Google manda una página de inicio de sesión (HTML) o rechaza.
  if (r.status === 401 || r.status === 403 || r.status === 404) return { ok: false, error: "privada" };
  if (!r.ok) return { ok: false, error: "red" };
  if (!(r.headers.get("content-type") ?? "").toLowerCase().includes("csv")) return { ok: false, error: "privada" };

  const declarado = Number(r.headers.get("content-length") ?? 0);
  if (declarado > MAXIMO_BYTES) return { ok: false, error: "grande" };
  const csv = await r.text();
  if (csv.length > MAXIMO_BYTES) return { ok: false, error: "grande" };
  return { ok: true, csv };
}
