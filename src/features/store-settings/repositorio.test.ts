import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import { contextoDeLaTienda, guardarTienda, obtenerAjustesVitrina, obtenerIdentidad } from "./repositorio";

const fila = {
  slug: "bambu",
  apartar_desde_vitrina: true,
  plazo_apartado_horas: 24,
  limite_apartados_por_contacto: 2,
  umbral_poco_stock: 3,
  whatsapp: null,
  usuario_instagram: null,
  visible_en_explorar: true,
  vitrina_activa: true,
  tiene_local: false,
  tiempo_entrega: null,
  politica_cambios: null,
  permite_comprar: true,
  permite_apartar: false,
};

describe("obtenerAjustesVitrina", () => {
  it("con la llave general apagada no se puede comprar ni apartar", async () => {
    const { cliente } = supabaseFalso({ tablas: { negocio: { data: { ...fila, apartar_desde_vitrina: false }, error: null } } });
    expect(await obtenerAjustesVitrina(cliente, "n1")).toMatchObject({ permiteComprar: false, permiteApartar: false });
  });

  it("con la llave prendida, cada modo sigue lo suyo", async () => {
    const { cliente } = supabaseFalso({ tablas: { negocio: { data: fila, error: null } } });
    expect(await obtenerAjustesVitrina(cliente, "n1")).toMatchObject({ permiteComprar: true, permiteApartar: false, vitrinaActiva: true });
  });

  it("si la base falla, lanza el error", async () => {
    const { cliente } = supabaseFalso({ tablas: { negocio: { data: null, error: new Error("falló") } } });
    await expect(obtenerAjustesVitrina(cliente, "n1")).rejects.toThrow("falló");
  });
});

describe("obtenerIdentidad", () => {
  it("las redes y el banner que faltan quedan en null", async () => {
    const { cliente } = supabaseFalso({
      tablas: { negocio: { data: { nombre: "Bambú", slug: "bambu", descripcion: null, logo: null, color: null, whatsapp: null, usuario_instagram: "bambu", contexto_ia: "vendo ropa" }, error: null } },
    });
    expect(await obtenerIdentidad(cliente, "n1")).toMatchObject({ usuarioInstagram: "bambu", usuarioFacebook: null, usuarioTiktok: null, banner: null, contextoIa: "vendo ropa" });
  });
});

describe("contextoDeLaTienda", () => {
  it("devuelve el texto sin espacios de los lados, o vacío", async () => {
    expect(await contextoDeLaTienda(supabaseFalso({ tablas: { negocio: { data: { contexto_ia: "  hola " }, error: null } } }).cliente, "n1")).toBe("hola");
    expect(await contextoDeLaTienda(supabaseFalso({ tablas: { negocio: { data: null, error: null } } }).cliente, "n1")).toBe("");
  });
});

describe("guardarTienda", () => {
  const datos = {
    nombre: "Bambú", descripcion: null, logo: null, color: null, usuarioFacebook: null, usuarioTiktok: null, banner: null, contextoIa: null,
    vitrinaActiva: true, tieneLocal: false, tiempoEntrega: null, politicaCambios: null, apartarDesdeVitrina: true, permiteComprar: true,
    permiteApartar: true, plazoHoras: 24, limitePorContacto: 2, umbralPocoStock: 3, visibleEnExplorar: true, whatsapp: null, usuarioInstagram: null,
  };

  it("guarda bien", async () => {
    const { cliente } = supabaseFalso({ tablas: { negocio: { data: null, error: null } } });
    expect(await guardarTienda(cliente, "n1", datos)).toBe("ok");
  });

  it("una dirección repetida se avisa aparte", async () => {
    const { cliente } = supabaseFalso({ tablas: { negocio: { data: null, error: { code: "23505", message: "duplicado" } } } });
    expect(await guardarTienda(cliente, "n1", { ...datos, slug: "otra" })).toBe("slug_repetido");
  });

  it("cualquier otro error es error", async () => {
    const { cliente } = supabaseFalso({ tablas: { negocio: { data: null, error: { code: "42501", message: "sin permiso" } } } });
    expect(await guardarTienda(cliente, "n1", datos)).toBe("error");
  });
});
