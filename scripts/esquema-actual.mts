// Arma docs/esquema_actual.sql: la versión vigente de cada tabla, función, vista, política, trigger e índice, para
// no tener que recorrer supabase/*.sql buscando cuál definición ganó. Se lee, no se corre.
//
//   pnpm esquema
//
// Orden: el de "SQL en Supabase" en docs/PROGRESO.md; los archivos que no están ahí van después, por fecha de su
// primer commit (y los sin commit al final). cron.sql no está corrido y no entra.

import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";

const CARPETA = "supabase";
const SALIDA = "docs/esquema_actual.sql";
const NO_CORRIDOS = new Set(["cron"]);

// ---------- Orden de los archivos ----------

const existentes = readdirSync(CARPETA)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => f.slice(0, -4))
  .filter((n) => !NO_CORRIDOS.has(n));

const progreso = readFileSync("docs/PROGRESO.md", "utf8");
const seccion = progreso.split(/^## SQL en Supabase$/m)[1]?.split(/^## /m)[0] ?? "";
const listados = [...new Set([...seccion.matchAll(/`([a-z_0-9]+)`/g)].map((m) => m[1]))].filter((n) => existentes.includes(n));

const fechaCommit = new Map<string, number>();
let fecha = 0;
for (const linea of execSync(`git log --diff-filter=A --name-only --format=@%at -- ${CARPETA}`, { encoding: "utf8" }).split("\n")) {
  if (linea.startsWith("@")) fecha = Number(linea.slice(1));
  else if (linea.endsWith(".sql")) fechaCommit.set(linea.slice(CARPETA.length + 1, -4), fecha);
}
const fechaDe = (n: string) => fechaCommit.get(n) ?? statSync(`${CARPETA}/${n}.sql`).mtimeMs / 1000 + 1e10;
const porFecha = existentes.filter((n) => !listados.includes(n)).sort((a, b) => fechaDe(a) - fechaDe(b) || a.localeCompare(b));
const orden = [...listados, ...porFecha];

// Dos archivos sin lugar en PROGRESO.md que entraron en el mismo commit: no se sabe cuál se corrió último.
const ordenDudoso = (a: string, b: string) => porFecha.includes(a) && porFecha.includes(b) && fechaDe(a) === fechaDe(b);

// ---------- Partir el SQL en sentencias ----------

function sentencias(sql: string): string[] {
  const out: string[] = [];
  let inicio = 0;
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    if (c === "-" && sql[i + 1] === "-") {
      const fin = sql.indexOf("\n", i);
      i = fin === -1 ? sql.length : fin + 1;
    } else if (c === "/" && sql[i + 1] === "*") {
      const fin = sql.indexOf("*/", i + 2);
      i = fin === -1 ? sql.length : fin + 2;
    } else if (c === "'") {
      i++;
      while (i < sql.length && !(sql[i] === "'" && sql[i + 1] !== "'")) i += sql[i] === "'" ? 2 : 1;
      i++;
    } else if (c === '"') {
      const fin = sql.indexOf('"', i + 1);
      i = fin === -1 ? sql.length : fin + 1;
    } else if (c === "$" && /^\$(?:[A-Za-z_]\w*)?\$/.test(sql.slice(i, i + 64))) {
      const marca = /^\$(?:[A-Za-z_]\w*)?\$/.exec(sql.slice(i, i + 64))![0];
      const fin = sql.indexOf(marca, i + marca.length);
      i = fin === -1 ? sql.length : fin + marca.length;
    } else {
      if (c === ";") {
        out.push(sql.slice(inicio, i + 1));
        inicio = i + 1;
      }
      i++;
    }
  }
  out.push(sql.slice(inicio));
  return out.map(sinComentariosAlInicio).filter(Boolean);
}

function sinComentariosAlInicio(s: string): string {
  let t = s.trim();
  for (let m = /^(--[^\n]*(\n|$)|\/\*[\s\S]*?\*\/)/.exec(t); m; m = /^(--[^\n]*(\n|$)|\/\*[\s\S]*?\*\/)/.exec(t)) {
    t = t.slice(m[0].length).trim();
  }
  return t;
}

