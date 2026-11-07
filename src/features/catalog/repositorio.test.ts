import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import {
  apartarDesdeVitrina,
  detallesDe,
  listarProductosPublicos,
  obtenerEstrellas,
  obtenerNegocioPublico,
  obtenerOpcionesDeCompra,
  obtenerPerfil,
  obtenerProductoPublico,
  obtenerResenas,
} from "./repositorio";

describe("detallesDe", () => {
  it("descarta lo que no es una lista de nombre y valor", () => {
    expect(detallesDe(null)).toEqual([]);
    expect(detallesDe([{ nombre: "Tela", valor: 3 }, { nombre: "  ", valor: "lino" }])).toEqual([]);
  });

  it("recorta espacios y corta el nombre y el valor al máximo", () => {
    const nombre = "m".repeat(50);
    const valor = "v".repeat(130);
    expect(detallesDe([{ nombre: `  ${nombre}  `, valor: `  ${valor}  ` }])).toEqual([{ nombre: "m".repeat(40), valor: "v".repeat(120) }]);
  });
});

const filaPublica = {
  codigo: 4,
  nombre: "Blusa",
  descripcion: null,
  categoria: "Blusas y camisetas",
  marca: null,
  condicion: "nuevo",
  fotos: ["a.jpg"],
  precio: 12.5,
  disponibles: 3,
  apartado: false,
  grupo: null,
  variante: null,
  opciones_variante: ["Talla"],
  detalles: [{ nombre: " Tela ", valor: " lino " }],
  estado_detalle: null,
  precio_anterior: 20,
  creado_en: "2026-10-01T12:00:00Z",
  vendidas: 2,
};

describe("productos públicos", () => {
  it("pasa el precio a centavos y limpia los detalles", async () => {
    const { cliente } = supabaseFalso({ rpc: { vitrina_productos: { data: [filaPublica], error: null } } });
    const [p] = await listarProductosPublicos(cliente, "bambu");
    expect(p.precio).toBe(1250);
    expect(p.precioAnterior).toBe(2000);
    expect(p.detalles).toEqual([{ nombre: "Tela", valor: "lino" }]);
    expect(p.opciones).toEqual(["Talla"]);
    expect(p.creadoEn).toEqual(new Date("2026-10-01T12:00:00Z"));
  });

  it("sin precio de antes ni fecha queda en null", async () => {
    const { cliente } = supabaseFalso({
      rpc: { vitrina_productos: { data: [{ ...filaPublica, precio_anterior: null, creado_en: null, opciones_variante: null }], error: null } },
    });
    const [p] = await listarProductosPublicos(cliente, "bambu");
    expect(p.precioAnterior).toBeNull();
    expect(p.creadoEn).toBeNull();
    expect(p.opciones).toEqual([]);
  });

  it("un código que no existe no devuelve producto", async () => {
    const { cliente } = supabaseFalso({ rpc: { vitrina_productos: { data: [], error: null } } });
    expect(await obtenerProductoPublico(cliente, "bambu", 99)).toBeNull();
  });
});

const negocio = {
  nombre: "Bambú",
  logo: null,
  color: null,
  descripcion: null,
  whatsapp: null,
  usuario_instagram: null,
  usuario_facebook: null,
  apartar_desde_vitrina: true,
  plazo_apartado_horas: 24,
  tiempo_entrega: "Sale en 24 h",
  politica_cambios: null,
  umbral_poco_stock: 3,
};

describe("obtenerNegocioPublico", () => {
  const clienteCon = (fila: object | null) =>
    supabaseFalso({ rpc: { vitrina_negocio: { data: fila ? [fila] : [], error: null } } });

  it("sin fila no hay tienda", async () => {
    expect(await obtenerNegocioPublico(clienteCon(null).cliente, "no-existe")).toBeNull();
  });

  it("trae las reglas, el TikTok y el banner en una sola llamada", async () => {
    const { cliente, llamadas } = clienteCon({
      ...negocio,
      usuario_tiktok: "bambu",
      banner: "b.jpg",
      permite_comprar: true,
      permite_apartar: false,
      zonas_entrega: { "San Salvador": [] },
    });
    const n = await obtenerNegocioPublico(cliente, "bambu");
    expect(n).toMatchObject({ permiteComprar: true, permiteApartar: false, usuarioTiktok: "bambu", banner: "b.jpg", zonasEntrega: { "San Salvador": [] } });
    expect(llamadas).toHaveLength(1);
  });

  it("si la base todavía no devuelve esos campos, compra y aparta siguen la llave general", async () => {
    const n = await obtenerNegocioPublico(clienteCon(negocio).cliente, "bambu");
    expect(n).toMatchObject({ permiteComprar: true, permiteApartar: true, zonasEntrega: null, usuarioTiktok: null, banner: null, umbralPocoStock: 3 });
  });
});

