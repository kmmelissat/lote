import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { enlaceWhatsApp } from "../enlaces";

const t = textos.vitrina.confirmacion;

/** Los dos botones de la página del pedido: el principal (color de la tienda) y el secundario en contorno. En celular, de ancho completo. */
export const BOTON_PRINCIPAL = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-(--store-button) px-6 py-2 text-center font-bold text-(--store-on-button) transition-opacity hover:opacity-90 max-sm:w-full";
export const BOTON_CONTORNO = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-borde bg-superficie px-6 py-2 text-center font-bold hover:bg-(--store-soft) max-sm:w-full";

/** El botón para escribirle a la tienda por su WhatsApp, con el mensaje del pedido ya armado. Si la tienda no puso uno, no se muestra. */
export function EscribirALaTienda({
  whatsapp,
  negocio,
  codigo,
  variante = "principal",
}: {
  whatsapp: string | null;
  negocio: string;
  codigo: number;
  variante?: "principal" | "contorno";
}) {
  const enlace = enlaceWhatsApp(whatsapp, t.mensajeWhatsApp(codigo));
  if (!enlace) return null;
  return (
    <a href={enlace} target="_blank" rel="noopener noreferrer" className={variante === "principal" ? BOTON_PRINCIPAL : BOTON_CONTORNO}>
      <Icon nombre="chat" className="size-5 shrink-0" />
      {t.escribir(negocio)}
    </a>
  );
}
