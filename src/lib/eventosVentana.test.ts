import { afterEach, describe, expect, it, vi } from "vitest";
import { suscribirAEventos } from "./eventosVentana";

describe("suscribirAEventos", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("avisa con storage y con los eventos propios, y deja de avisar al desuscribirse", () => {
    const ventana = new EventTarget();
    vi.stubGlobal("window", ventana);
    const aviso = vi.fn();

    const soltar = suscribirAEventos("lote:carrito")(aviso);
    ventana.dispatchEvent(new Event("storage"));
    ventana.dispatchEvent(new Event("lote:carrito"));
    ventana.dispatchEvent(new Event("otro"));
    expect(aviso).toHaveBeenCalledTimes(2);

    soltar();
    ventana.dispatchEvent(new Event("storage"));
    ventana.dispatchEvent(new Event("lote:carrito"));
    expect(aviso).toHaveBeenCalledTimes(2);
  });
});