function partirComas(s: string): string[] {
  const partes: string[] = [];
  let nivel = 0;
  let actual = "";
  for (const c of s) {
    if (c === "(") nivel++;
    if (c === ")") nivel--;
    if (c === "," && nivel === 0) {
      partes.push(actual);
      actual = "";
    } else actual += c;
  }
  partes.push(actual);
  return partes.map((p) => p.trim()).filter(Boolean);
}

/** Lo que hay entre el paréntesis que abre en `desde` y el que lo cierra. */
function entreParentesis(s: string, desde: number): string {
  let nivel = 0;
  for (let i = desde; i < s.length; i++) {
    if (s[i] === "(") nivel++;
    if (s[i] === ")" && --nivel === 0) return s.slice(desde + 1, i);
  }
  return s.slice(desde + 1);
}

// ---------- Nombres y firmas ----------

const nombre = (s: string) => s.replace(/"/g, "").replace(/^public\./i, "").toLowerCase();

const ALIAS: Record<string, string> = {
  int: "integer",
  int4: "integer",
  int8: "bigint",
  bool: "boolean",
  timestamptz: "timestamp with time zone",
  varchar: "character varying",
  float8: "double precision",
};
const EMPIEZA_TIPO = new Set(["double", "timestamp", "character", "time", "bit", "interval"]);

/** Los tipos de entrada de una lista de parámetros: es lo que distingue una función de otra con el mismo nombre. */
function firma(params: string): string {
  return partirComas(params)
    .filter((p) => !/^out\s/i.test(p))
    .map((p) => {
      const tokens = p
        .replace(/\s+default\s[\s\S]*$/i, "")
        .replace(/\s*=[\s\S]*$/, "")
        .replace(/^(inout|in|variadic)\s+/i, "")
        .trim()
        .split(/\s+/);
      if (tokens.length > 1 && !EMPIEZA_TIPO.has(tokens[0].toLowerCase())) tokens.shift();
      const tipo = nombre(tokens.join(" ")).replace(/\(.*\)/, "");
      return tipo.endsWith("[]") ? (ALIAS[tipo.slice(0, -2)] ?? tipo.slice(0, -2)) + "[]" : (ALIAS[tipo] ?? tipo);
    })
    .join(", ");
}

// ---------- Recorrer y quedarse con lo último ----------

type Def = { sql: string; archivo: string; antes: string[] };
const funciones = new Map<string, Def>();
const vistas = new Map<string, Def>();
const politicas = new Map<string, Def>();
const triggers = new Map<string, Def>();
const indices = new Map<string, Def & { tabla: string }>();
const tablas = new Map<string, { archivo: string; partes: { sql: string; archivo: string }[] }>();
const dudas: string[] = [];

function guardar<T extends Def>(mapa: Map<string, T>, clave: string, valor: T) {
  const previa = mapa.get(clave);
  if (previa && previa.archivo !== valor.archivo && ordenDudoso(previa.archivo, valor.archivo)) {
    dudas.push(`${clave}: ${previa.archivo}.sql y ${valor.archivo}.sql entraron en el mismo commit`);
  }
  valor.antes = previa ? [...previa.antes, previa.archivo].filter((a, i, t) => a !== valor.archivo && t.indexOf(a) === i) : [];
  mapa.set(clave, valor);
}

const ID = String.raw`("[^"]+"|[\w.]+)`;
const SI_EXISTE = String.raw`(?:if\s+exists\s+)?`;

for (const archivo of orden) {
  for (const sql of sentencias(readFileSync(`${CARPETA}/${archivo}.sql`, "utf8"))) {
    let m: RegExpExecArray | null;
    if ((m = new RegExp(String.raw`^create\s+(?:or\s+replace\s+)?function\s+${ID}\s*\(`, "i").exec(sql))) {
      const clave = `${nombre(m[1])}(${firma(entreParentesis(sql, m[0].length - 1))})`;
      guardar(funciones, clave, { sql, archivo, antes: [] });
    } else if ((m = new RegExp(String.raw`^drop\s+function\s+${SI_EXISTE}([\s\S]+?)\s*(?:cascade|restrict)?\s*;?$`, "i").exec(sql))) {
      for (const f of partirComas(m[1])) {
        const abre = f.indexOf("(");
        if (abre === -1) {
          for (const clave of [...funciones.keys()]) if (clave.startsWith(`${nombre(f)}(`)) funciones.delete(clave);
        } else funciones.delete(`${nombre(f.slice(0, abre))}(${firma(entreParentesis(f, abre))})`);
      }
    } else if ((m = new RegExp(String.raw`^create\s+(?:or\s+replace\s+)?view\s+${ID}`, "i").exec(sql))) {
      guardar(vistas, nombre(m[1]), { sql, archivo, antes: [] });
    } else if ((m = new RegExp(String.raw`^drop\s+view\s+${SI_EXISTE}${ID}`, "i").exec(sql))) {
      vistas.delete(nombre(m[1]));
    } else if ((m = new RegExp(String.raw`^create\s+table\s+(?:if\s+not\s+exists\s+)?${ID}`, "i").exec(sql))) {
      tablas.set(nombre(m[1]), { archivo, partes: [{ sql, archivo }] });
    } else if ((m = new RegExp(String.raw`^alter\s+table\s+${SI_EXISTE}(?:only\s+)?${ID}`, "i").exec(sql))) {
      tablas.get(nombre(m[1]))?.partes.push({ sql, archivo });
    } else if ((m = new RegExp(String.raw`^drop\s+table\s+${SI_EXISTE}([\s\S]+?)\s*(?:cascade|restrict)?\s*;?$`, "i").exec(sql))) {
      for (const t of partirComas(m[1])) tablas.delete(nombre(t));
    } else if ((m = new RegExp(String.raw`^create\s+policy\s+${ID}\s+on\s+${ID}`, "i").exec(sql))) {
      guardar(politicas, `${nombre(m[2])} · ${m[1].replace(/"/g, "")}`, { sql, archivo, antes: [] });
    } else if ((m = new RegExp(String.raw`^drop\s+policy\s+${SI_EXISTE}${ID}\s+on\s+${ID}`, "i").exec(sql))) {
      politicas.delete(`${nombre(m[2])} · ${m[1].replace(/"/g, "")}`);
    } else if ((m = new RegExp(String.raw`^create\s+(?:or\s+replace\s+)?(?:constraint\s+)?trigger\s+${ID}[\s\S]*?\son\s+${ID}`, "i").exec(sql))) {
      guardar(triggers, `${nombre(m[2])} · ${nombre(m[1])}`, { sql, archivo, antes: [] });
    } else if ((m = new RegExp(String.raw`^drop\s+trigger\s+${SI_EXISTE}${ID}\s+on\s+${ID}`, "i").exec(sql))) {
      triggers.delete(`${nombre(m[2])} · ${nombre(m[1])}`);
    } else if ((m = new RegExp(String.raw`^create\s+(?:unique\s+)?index\s+(?:concurrently\s+)?(?:if\s+not\s+exists\s+)?${ID}\s+on\s+(?:only\s+)?${ID}`, "i").exec(sql))) {
      guardar(indices, nombre(m[1]), { sql, archivo, antes: [], tabla: nombre(m[2]) });
    } else if ((m = new RegExp(String.raw`^drop\s+index\s+${SI_EXISTE}${ID}`, "i").exec(sql))) {
      indices.delete(nombre(m[1]));
    }
  }
}

// ---------- Escribir ----------

const origen = (d: Def) => `-- ${d.archivo}.sql${d.antes.length ? ` (antes en: ${d.antes.map((a) => `${a}.sql`).join(", ")})` : ""}`;
const ordenados = <T,>(mapa: Map<string, T>) => [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b));
const titulo = (t: string) => ["", `-- ${"=".repeat(100)}`, `-- ${t}`, `-- ${"=".repeat(100)}`, ""];

