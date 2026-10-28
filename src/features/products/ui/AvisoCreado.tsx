"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { textos } from "@/lib/textos";

/** Si venís de guardar un producto, lo celebra con un aviso y limpia la dirección para que no se repita. */
export function AvisoCreado() {
  const { avisar } = useToast();
  useEffect(() => {
    const url = new URL(window.location.href);
    const nombre = url.searchParams.get("creado");
    if (!nombre) return;
    avisar(textos.productos.form.creado(nombre), { tipo: "exito" });
    url.searchParams.delete("creado");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [avisar]);
  return null;
}
