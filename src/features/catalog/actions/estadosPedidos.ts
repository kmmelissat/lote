"use server";

import type { EstadoPedido } from "@/domain";
import { createPublicClient } from "@/lib/supabase/publico";
import { esUuid } from "@/lib/uuid";
import { compradorActual, pedidosDeComprador } from "../compradorDispositivo";
import type { PedidoGuardado } from "../pedidosGuardados";
import { obtenerSeguimiento } from "@/features/tracking/repositorio";

const MAX = 30;

/** En qué va cada pedido de "Mis pedidos". Los que no se encuentran o fallan quedan fuera. Solo se pide el estado, nada personal. */
export async function estadosDePedidos(ids: string[]): Promise<Record<string, EstadoPedido>> {
  const validos = [...new Set(ids.filter((i) => typeof i === "string" && esUuid(i)))].slice(0, MAX);
  const supabase = createPublicClient();
  const respuestas = await Promise.allSettled(validos.map((id) => obtenerSeguimiento(supabase, id)));
  const estados: Record<string, EstadoPedido> = {};
  respuestas.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) estados[validos[i]] = r.value.estado;
  });
  return estados;
}

/** Los pedidos que el servidor tiene de quien mira (su cuenta de Google o este dispositivo). Sin cuenta, lista vacía. */
export async function pedidosDelComprador(): Promise<PedidoGuardado[]> {
  const comprador = await compradorActual();
  return comprador ? pedidosDeComprador(comprador) : [];
}
