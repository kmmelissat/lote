"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { textos } from "@/lib/textos";

/** Si venís de guardar un producto, lo celebra con un aviso y limpia la dirección para que no se repita. */
export function AvisoCreado() {
  const { avisar } = useToast();
  useEffect(() => {
    const url = new URL(window.location.href);
    const creado = url.searchParams.get("creado");
    const guardado = url.searchParams.get("guardado");
    const mensaje = creado ? textos.productos.form.creado(creado) : guardado ? textos.productos.editar.guardado(guardado) : null;
    if (!mensaje) return;
    avisar(mensaje, { tipo: "exito" });
    url.searchParams.delete("creado");
    url.searchParams.delete("guardado");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [avisar]);
  return null;
}
