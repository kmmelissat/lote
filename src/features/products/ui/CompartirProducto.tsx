"use client";

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
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

  const boton =
    "inline-flex h-11 items-center gap-2 rounded-full border-2 border-teal-oscuro px-5 text-sm font-bold text-teal-oscuro transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-dura-chica";

  return (
    <Card className="flex flex-col gap-3 bg-rosa-palido md:col-span-2">
      <div>
        <h2 className="text-lg font-bold">{t.titulo}</h2>
        <p className="text-sm text-texto-2">{t.ayuda}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => copiar("enlace")} className={`${boton} bg-mango`}>
          <Icon nombre="copiar" className="size-4" />
          {t.botones.enlace}
        </button>
        <button type="button" onClick={() => copiar("post")} className={`${boton} bg-white`}>
          {t.botones.post}
        </button>
        <button type="button" onClick={() => copiar("respuesta")} className={`${boton} bg-white`}>
          {t.botones.respuesta}
        </button>
      </div>
    </Card>
  );
}
