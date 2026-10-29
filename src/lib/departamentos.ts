// Los 14 departamentos de El Salvador, para las tarifas de envío y la dirección del pedido.
export const DEPARTAMENTOS = [
  "Ahuachapán",
  "Cabañas",
  "Chalatenango",
  "Cuscatlán",
  "La Libertad",
  "La Paz",
  "La Unión",
  "Morazán",
  "San Miguel",
  "San Salvador",
  "San Vicente",
  "Santa Ana",
  "Sonsonate",
  "Usulután",
] as const;

export type Departamento = (typeof DEPARTAMENTOS)[number];

export const esDepartamento = (s: unknown): s is Departamento =>
  DEPARTAMENTOS.includes(s as Departamento);

/** Los 44 municipios desde la reforma de 2024 (los de antes ahora son distritos), por departamento. */
export const MUNICIPIOS: Record<Departamento, readonly string[]> = {
  Ahuachapán: ["Ahuachapán Norte", "Ahuachapán Centro", "Ahuachapán Sur"],
  Cabañas: ["Cabañas Este", "Cabañas Oeste"],
  Chalatenango: ["Chalatenango Norte", "Chalatenango Centro", "Chalatenango Sur"],
  Cuscatlán: ["Cuscatlán Norte", "Cuscatlán Sur"],
  "La Libertad": ["La Libertad Norte", "La Libertad Centro", "La Libertad Oeste", "La Libertad Este", "La Libertad Costa", "La Libertad Sur"],
  "La Paz": ["La Paz Oeste", "La Paz Centro", "La Paz Este"],
  "La Unión": ["La Unión Norte", "La Unión Sur"],
  Morazán: ["Morazán Norte", "Morazán Sur"],
  "San Miguel": ["San Miguel Norte", "San Miguel Centro", "San Miguel Oeste"],
  "San Salvador": ["San Salvador Norte", "San Salvador Oeste", "San Salvador Este", "San Salvador Centro", "San Salvador Sur"],
  "San Vicente": ["San Vicente Norte", "San Vicente Sur"],
  "Santa Ana": ["Santa Ana Norte", "Santa Ana Centro", "Santa Ana Este", "Santa Ana Oeste"],
  Sonsonate: ["Sonsonate Norte", "Sonsonate Centro", "Sonsonate Este", "Sonsonate Oeste"],
  Usulután: ["Usulután Norte", "Usulután Este", "Usulután Oeste"],
};

export const esMunicipioDe = (departamento: Departamento, municipio: unknown): municipio is string =>
  MUNICIPIOS[departamento].includes(municipio as string);

/**
 * Dónde entrega la tienda. null: en todo el país. Si no, los departamentos donde entrega, cada uno con
 * sus municipios; una lista vacía es el departamento entero.
 */
export type ZonasEntrega = Partial<Record<Departamento, string[]>> | null;

/** Lo que guarda la base (jsonb) → zonas válidas: se descarta lo que no sea un departamento o municipio real. */
export function leerZonas(crudo: unknown): ZonasEntrega {
  if (crudo === null || typeof crudo !== "object" || Array.isArray(crudo)) return null;
  const zonas: Partial<Record<Departamento, string[]>> = {};
  for (const [d, municipios] of Object.entries(crudo)) {
    if (!esDepartamento(d) || !Array.isArray(municipios)) continue;
    const validos = [...new Set(municipios.filter((m) => esMunicipioDe(d, m)))];
    // Con todos los municipios marcados es lo mismo que el departamento entero
    zonas[d] = validos.length === MUNICIPIOS[d].length ? [] : validos;
  }
  return zonas;
}

/**
 * ¿La tienda entrega en esa dirección? "si", "no", o "depende" cuando solo entrega en algunos municipios
 * del departamento y todavía no se eligió el municipio.
 */
export function entregaEn(zonas: ZonasEntrega, departamento: string, municipio?: string | null): "si" | "no" | "depende" {
  if (zonas === null) return "si";
  if (!esDepartamento(departamento)) return "no";
  const municipios = zonas[departamento];
  if (!municipios) return "no";
  if (municipios.length === 0) return "si";
  if (!municipio) return "depende";
  return municipios.includes(municipio) ? "si" : "no";
}

/** "San Salvador, La Libertad (Sur y Centro)": para decir en una línea dónde entrega la tienda. */
export function resumenZonas(zonas: Exclude<ZonasEntrega, null>): string {
  return DEPARTAMENTOS.filter((d) => zonas[d])
    .map((d) => {
      const m = zonas[d]!;
      if (!m.length) return d;
      const partes = m.map((x) => x.slice(d.length).trim() || x);
      return `${d} (${partes.length > 1 ? `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}` : partes[0]})`;
    })
    .join(", ");
}
