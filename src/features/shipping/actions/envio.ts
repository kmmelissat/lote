"use server";

import { revalidatePath } from "next/cache";
import { leerDolares, repartirEnvio, telefonoElSalvador, type QuienPagaEnvio } from "@/domain";
import { esDepartamento } from "@/lib/departamentos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { guardarEnvio, type ModoEntrega } from "../repositorio";

export type EstadoEnvio = { error?: string; listo?: string };

const MODOS: ModoEntrega[] = ["retiro", "propio", "paquetera"];
const QUIENES: QuienPagaEnvio[] = ["cliente", "vendedora", "mitad"];

const textoDeErrorEnvio: Record<string, string> = {
  falta_direccion: textos.pedidos.envio.errorDireccion,
  costo_bloqueado: textos.pedidos.envio.errorCostoBloqueado,
  costo_invalido: textos.pedidos.envio.errorCostoInvalido,
  sin_permiso: textos.pedidos.envio.errorPermiso,
};

// Datos de envío del pedido. El reparto del costo lo calcula domain; la base verifica que sume
// y que el pedido todavía acepte cambiar el costo.
export async function guardarEnvioDelPedido(
  pedidoId: string,
  _anterior: EstadoEnvio,
  formData: FormData,
): Promise<EstadoEnvio> {
  const t = textos.pedidos.envio;
  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();

  const modo = texto("modo") as ModoEntrega;
  const paga = texto("paga") as QuienPagaEnvio;
  if (!MODOS.includes(modo) || !QUIENES.includes(paga)) return { error: t.errorGeneral };

  const departamento = texto("departamento");
  const direccion = texto("direccion");
  if (modo !== "retiro" && (!esDepartamento(departamento) || !direccion)) {
    return { error: t.errorDireccion };
  }

  const telefonoCrudo = texto("telefono");
  const telefono = telefonoCrudo ? telefonoElSalvador(telefonoCrudo) : null;
  if (telefonoCrudo && !telefono) return { error: t.errorTelefono };

  const costo = modo === "retiro" || texto("costo") === "" ? 0 : leerDolares(texto("costo"));
  if (costo === null) return { error: t.errorCosto };
  const { cobrado, absorbido } = repartirEnvio(costo, paga);

  const { supabase } = await negocioActual();
  const r = await guardarEnvio(supabase, pedidoId, {
    modo,
    paquetera: texto("paquetera") || null,
    guia: texto("guia") || null,
    nombre: texto("nombre") || null,
    telefono,
    departamento: departamento || null,
    municipio: texto("municipio") || null,
    direccion: direccion || null,
    referencia: texto("referencia") || null,
    costo,
    paga,
    cobrado,
    absorbido,
  });
  if (!r.ok) return { error: textoDeErrorEnvio[r.error] ?? t.errorGeneral };

  revalidatePath("/", "layout");
  return { listo: t.guardado };
}
