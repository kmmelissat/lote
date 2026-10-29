// Tiendas y productos de mentira para probar Explorar y las vitrinas sin cargarlos a mano.
//
//   pnpm semilla           crea las tiendas que falten (las que ya existen se saltan)
//   pnpm semilla --borrar  borra todo lo que creó: tiendas, productos, fotos y usuarias
//   pnpm semilla --entrar bambu-boutique
//                          un enlace para entrar al panel como la dueña de esa tienda (abrilo en una ventana
//                          privada, así no se pierde tu sesión) y cambiar fotos o lo que sea desde Editar
//   pnpm semilla --fotos-ia patitas-felices
//                          cambia las fotos y el logo de esa tienda por unos hechos con IA (OPENAI_API_KEY de .env.local)
//   pnpm semilla --logo-ia patitas-felices
//                          solo el logo
//
// Usa la llave de servicio de .env.local: crea a cada dueña (semilla+<tienda>@lote.test, sin contraseña) y
// arma la tienda igual que crear_negocio y crear_producto. Las fotos son de Wikimedia Commons, buscadas por tema
// (si no aparece ninguna, una de picsum al azar).

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import sharp from "sharp";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !llave) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
const supabase = createClient(url, llave, { auth: { persistSession: false, autoRefreshToken: false } });

const correoDe = (slug: string) => `semilla+${slug}@lote.test`;
const esSemilla = (correo?: string) => !!correo && correo.startsWith("semilla+") && correo.endsWith("@lote.test");

// ---------------------------------------------------------------- datos

type Variante = { etiqueta: string; cantidad: number; precio?: number; tema?: string };
type Producto = {
  nombre: string;
  precio: number;
  costo: number;
  cantidad?: number;
  categoria: string;
  descripcion: string;
  /** Qué buscar para la foto, en inglés salvo lo de aquí ("floral dress", "quesadilla salvadoreña") */
  tema: string;
  marca?: string;
  usado?: string;
  antes?: number;
  envio?: number;
  detalles?: [string, string][];
  variantes?: { opcion: string; valores: Variante[] };
};
type Tienda = {
  slug: string;
  nombre: string;
  frase: string;
  color: string;
  instagram: string;
  whatsapp: string;
  entrega: string;
  cambios: string;
  envio: number;
  comprar?: boolean;
  apartar?: boolean;
  zonas?: Record<string, string[]>;
  productos: Producto[];
};