const lineas = [
  "-- Esquema vigente, armado por scripts/esquema-actual.mts (pnpm esquema). NO se edita ni se corre: es para leer.",
  "-- La última versión de cada tabla (con sus alter table), función, vista, política, trigger e índice de supabase/*.sql.",
  "-- No incluye grant/revoke, datos (insert/update/delete) ni bloques do. Las columnas con sus tipos también están en",
  "-- src/lib/supabase/database.types.ts.",
  "--",
  `-- Orden usado: ${orden.join(", ")}.`,
  ...titulo(`TABLAS (${tablas.size})`),
  ...ordenados(tablas).flatMap(([t, { partes }]) => [`-- tabla ${t}`, ...partes.flatMap((p) => [`-- ${p.archivo}.sql`, p.sql]), ""]),
  ...titulo(`FUNCIONES (${funciones.size})`),
  ...ordenados(funciones).flatMap(([clave, d]) => [`-- función ${clave}`, origen(d), d.sql, ""]),
  ...titulo(`VISTAS (${vistas.size})`),
  ...ordenados(vistas).flatMap(([clave, d]) => [`-- vista ${clave}`, origen(d), d.sql, ""]),
  ...titulo(`POLÍTICAS (${politicas.size})`),
  ...ordenados(politicas).flatMap(([clave, d]) => [`-- política ${clave}`, origen(d), d.sql, ""]),
  ...titulo(`TRIGGERS (${triggers.size})`),
  ...ordenados(triggers).flatMap(([clave, d]) => [`-- trigger ${clave}`, origen(d), d.sql, ""]),
  ...titulo(`ÍNDICES (${indices.size})`),
  ...ordenados(indices).flatMap(([clave, d]) => [`-- índice ${clave} (tabla ${d.tabla})`, origen(d), d.sql, ""]),
];
writeFileSync(SALIDA, lineas.join("\n"));

