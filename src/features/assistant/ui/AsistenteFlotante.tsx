import { negocioActual } from "@/lib/negocio";
import { BurbujaAsistente } from "./BurbujaAsistente";

/** Lleva el negocio a la burbuja (las fotos que se mandan al chat se suben a su carpeta). */
export async function AsistenteFlotante() {
  const { negocio } = await negocioActual();
  return <BurbujaAsistente negocioId={negocio.id} />;
}
