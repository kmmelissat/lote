import { describe, expect, it } from "vitest";
import { enlaceFacebook, enlaceInstagram, enlaceTiktok, enlaceWhatsApp, facebookDe, mensajePedirProducto, tiktokDe } from "./enlaces";

describe("enlaceWhatsApp", () => {
  it("deja solo los dígitos del número y codifica el mensaje", () => {
    expect(enlaceWhatsApp("+503 7000-1234", "Hola, ¿sigue?")).toBe(
      "https://wa.me/50370001234?text=Hola%2C%20%C2%BFsigue%3F",
    );
  });

  it("sin número válido no hay enlace", () => {
    expect(enlaceWhatsApp(null, "Hola")).toBeNull();
    expect(enlaceWhatsApp("123", "Hola")).toBeNull();
  });
});

describe("enlaceInstagram", () => {
  it("acepta el usuario con o sin arroba", () => {
    expect(enlaceInstagram("@ternuritos.sv")).toBe("https://ig.me/m/ternuritos.sv");
    expect(enlaceInstagram("ternuritos")).toBe("https://ig.me/m/ternuritos");
  });

  it("rechaza usuarios con caracteres raros", () => {
    expect(enlaceInstagram("ana/../x")).toBeNull();
    expect(enlaceInstagram("")).toBeNull();
    expect(enlaceInstagram(null)).toBeNull();
  });
});

describe("facebookDe", () => {
  it("acepta el usuario, el arroba o el enlace de la página", () => {
    expect(facebookDe("velvet.sv")).toBe("velvet.sv");
    expect(facebookDe("@velvet.sv")).toBe("velvet.sv");
    expect(facebookDe("https://www.facebook.com/velvet.sv")).toBe("velvet.sv");
    expect(facebookDe("facebook.com/velvet.sv/")).toBe("velvet.sv");
  });

  it("guarda el id cuando la página no tiene usuario", () => {
    expect(facebookDe("https://www.facebook.com/profile.php?id=100063123456789")).toBe("profile.php?id=100063123456789");
  });
});

describe("enlaceFacebook", () => {
  it("arma el enlace de la página", () => {
    expect(enlaceFacebook("velvet.sv")).toBe("https://www.facebook.com/velvet.sv");
    expect(enlaceFacebook("con espacio")).toBeNull();
    expect(enlaceFacebook(null)).toBeNull();
  });
});

describe("mensajePedirProducto", () => {
  it("nombra el producto y su código para que no haya confusión", () => {
    const m = mensajePedirProducto("Ternuritos", "Chaqueta negra", 12, "$25.00");
    expect(m).toContain("Chaqueta negra");
    expect(m).toContain("#12");
    expect(m).toContain("$25.00");
  });
});

describe("tiktokDe", () => {
  it("acepta el usuario, el arroba o el enlace del perfil", () => {
    expect(tiktokDe("velvet.sv")).toBe("velvet.sv");
    expect(tiktokDe("@velvet.sv")).toBe("velvet.sv");
    expect(tiktokDe("https://www.tiktok.com/@velvet.sv")).toBe("velvet.sv");
    expect(tiktokDe("tiktok.com/@velvet.sv?lang=es")).toBe("velvet.sv");
  });

  it("no adivina de quién es un enlace corto", () => {
    expect(tiktokDe("https://vm.tiktok.com/ZMabc123/")).toBe("");
  });
});

describe("enlaceTiktok", () => {
  it("arma el enlace del perfil", () => {
    expect(enlaceTiktok("velvet.sv")).toBe("https://www.tiktok.com/@velvet.sv");
    expect(enlaceTiktok("con espacio")).toBeNull();
    expect(enlaceTiktok("a")).toBeNull();
    expect(enlaceTiktok(null)).toBeNull();
  });
});