const TIENDAS: Tienda[] = [
  {
    slug: "bambu-boutique",
    nombre: "Bambú Boutique",
    frase: "Ropa fresca y cómoda para el calor de aquí",
    color: "#db2777",
    instagram: "bambu.boutique.sv",
    whatsapp: "+503 7012-3456",
    entrega: "Sale en 24 h",
    cambios: "Cambios de talla en 3 días, con etiqueta",
    envio: 3.5,
    zonas: { "San Salvador": [], "La Libertad": [] },
    productos: [
      {
        nombre: "Vestido floral midi",
        precio: 24,
        costo: 11,
        categoria: "Vestidos",
        descripcion: "Vestido de tela fresca con estampado de flores, tirantes ajustables y forro.",
        tema: "floral summer dress",
        detalles: [["Material", "Viscosa"], ["Largo", "Midi"]],
        variantes: { opcion: "Talla", valores: [{ etiqueta: "S", cantidad: 3 }, { etiqueta: "M", cantidad: 4 }, { etiqueta: "L", cantidad: 2 }] },
      },
      {
        nombre: "Blusa de lino",
        precio: 16,
        costo: 7,
        categoria: "Blusas",
        descripcion: "Blusa holgada de lino, perfecta para el día a día.",
        tema: "woman blouse",
        variantes: {
          opcion: "Color",
          valores: [
            { etiqueta: "Blanco", cantidad: 5, tema: "white shirt woman" },
            { etiqueta: "Beige", cantidad: 3, tema: "beige shirt" },
            { etiqueta: "Verde olivo", cantidad: 2, tema: "green shirt woman" },
          ],
        },
      },
      { nombre: "Jeans mom fit", precio: 22, costo: 10, cantidad: 6, categoria: "Pantalones", descripcion: "Tiro alto, corte recto y tela que no destiñe.", tema: "jeans", marca: "Levi's", antes: 28 },
      { nombre: "Sandalias trenzadas", precio: 18, costo: 8, cantidad: 4, categoria: "Calzado", descripcion: "Sandalias planas de cuero sintético trenzado.", tema: "sandals" },
      { nombre: "Bolso de palma tejido", precio: 15, costo: 6, cantidad: 7, categoria: "Accesorios", descripcion: "Hecho a mano en Nahuizalco. Cabe todo lo de la playa.", tema: "woven straw bag", detalles: [["Hecho en", "Nahuizalco"]] },
      { nombre: "Aretes dorados de argolla", precio: 8, costo: 2.5, cantidad: 12, categoria: "Accesorios", descripcion: "Argollas medianas de acero inoxidable bañado en oro.", tema: "gold earrings" },
      { nombre: "Falda plisada", precio: 19, costo: 8, cantidad: 3, categoria: "Faldas", descripcion: "Falda plisada a media pierna con cintura elástica.", tema: "pleated skirt woman" },
      { nombre: "Camisa oversize de mezclilla", precio: 14, costo: 4, cantidad: 1, categoria: "Blusas", descripcion: "De segunda mano, en muy buen estado.", tema: "denim shirt", usado: "Como nueva, sin manchas", marca: "Zara" },
    ],
  },
  {
    slug: "cafe-de-la-abuela",
    nombre: "Café de la Abuela",
    frase: "Café de altura y pan dulce hecho en casa",
    color: "#c8460a",
    instagram: "cafedelaabuela.sv",
    whatsapp: "+503 7123-9876",
    entrega: "Listo el mismo día",
    cambios: "No se aceptan cambios en comida",
    envio: 2.5,
    zonas: { "San Salvador": [], "Santa Ana": [] },
    productos: [
      {
        nombre: "Café molido de Apaneca",
        precio: 9,
        costo: 4,
        categoria: "Café",
        descripcion: "Una libra de café 100 % arábica de la Ruta de las Flores.",
        tema: "coffee beans",
        detalles: [["Peso", "1 lb"], ["Origen", "Apaneca"]],
        variantes: { opcion: "Tueste", valores: [{ etiqueta: "Medio", cantidad: 10 }, { etiqueta: "Oscuro", cantidad: 8 }] },
      },
      {
        nombre: "Galletas de avena",
        precio: 4,
        costo: 1.5,
        categoria: "Repostería",
        descripcion: "Bolsa de 8 galletas suaves, horneadas cada mañana.",
        tema: "cookies",
        variantes: {
          opcion: "Sabor",
          valores: [
            { etiqueta: "Pasas", cantidad: 6, tema: "oatmeal cookies" },
            { etiqueta: "Chocolate", cantidad: 9, precio: 4.5, tema: "chocolate cookies" },
            { etiqueta: "Coco", cantidad: 4, tema: "coconut cookies" },
          ],
        },
      },
      { nombre: "Quesadilla salvadoreña", precio: 6, costo: 2.2, cantidad: 5, categoria: "Repostería", descripcion: "La de siempre, con queso duro y ajonjolí. Entera, para 8 porciones.", tema: "quesadilla salvadoreña" },
      { nombre: "Pan dulce surtido", precio: 3, costo: 1, cantidad: 15, categoria: "Repostería", descripcion: "Seis piezas: salpores, peperechas y semitas.", tema: "pan dulce" },
      { nombre: "Miel de abeja pura", precio: 7, costo: 3.5, cantidad: 8, categoria: "Despensa", descripcion: "Frasco de 500 g, de apiarios de Chalatenango.", tema: "honey jar" },
      { nombre: "Taza de barro de Ilobasco", precio: 6.5, costo: 2.5, cantidad: 10, categoria: "Accesorios", descripcion: "Pintada a mano. Cada una es distinta.", tema: "clay mug" },
      { nombre: "Chocolate de mesa", precio: 5, costo: 2, cantidad: 12, categoria: "Despensa", descripcion: "Tabletas de cacao con canela para chocolate caliente.", tema: "chocolate tablet cinnamon", antes: 6 },
    ],
  },
  {
    slug: "disco-retro-sv",
    nombre: "Disco Retro SV",
    frase: "Vinilos usados revisados uno por uno",
    color: "#7c3aed",
    instagram: "discoretro.sv",
    whatsapp: "+503 7555-0101",
    entrega: "Sale en 48 h",
    cambios: "Si el disco salta, te lo cambiamos",
    envio: 4,
    apartar: true,
    comprar: false,
    productos: [
      { nombre: "Soda Stereo — Canción animal", precio: 35, costo: 18, cantidad: 1, categoria: "Rock en español", descripcion: "Edición argentina de 1990.", tema: "vinyl record", usado: "Funda con desgaste, disco sin rayones" },
      { nombre: "Los Hermanos Flores — Éxitos", precio: 20, costo: 8, cantidad: 2, categoria: "Cumbia", descripcion: "Para las fiestas de fin de año.", tema: "vinyl record sleeve", usado: "Muy buen estado" },
      { nombre: "Queen — A Night at the Opera", precio: 40, costo: 22, cantidad: 1, categoria: "Rock", descripcion: "Reedición de 2015, 180 g.", tema: "LP record", usado: "Como nuevo" },
      { nombre: "Juan Gabriel — Recuerdos II", precio: 18, costo: 7, cantidad: 2, categoria: "Baladas", descripcion: "Incluye 'Querida'.", tema: "vinyl records stack", usado: "Pequeño raspón en el lado B" },
      { nombre: "Daft Punk — Random Access Memories", precio: 45, costo: 28, cantidad: 1, categoria: "Electrónica", descripcion: "Doble vinilo con libreto.", tema: "vinyl record collection", usado: "Abierto una vez" },
      { nombre: "Tocadiscos portátil", precio: 65, costo: 38, cantidad: 3, categoria: "Equipo", descripcion: "Tocadiscos de maleta con bocinas incluidas, tres velocidades.", tema: "turntable", marca: "Crosley" },
      { nombre: "Fundas protectoras (pack de 20)", precio: 8, costo: 3, cantidad: 20, categoria: "Equipo", descripcion: "Fundas plásticas para LP de 12 pulgadas.", tema: "record sleeves" },
    ],
  },
  {
    slug: "verde-hogar",
    nombre: "Verde Hogar",
    frase: "Plantas que aguantan el calor (y a quien se le olvida regarlas)",
    color: "#15803d",
    instagram: "verdehogar.sv",
    whatsapp: "+503 7890-1122",
    entrega: "Entregas martes y viernes",
    cambios: "Si llega dañada, te mandamos otra",
    envio: 3,
    zonas: { "San Salvador": [], "La Libertad": ["La Libertad Sur", "La Libertad Este"] },
    productos: [
      {
        nombre: "Suculenta en maceta de barro",
        precio: 5,
        costo: 2,
        categoria: "Suculentas",
        descripcion: "Suculentas variadas, ya trasplantadas y listas para regalar.",
        tema: "succulent pot",
        variantes: {
          opcion: "Tamaño",
          valores: [
            { etiqueta: "Pequeña", cantidad: 12 },
            { etiqueta: "Mediana", cantidad: 8, precio: 8 },
            { etiqueta: "Grande", cantidad: 4, precio: 12 },
          ],
        },
      },
      { nombre: "Monstera deliciosa", precio: 25, costo: 12, cantidad: 3, categoria: "Interior", descripcion: "De 60 cm aprox., en maceta plástica de 8 pulgadas.", tema: "monstera plant", detalles: [["Luz", "Indirecta"], ["Riego", "Cada 7 días"]] },
      { nombre: "Pothos dorado colgante", precio: 10, costo: 4, cantidad: 6, categoria: "Interior", descripcion: "Ideal para repisas; crece rápido y casi no pide nada.", tema: "pothos plant" },
      { nombre: "Cactus San Pedro", precio: 7, costo: 3, cantidad: 9, categoria: "Suculentas", descripcion: "Cactus columnar de 30 cm.", tema: "cactus" },
      { nombre: "Maceta de cemento pintada", precio: 9, costo: 3.5, cantidad: 7, categoria: "Macetas", descripcion: "Hecha a mano, con agujero de drenaje.", tema: "concrete planter" },
      { nombre: "Kit de riego", precio: 12, costo: 5, cantidad: 5, categoria: "Accesorios", descripcion: "Regadera pequeña, atomizador y abono orgánico.", tema: "watering can", antes: 15 },
      { nombre: "Lengua de suegra", precio: 14, costo: 6, cantidad: 4, categoria: "Interior", descripcion: "Purifica el aire y aguanta poca luz.", tema: "snake plant" },
      { nombre: "Orquídea blanca", precio: 20, costo: 9, cantidad: 2, categoria: "Flores", descripcion: "Phalaenopsis en flor, con base decorativa.", tema: "orchid" },
    ],
  },
  {
    slug: "pixel-gadgets",
    nombre: "Pixel Gadgets",
    frase: "Accesorios de tecnología con garantía",
    color: "#2563eb",
    instagram: "pixelgadgets.sv",
    whatsapp: "+503 7333-4545",
    entrega: "Sale en 24 h",
    cambios: "30 días de garantía por defecto de fábrica",
    envio: 3,
    productos: [
      {
        nombre: "Audífonos inalámbricos",
        precio: 29,
        costo: 14,
        categoria: "Audio",
        descripcion: "Bluetooth 5.3, estuche de carga y 24 h de batería.",
        tema: "earbuds",
        marca: "Soundcore",
        variantes: {
          opcion: "Color",
          valores: [
            { etiqueta: "Negro", cantidad: 6, tema: "black earbuds" },
            { etiqueta: "Blanco", cantidad: 4, tema: "white earbuds" },
          ],
        },
      },
      {
        nombre: "Funda de silicón para iPhone",
        precio: 9,
        costo: 2.5,
        categoria: "Fundas",
        descripcion: "Silicón suave por dentro, protege la cámara.",
        tema: "phone case",
        variantes: {
          opcion: "Modelo",
          valores: [
            { etiqueta: "iPhone 13", cantidad: 5 },
            { etiqueta: "iPhone 14", cantidad: 7 },
            { etiqueta: "iPhone 15", cantidad: 6 },
          ],
        },
      },
      { nombre: "Cargador rápido 20 W", precio: 12, costo: 5, cantidad: 15, categoria: "Carga", descripcion: "USB-C con entrega de potencia.", tema: "charger usb" },
      { nombre: "Parlante bluetooth resistente al agua", precio: 35, costo: 18, cantidad: 4, categoria: "Audio", descripcion: "Para la playa o la piscina. 12 h de batería.", tema: "bluetooth speaker", marca: "JBL", antes: 42, envio: 1 },
      { nombre: "Reloj inteligente", precio: 39, costo: 20, cantidad: 3, categoria: "Relojes", descripcion: "Mide pasos, ritmo cardíaco y sueño. Notificaciones de WhatsApp.", tema: "smartwatch" },
      { nombre: "Mouse inalámbrico silencioso", precio: 11, costo: 4.5, cantidad: 8, categoria: "Computadora", descripcion: "Clic silencioso y receptor USB.", tema: "computer mouse", marca: "Logitech" },
      { nombre: "Soporte para laptop", precio: 18, costo: 8, cantidad: 5, categoria: "Computadora", descripcion: "Aluminio, plegable y con seis alturas.", tema: "laptop stand" },
      { nombre: "iPad 9 usado", precio: 180, costo: 130, cantidad: 1, categoria: "Tablets", descripcion: "64 GB, wifi. Con cargador original.", tema: "iPad", usado: "Batería al 88 %, pantalla sin rayones", marca: "Apple" },
    ],
  },
  {
    slug: "patitas-felices",
    nombre: "Patitas Felices",
    frase: "Todo para consentir a tu perro o gato",
    color: "#007f77",
    instagram: "patitasfelices.sv",
    whatsapp: "+503 7444-8899",
    entrega: "Sale en 24 h",
    cambios: "Cambios de talla en collares y arneses",
    envio: 2.5,
    comprar: false,
    apartar: false,
    productos: [
      {
        nombre: "Collar ajustable con nombre",
        precio: 10,
        costo: 3.5,
        categoria: "Collares",
        descripcion: "Bordamos el nombre de tu mascota sin costo extra.",
        tema: "dog collar",
        variantes: { opcion: "Talla", valores: [{ etiqueta: "S", cantidad: 6 }, { etiqueta: "M", cantidad: 8 }, { etiqueta: "L", cantidad: 4 }] },
      },
      { nombre: "Cama redonda acolchada", precio: 28, costo: 13, cantidad: 4, categoria: "Camas", descripcion: "Lavable, de 60 cm de diámetro.", tema: "dog bed" },
      { nombre: "Snacks de pollo deshidratado", precio: 6, costo: 2.5, cantidad: 20, categoria: "Comida", descripcion: "Sin preservantes, bolsa de 200 g.", tema: "dog treats" },
      { nombre: "Rascador para gato", precio: 24, costo: 11, cantidad: 3, categoria: "Gatos", descripcion: "Dos niveles con bolita colgante.", tema: "cat scratching post" },
      { nombre: "Juguete de cuerda", precio: 5, costo: 1.5, cantidad: 15, categoria: "Juguetes", descripcion: "Para morder y jalar, ayuda a limpiar los dientes.", tema: "dog toy" },
      { nombre: "Arnés antitirones", precio: 16, costo: 6.5, cantidad: 5, categoria: "Collares", descripcion: "Acolchado, con argolla al frente y en la espalda.", tema: "dog harness", antes: 20 },
      { nombre: "Plato doble de acero", precio: 9, costo: 3.5, cantidad: 8, categoria: "Accesorios", descripcion: "Base antideslizante, para agua y comida.", tema: "dog bowl" },
    ],
  },
];

