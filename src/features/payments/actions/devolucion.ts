"use server";

import { revalidatePath } from "next/cache";
import { rastrearAccion } from "@/lib/analiticaServidor";
import { elegirCuenta, leerDolares } from "@/domain";
import {
  cuentasDelNegocio,
  devueltoDelPedido,
  registrarDevolucionDePedido,
} from "@/features/gestion/repositorio";
import { obtenerPedido } from "@/features/orders/repositorio";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import type { EstadoPago } from "./cobro";

/**
 * El dinero que se devolvió por un pedido cancelado: baja la cuenta de donde salió. Se guarda como un ajuste negativo
 * ligado al pedido (`registrar_devolucion_pedido`, que lo revisa en la base), y no puede pasar de lo cobrado menos lo ya devuelto.
 */
export async function registrarDevolucion(
  pedidoCodigo: number,
  _anterior: EstadoPago,
  datos: FormData,
): Promise<EstadoPago> {
  const d = textos.pedidos.devolucion;
  const monto = leerDolares(String(datos.get("monto") ?? ""));
  if (monto === null || monto <= 0) return { error: d.errorMonto };

  const { supabase, negocio } = await negocioActual();
  if (!negocio.puedeGestionar) return { error: d.errorPermiso };
  const pedido = await obtenerPedido(supabase, negocio.id, pedidoCodigo);
  if (!pedido || pedido.estado !== "cancelado")
    return { error: d.errorGeneral };

  const cuenta = elegirCuenta(
    await cuentasDelNegocio(supabase, negocio.id),
    String(datos.get("cuenta") ?? ""),
  );
  if (!cuenta) return { error: d.errorCuenta };
  const pendiente =
    pedido.total -
    pedido.saldo -
    (await devueltoDelPedido(supabase, negocio.id, pedido.id));
  if (monto > pendiente) return { error: d.errorMonto };

  const ok = await registrarDevolucionDePedido(supabase, pedido.id, cuenta, monto);
  if (!ok) return { error: d.errorGeneral };

  await rastrearAccion("pedido_devolucion_registrada");
  revalidatePath("/", "layout");
  return { listo: d.listo };
}
