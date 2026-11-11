"use client";

import { Button } from "@/components/ui/Button";
import { TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import { EncabezadoTarjeta } from "@/components/ui/EncabezadoTarjeta";
import { useToast } from "@/components/ui/Toast";
import { textos } from "@/lib/textos";
import { armarRespuesta, armarTextoPost } from "../textosCompartir";
import type { Producto } from "../repositorio";

const t = textos.productos.compartir;

type Props = {
  slug: string;
  producto: Pick<Producto, "codigo" | "nombre" | "descripcion" | "precio" | "estado" | "disponibles">;
};

export function CompartirProducto({ slug, producto }: Props) {
  const { avisar } = useToast();

  // El enlace se arma al tocar el botón: ahí ya se conoce el dominio real del navegador.
  async function copiar(que: "enlace" | "post" | "respuesta") {
    const enlace = `${window.location.origin}/c/${slug}/${producto.codigo}`;
    const texto =
      que === "enlace" ? enlace : que === "post" ? armarTextoPost(producto, enlace) : armarRespuesta(producto, enlace);
    try {
      await navigator.clipboard.writeText(texto);
      avisar(t.copiado[que], { tipo: "exito" });
    } catch {
      avisar(t.noSePudoCopiar, { tipo: "error" });
    }
  }

  return (
    <section className={`${TARJETA_PUNCH} flex flex-col gap-4`}>
      <EncabezadoTarjeta icono="enviar" color="rosa" titulo={t.titulo} ayuda={t.ayuda} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variante="suave" tamano="chico" icono="copiar" onClick={() => copiar("enlace")}>
          {t.botones.enlace}
        </Button>
        <Button type="button" variante="suave" tamano="chico" icono="copiar" onClick={() => copiar("post")}>
          {t.botones.post}
        </Button>
        <Button type="button" variante="suave" tamano="chico" icono="chat" onClick={() => copiar("respuesta")}>
          {t.botones.respuesta}
        </Button>
      </div>
    </section>
  );
}
