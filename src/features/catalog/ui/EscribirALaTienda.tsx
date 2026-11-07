import { Icon } from "@/components/ui/Icon";
import { textos } from "@/lib/textos";
import { enlaceWhatsApp } from "../enlaces";

const t = textos.vitrina.confirmacion;

/** El botón para escribirle a la tienda por su WhatsApp, con el mensaje del pedido ya armado. Si la tienda no puso uno, no se muestra. */
export function EscribirALaTienda({ whatsapp, negocio, codigo }: { whatsapp: string | null; negocio: string; codigo: number }) {
  const enlace = enlaceWhatsApp(whatsapp, t.mensajeWhatsApp(codigo));
  if (!enlace) return null;
  return (
    <a
      href={enlace}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-teal-oscuro/30 bg-accion px-5 py-2 text-center font-bold text-accion-texto transition-[transform,box-shadow] duration-150"
    >
      <Icon nombre="chat" className="size-5 shrink-0" />
      {t.escribir(negocio)}
    </a>
  );
}
