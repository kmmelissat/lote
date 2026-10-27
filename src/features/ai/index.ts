import { crearProveedorOpenAI } from "./openai";
import type { ProveedorIA } from "./provider";

/** El proveedor de IA, o null si todavía no está conectado (falta la clave). Las pantallas siguen funcionando. */
export function proveedorIA(): ProveedorIA | null {
  try {
    return crearProveedorOpenAI();
  } catch {
    return null;
  }
}
