import { describe, expect, it } from "vitest";
import { enlaceInstagram, enlaceWhatsApp, mensajePedirProducto } from "./enlaces";

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

describe("mensajePedirProducto", () => {
  it("nombra el producto y su código para que no haya confusión", () => {
    const m = mensajePedirProducto("Ternuritos", "Chaqueta negra", 12, "$25.00");
    expect(m).toContain("Chaqueta negra");
    expect(m).toContain("#12");
    expect(m).toContain("$25.00");
  });
});