// ---------------------------------------------------------------- fotos

// Wikimedia pide que cada programa se presente
const AGENTE = { "User-Agent": "lote-semilla/1.0 (proyecto de clase; datos de prueba)" };
// Piezas de museo, dibujos y hallazgos arqueológicos: no parecen productos de una tienda
const NO_PARECE_PRODUCTO = /\bMET\b|museum|FindID|\(AM |painting|drawing|engraving|illustration|\.svg/i;
const usadas = new Set<string>();

/** Fotos de Wikimedia Commons para el tema, en el orden en que las encuentra, sin las ya usadas. */
async function buscarEnCommons(tema: string): Promise<string[]> {
  const q = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `filetype:bitmap ${tema}`,
    gsrnamespace: "6",
    gsrlimit: "15",
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: "1024",
    format: "json",
  });
  try {
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?${q}`, { headers: AGENTE, signal: AbortSignal.timeout(20_000) });
    const d = (await r.json()) as { query?: { pages?: Record<string, { title: string; index: number; imageinfo?: { thumburl?: string }[] }> } };
    return Object.values(d.query?.pages ?? {})
      .sort((a, b) => a.index - b.index)
      .filter((p) => !NO_PARECE_PRODUCTO.test(p.title))
      .flatMap((p) => p.imageinfo?.[0]?.thumburl ?? [])
      .filter((u) => !usadas.has(u));
  } catch {
    return [];
  }
}

/** Baja una foto del tema, la pasa a webp y la sube al bucket. Si ninguna fuente responde, el producto queda sin foto. */
async function subirFoto(negocioId: string, tema: string): Promise<string | null> {
  const fuentes = [...(await buscarEnCommons(tema)).slice(0, 4), `https://picsum.photos/seed/${encodeURIComponent(`${tema}-${usadas.size}`)}/900/900`];
  for (const fuente of fuentes) {
    try {
      const r = await fetch(fuente, { headers: AGENTE, redirect: "follow", signal: AbortSignal.timeout(30_000) });
      if (!r.ok) continue;
      const webp = await sharp(Buffer.from(await r.arrayBuffer())).resize(1024, 1024, { fit: "cover" }).webp({ quality: 82 }).toBuffer();
      const ruta = `${negocioId}/${randomUUID()}.webp`;
      const { error } = await supabase.storage.from("productos").upload(ruta, webp, { contentType: "image/webp" });
      if (error) throw error;
      usadas.add(fuente);
      return ruta;
    } catch {
      // Se prueba la siguiente fuente
    }
  }
  console.warn(`   sin foto para "${tema}"`);
  return null;
}

