"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { textos } from "@/lib/textos";

/**
 * Si venís de guardar algo (un producto, un lote de fotos o un pedido), lo celebra con un aviso y limpia la dirección
 * para que no se repita. La acción manda la señal en la dirección porque después de un redirect no hay otro lugar.
 */
export function AvisoCreado() {
  const { avisar } = useToast();
  useEffect(() => {
    const url = new URL(window.location.href);
    const creado = url.searchParams.get("creado");
    const guardado = url.searchParams.get("guardado");
    const lote = Number(url.searchParams.get("lote"));
    const registrado = url.searchParams.get("registrado");
    const mensaje = creado
      ? textos.productos.form.creado(creado)
      : guardado
        ? textos.productos.editar.guardado(guardado)
        : lote > 0
          ? textos.productos.form.loteCreado(lote)
          : registrado === "venta" || registrado === "apartado"
            ? textos.pedidos.registrado[registrado]
            : null;
    if (!mensaje) return;
    avisar(mensaje, { tipo: "exito" });
    url.searchParams.delete("creado");
    url.searchParams.delete("guardado");
    url.searchParams.delete("lote");
    url.searchParams.delete("registrado");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [avisar]);
  return null;
}