describe("obtenerOpcionesDeCompra", () => {
  it("pasa las tarifas a centavos", async () => {
    const { cliente } = supabaseFalso({
      rpc: {
        vitrina_entrega: {
          data: [{ direccion_retiro: "Local", tarifa_defecto: 3.5, tarifas: [{ departamento: "San Salvador", precio: 2.5 }], metodos: ["efectivo"] }],
          error: null,
        },
      },
    });
    expect(await obtenerOpcionesDeCompra(cliente, "bambu")).toEqual({
      direccionRetiro: "Local",
      tarifaDefecto: 350,
      tarifas: { "San Salvador": 250 },
      metodos: ["efectivo"],
    });
  });
});

const pedido = { slug: "bambu", codigo: 4, nombre: "Ana", contacto: "70000000", cantidad: 1, aceptaWhatsapp: true, huella: "h" };

describe("apartarDesdeVitrina", () => {
  it("devuelve el pedido o traduce el error", async () => {
    const ok = supabaseFalso({ rpc: { apartar_desde_vitrina: { data: { pedido: "p1" }, error: null } } }).cliente;
    expect(await apartarDesdeVitrina(ok, pedido)).toEqual({ ok: true, pedidoId: "p1" });

    const conocido = supabaseFalso({ rpc: { apartar_desde_vitrina: { data: { error: "sin_disponibilidad" }, error: null } } }).cliente;
    expect(await apartarDesdeVitrina(conocido, pedido)).toEqual({ ok: false, error: "sin_disponibilidad" });

    const raro = supabaseFalso({ rpc: { apartar_desde_vitrina: { data: { error: "otra" }, error: null } } }).cliente;
    expect(await apartarDesdeVitrina(raro, pedido)).toEqual({ ok: false, error: "desconocido" });

    const caido = supabaseFalso({ rpc: { apartar_desde_vitrina: { data: null, error: new Error("boom") } } }).cliente;
    expect(await apartarDesdeVitrina(caido, pedido)).toEqual({ ok: false, error: "desconocido" });
  });
});

describe("reseñas y perfil", () => {
  it("arma el promedio y distingue el origen", async () => {
    const data = [{ promedio: "4.5", total: 2, nombre: "Ana", estrellas: 5, texto: null, origen: "tienda", creado_en: "2026-10-02T12:00:00Z" }];
    const { cliente } = supabaseFalso({ rpc: { vitrina_resenas: { data, error: null } } });
    const r = await obtenerResenas(cliente, "bambu");
    expect(r.promedio).toBe(4.5);
    expect(r.resenas[0]).toMatchObject({ origen: "tienda", estrellas: 5 });
    expect(r.resenas[0].creadoEn).toEqual(new Date("2026-10-02T12:00:00Z"));
  });

  it("si la reseña falla, la tienda sigue sin reseñas", async () => {
    const { cliente } = supabaseFalso({ rpc: { vitrina_resenas: { data: null, error: new Error("no existe") } } });
    expect(await obtenerResenas(cliente, "bambu")).toEqual({ promedio: 0, total: 0, resenas: [] });
  });

  it("las estrellas quedan por código, y sin la función el mapa va vacío", async () => {
    const con = supabaseFalso({ rpc: { vitrina_estrellas: { data: [{ codigo: 4, promedio: "5", total: 1 }], error: null } } }).cliente;
    expect(await obtenerEstrellas(con, "bambu")).toEqual(new Map([[4, { promedio: 5, total: 1 }]]));

    const sin = supabaseFalso({ rpc: { vitrina_estrellas: { data: null, error: new Error("no existe") } } }).cliente;
    expect(await obtenerEstrellas(sin, "bambu")).toEqual(new Map());
  });

  it("el perfil traduce la fecha, o null si todavía no existe la función", async () => {
    const con = supabaseFalso({ rpc: { vitrina_perfil: { data: [{ verificada: true, desde: "2026-01-01T00:00:00Z", vendidos: 8 }], error: null } } }).cliente;
    expect(await obtenerPerfil(con, "bambu")).toEqual({ verificada: true, desde: new Date("2026-01-01T00:00:00Z"), vendidos: 8 });

    const sin = supabaseFalso({ rpc: { vitrina_perfil: { data: null, error: new Error("no existe") } } }).cliente;
    expect(await obtenerPerfil(sin, "bambu")).toBeNull();
  });
});
