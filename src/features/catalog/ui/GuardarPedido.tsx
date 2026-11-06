"use client";

import { useEffect } from "react";
import { guardarPedido } from "../pedidosGuardados";

/** Al ver la confirmación de un pedido, queda anotado en "Mis pedidos" de este navegador. No se ve nada. */
export function GuardarPedido({ id, slug, tienda, codigo, total, resumen }: { id: string; slug: string; tienda: string; codigo: number; total: number; resumen: string }) {
  useEffect(() => guardarPedido({ id, slug, tienda, codigo, total, resumen }), [id, slug, tienda, codigo, total, resumen]);
  return null;
}