/** Un logo simple: la inicial en blanco sobre el color de la tienda. */
async function subirLogo(negocioId: string, nombre: string, color: string): Promise<string | null> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <rect width="512" height="512" rx="128" fill="${color}"/>
    <text x="256" y="256" dy="0.35em" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="280" fill="#ffffff">${nombre[0]}</text>
  </svg>`;
  const ruta = `${negocioId}/logo-${randomUUID()}.webp`;
  const webp = await sharp(Buffer.from(svg)).webp({ quality: 90 }).toBuffer();
  const { error } = await supabase.storage.from("productos").upload(ruta, webp, { contentType: "image/webp" });
  return error ? null : ruta;
}

// ---------------------------------------------------------------- crear

const haceDias = (dias: number) => new Date(Date.now() - dias * 86_400_000).toISOString();

async function crearTienda(t: Tienda) {
  const { data: existe } = await supabase.from("negocio").select("id").eq("slug", t.slug).maybeSingle();
  if (existe) {
    console.log(`· ${t.nombre}: ya existe, la salto`);
    return;
  }
  console.log(`· ${t.nombre}`);

  const { data: cuenta, error: errorCuenta } = await supabase.auth.admin.createUser({ email: correoDe(t.slug), email_confirm: true });
  if (errorCuenta || !cuenta.user) throw errorCuenta ?? new Error("No se creó la usuaria");

  const comprar = t.comprar ?? true;
  const apartar = t.apartar ?? true;
  const { data: negocio, error } = await supabase
    .from("negocio")
    .insert({
      nombre: t.nombre,
      slug: t.slug,
      descripcion: t.frase,
      color: t.color,
      usuario_instagram: t.instagram,
      whatsapp: t.whatsapp,
      tiempo_entrega: t.entrega,
      politica_cambios: t.cambios,
      tarifa_envio_defecto: t.envio,
      zonas_entrega: t.zonas ?? null,
      permite_comprar: comprar,
      permite_apartar: apartar,
      apartar_desde_vitrina: comprar || apartar,
      visible_en_explorar: true,
      vitrina_activa: true,
    })
    .select("id")
    .single();
  if (error) throw error;
  const negocioId: string = negocio.id;

  await supabase.from("miembro").insert({ negocio_id: negocioId, usuario_id: cuenta.user.id, rol: "duena" });
  const { data: ubicacion, error: errorUbicacion } = await supabase
    .from("ubicacion")
    .insert({ negocio_id: negocioId, nombre: "Principal", es_principal: true })
    .select("id")
    .single();
  if (errorUbicacion || !ubicacion) throw errorUbicacion ?? new Error("No se creó la ubicación");
  const ubicacionId: string = ubicacion.id;

  const logo = await subirLogo(negocioId, t.nombre, t.color);
  if (logo) await supabase.from("negocio").update({ logo }).eq("id", negocioId);

  const categorias = [...new Set(t.productos.map((p) => p.categoria))];
  await supabase.from("categoria").insert(categorias.map((nombre) => ({ negocio_id: negocioId, nombre })));

  let codigo = 1;
  async function insertar(p: Producto, fila: { nombre: string; precio: number; cantidad: number; fotos: string[]; grupo?: string; variante?: string }) {
    const { data: creado, error: errorProducto } = await supabase
      .from("producto")
      .insert({
        negocio_id: negocioId,
        codigo: codigo++,
        nombre: fila.nombre,
        precio: fila.precio,
        descripcion: p.descripcion,
        categoria: p.categoria,
        marca: p.marca ?? null,
        condicion: p.usado ? "usado" : "nuevo",
        estado_detalle: p.usado ?? null,
        precio_anterior: p.antes ?? null,
        detalles: (p.detalles ?? []).map(([nombre, valor]) => ({ nombre, valor })),
        fotos: fila.fotos,
        grupo: fila.grupo ?? null,
        variante: fila.variante ?? null,
        opciones_variante: p.variantes ? [p.variantes.opcion] : null,
        creado_en: haceDias(Math.floor(Math.random() * 40)),
      })
      .select("id")
      .single();
    if (errorProducto) throw errorProducto;
    await supabase.from("existencia").insert({ producto_id: creado.id, ubicacion_id: ubicacionId, negocio_id: negocioId, cantidad: fila.cantidad });
    const costos = [{ tipo: "compra", monto: p.costo }, ...(p.envio ? [{ tipo: "envio", monto: p.envio }] : [])];
    await supabase.from("costo_producto").insert(costos.map((c) => ({ ...c, producto_id: creado.id, negocio_id: negocioId, por_unidad: true })));
  }

  for (const p of t.productos) {
    const general = await subirFoto(negocioId, p.tema);
    if (!p.variantes) {
      await insertar(p, { nombre: p.nombre, precio: p.precio, cantidad: p.cantidad ?? 1, fotos: general ? [general] : [] });
      continue;
    }
    // Como en la app: la foto general va primero en todas las variantes, y después la propia si tiene
    const grupo = randomUUID();
    for (const v of p.variantes.valores) {
      const propia = v.tema ? await subirFoto(negocioId, v.tema) : null;
      await insertar(p, {
        nombre: `${p.nombre} · ${v.etiqueta}`,
        precio: v.precio ?? p.precio,
        cantidad: v.cantidad,
        fotos: [general, propia].filter((f): f is string => !!f),
        grupo,
        variante: v.etiqueta,
      });
    }
  }
  await supabase.from("negocio").update({ siguiente_codigo: codigo }).eq("id", negocioId);
  console.log(`   ${codigo - 1} productos → ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"}/c/${t.slug}`);
}