console.log(
  `✓ ${SALIDA}: ${tablas.size} tablas, ${funciones.size} funciones, ${vistas.size} vistas, ${politicas.size} políticas, ${triggers.size} triggers, ${indices.size} índices`,
);
if (porFecha.length) console.log(`· No están en el orden de PROGRESO.md (van por fecha de commit): ${porFecha.join(", ")}`);
for (const d of dudas) console.warn(`  ¿Cuál ganó? ${d}`);

// Contra los tipos generados de la base: lo que está allá y no en ningún .sql se creó a mano en Supabase.
// (Al revés no se avisa por funciones: los tipos no traen las de trigger ni las internas.)
const tipos = readFileSync("src/lib/supabase/database.types.ts", "utf8").split(/\n  public: \{/)[1] ?? "";
const bloque = (desde: string, hasta: string) => tipos.split(new RegExp(String.raw`\n    ${desde}: \{`))[1]?.split(new RegExp(String.raw`\n    ${hasta}: `))[0] ?? "";
const claves = (s: string) => new Set([...s.matchAll(/^ {6}([a-z_0-9]+): /gm)].map((m) => m[1]));
const tablasBase = claves(bloque("Tables", "Views"));
const funcionesBase = claves(bloque("Functions", "Enums"));
const nombresFunciones = new Set([...funciones.keys()].map((k) => k.slice(0, k.indexOf("("))));
const sinArchivo = [
  ...[...tablasBase].filter((t) => !tablas.has(t)).map((t) => `tabla ${t}`),
  ...[...funcionesBase].filter((f) => !nombresFunciones.has(f)).map((f) => `función ${f}`),
];
const sinBase = [...tablas.keys()].filter((t) => tablasBase.size && !tablasBase.has(t)).map((t) => `tabla ${t}`);
if (sinArchivo.length) console.warn(`  En la base pero en ningún .sql: ${sinArchivo.join(", ")}`);
if (sinBase.length) console.warn(`  En los .sql pero no en database.types.ts (¿se borró a mano o faltan regenerar los tipos?): ${sinBase.join(", ")}`);
