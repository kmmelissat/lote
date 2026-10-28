import { esRutaFoto } from "@/lib/fotos";
import { MAXIMO_FOTOS } from "./limites";

/** Los rubros de costo por unidad que lleva el formulario de producto. */
export const TIPOS_COSTO = ["compra", "envio", "importacion", "otro"] as const;

/** Las fotos del formulario (un JSON en un campo oculto): solo las rutas del propio negocio, hasta el tope. */
export function fotosValidas(json: string | undefined, negocioId: string): string[] {
  try {
    const lista: unknown = JSON.parse(json || "[]");
    return Array.isArray(lista) ? lista.filter((r): r is string => esRutaFoto(r, negocioId)).slice(0, MAXIMO_FOTOS) : [];
  } catch {
    return [];
  }
}