// ---------------------------------------------------------------- borrar

async function borrarTodo() {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const usuarias = data.users.filter((u) => esSemilla(u.email));
  for (const u of usuarias) {
    const { data: membresias } = await supabase.from("miembro").select("negocio_id").eq("usuario_id", u.id);
    for (const { negocio_id } of membresias ?? []) {
      const { data: archivos } = await supabase.storage.from("productos").list(negocio_id, { limit: 1000 });
      if (archivos?.length) await supabase.storage.from("productos").remove(archivos.map((a) => `${negocio_id}/${a.name}`));
      const { error: errorNegocio } = await supabase.from("negocio").delete().eq("id", negocio_id);
      if (errorNegocio) console.warn(`   no se pudo borrar la tienda ${negocio_id}: ${errorNegocio.message}`);
    }
    await supabase.auth.admin.deleteUser(u.id);
    console.log(`· borrada ${u.email}`);
  }
  console.log(usuarias.length ? "Listo." : "No había nada de la semilla.");
}

// ---------------------------------------------------------------- fotos con IA

type Fila = { id: string; nombre: string; descripcion: string | null; categoria: string | null; variante: string | null; grupo: string | null; opciones_variante: string[] | null; fotos: string[] };

async function fotoConIa(openai: OpenAI, negocioId: string, que: string): Promise<string | null> {
  const prompt = [
    `Foto de producto para el catálogo en línea de una tienda pequeña de El Salvador: ${que}.`,
    "Fotografía realista, como tomada con un buen celular: luz natural suave, fondo sencillo y claro, el producto centrado y completo.",
    "Sin texto, sin logos, sin marcas de agua, sin personas.",
  ].join(" ");
  try {
    const r = await openai.images.generate({ model: "gpt-image-1-mini", prompt, size: "1024x1024", quality: "medium", n: 1 });
    const b64 = r.data?.[0]?.b64_json;
    if (!b64) return null;
    const webp = await sharp(Buffer.from(b64, "base64")).webp({ quality: 82 }).toBuffer();
    const ruta = `${negocioId}/${randomUUID()}.webp`;
    const { error } = await supabase.storage.from("productos").upload(ruta, webp, { contentType: "image/webp" });
    return error ? null : ruta;
  } catch (e) {
    console.warn(`   no salió la foto de "${que}": ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

/** Un logo con IA: un ícono sencillo en el color de la tienda, sin letras (la IA las escribe mal). */
async function logoConIa(slug: string | undefined) {
  if (!slug) return console.log(`¿De cuál tienda? ${TIENDAS.map((t) => t.slug).join(", ")}`);
  const { data: negocio } = await supabase.from("negocio").select("id, nombre, descripcion, color, logo").eq("slug", slug).maybeSingle();
  if (!negocio) return console.error(`No existe la tienda "${slug}".`);
  const prompt = [
    `Logo para el perfil de redes de "${negocio.nombre}", una tienda pequeña de El Salvador: ${negocio.descripcion ?? ""}.`,
    `Un solo ícono simple y amigable que represente lo que vende, estilo ilustración plana con trazos gruesos,`,
    `sobre un fondo de color sólido ${negocio.color ?? "#007f77"} que llena todo el cuadro, con el ícono en blanco y crema.`,
    "Sin letras, sin texto, sin bordes redondeados, centrado y legible en tamaño pequeño.",
  ].join(" ");
  try {
    const r = await new OpenAI().images.generate({ model: "gpt-image-1-mini", prompt, size: "1024x1024", quality: "medium", n: 1 });
    const b64 = r.data?.[0]?.b64_json;
    if (!b64) throw new Error("vino vacía");
    const webp = await sharp(Buffer.from(b64, "base64")).resize(512, 512).webp({ quality: 88 }).toBuffer();
    const ruta = `${negocio.id}/logo-${randomUUID()}.webp`;
    const { error } = await supabase.storage.from("productos").upload(ruta, webp, { contentType: "image/webp" });
    if (error) throw error;
    await supabase.from("negocio").update({ logo: ruta }).eq("id", negocio.id);
    if (negocio.logo) await supabase.storage.from("productos").remove([negocio.logo]);
    console.log(`   ✓ logo de ${negocio.nombre}`);
  } catch (e) {
    console.warn(`   no salió el logo de ${negocio.nombre}: ${e instanceof Error ? e.message : e}`);
  }
}

async function fotosConIa(slug: string | undefined) {
  if (!slug) return console.log(`¿De cuál tienda? ${TIENDAS.map((t) => t.slug).join(", ")}`);
  if (!process.env.OPENAI_API_KEY) return console.error("Falta OPENAI_API_KEY en .env.local");
  const { data: negocio } = await supabase.from("negocio").select("id, nombre").eq("slug", slug).maybeSingle();
  if (!negocio) return console.error(`No existe la tienda "${slug}".`);
  const { data: filas, error } = await supabase
    .from("producto")
    .select("id, nombre, descripcion, categoria, variante, grupo, opciones_variante, fotos")
    .eq("negocio_id", negocio.id)
    .order("codigo");
  if (error) throw error;

  // Un producto con variantes es uno solo: una foto general para todas, y una propia para las que ya tenían
  const productos = new Map<string, Fila[]>();
  for (const f of (filas ?? []) as Fila[]) productos.set(f.grupo ?? f.id, [...(productos.get(f.grupo ?? f.id) ?? []), f]);

  const openai = new OpenAI();
  console.log(`· ${negocio.nombre}: ${productos.size} productos`);
  const viejas: string[] = [];
  // De a tres a la vez: más rápido sin pasarse del límite de la API
  const tareas = [...productos.values()];
  async function trabajar() {
    for (let variantes = tareas.shift(); variantes; variantes = tareas.shift()) {
      const [primera] = variantes;
      const base = primera.variante ? primera.nombre.split(" · ")[0] : primera.nombre;
      const general = await fotoConIa(openai, negocio!.id, `${base}. ${primera.descripcion ?? ""}`);
      if (!general) continue;
      const opcion = primera.opciones_variante?.[0] ?? "Variante";
      for (const v of variantes) {
        const propia = v.variante && v.fotos.length > 1 ? await fotoConIa(openai, negocio!.id, `${base}, ${opcion.toLowerCase()} ${v.variante}. ${v.descripcion ?? ""}`) : null;
        viejas.push(...v.fotos);
        await supabase.from("producto").update({ fotos: [general, propia].filter((f): f is string => !!f) }).eq("id", v.id);
      }
      console.log(`   ✓ ${base}`);
    }
  }
  await Promise.all([trabajar(), trabajar(), trabajar(), logoConIa(slug)]);
  if (viejas.length) await supabase.storage.from("productos").remove([...new Set(viejas)]);
  console.log(`Listo → ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"}/c/${slug}`);
}

// ---------------------------------------------------------------- entrar

async function enlaceParaEntrar(slug: string | undefined) {
  if (!slug) {
    console.log(`¿A cuál tienda? ${TIENDAS.map((t) => t.slug).join(", ")}`);
    return;
  }
  const { data, error } = await supabase.auth.admin.generateLink({ type: "magiclink", email: correoDe(slug) });
  if (error) {
    console.error(`No se pudo: ${error.message}. ¿Existe la tienda "${slug}"? Corré pnpm semilla primero.`);
    return;
  }
  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  console.log(`Abrí este enlace en una ventana privada (sirve una sola vez, por un rato):\n\n${sitio}/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink\n`);
}

// ----------------------------------------------------------------

const argumentos = process.argv.slice(2);
const despuesDe = (bandera: string) => argumentos[argumentos.indexOf(bandera) + 1];
if (argumentos.includes("--logo-ia")) {
  await logoConIa(despuesDe("--logo-ia"));
} else if (argumentos.includes("--fotos-ia")) {
  await fotosConIa(despuesDe("--fotos-ia"));
} else if (argumentos.includes("--entrar")) {
  await enlaceParaEntrar(despuesDe("--entrar"));
} else if (argumentos.includes("--borrar")) {
  await borrarTodo();
} else {
  for (const t of TIENDAS) await crearTienda(t);
  console.log("Listo.");
}
