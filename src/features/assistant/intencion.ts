import { aCentavos, type CategoriaGasto, type Centavos } from "@/domain";
import type { SalidaEntender } from "../ai/esquema";

export type Metodo = "transferencia" | "billetera" | "efectivo";
export type RefPedido = { cliente: string | null; codigo: number | null };

// Lo que el asistente va a hacer, ya validado: con montos en centavos y sin datos que falten.
export type Intencion =
  | { tipo: "ayuda" | "deshacer" | "no_entiendo" }
  | { tipo: "consultar"; consulta: "apartados" | "por_cobrar" | "por_enviar" }
  | { tipo: "consultar_producto"; producto: string }
  | { tipo: "crear_producto"; nombre: string; precio: Centavos; costo: Centavos | null; cantidad: number }
  | { tipo: "reponer"; producto: string; cantidad: number; costo: Centavos | null }
  | { tipo: "apartar"; producto: string; cliente: string; cantidad: number }
  | { tipo: "vender"; producto: string; cantidad: number; cliente: string | null; metodo: Metodo | null }
  | { tipo: "marcar_pagado" | "liberar" | "cobrar"; pedido: RefPedido }
  | { tipo: "abonar"; pedido: RefPedido; monto: Centavos; metodo: Metodo | null }
  | { tipo: "enviar"; pedido: RefPedido; paquetera: string | null; guia: string | null }
  | { tipo: "gasto"; monto: Centavos; categoria: CategoriaGasto; nota: string | null };

export type Falta = "producto" | "cliente" | "precio" | "monto" | "montoGasto" | "pedido" | "cantidad";

export type ResultadoIntencion = { ok: true; intencion: Intencion } | { ok: false; falta: Falta };

const limpio = (s: string | null): string | null => s?.trim() || null;

/** Convierte lo que entendió la IA en una intención, o dice el dato más importante que falta. */
export function aIntencion(s: SalidaEntender): ResultadoIntencion {
  const ok = (intencion: Intencion): ResultadoIntencion => ({ ok: true, intencion });
  const falta = (f: Falta): ResultadoIntencion => ({ ok: false, falta: f });

  const producto = limpio(s.producto);
  const cliente = limpio(s.cliente);
  const pedido: RefPedido = { cliente, codigo: s.pedido };
  const tienePedido = cliente !== null || s.pedido !== null;
  const precio = s.precio !== null && s.precio >= 0 ? aCentavos(s.precio) : null;
  const costo = s.costo !== null && s.costo >= 0 ? aCentavos(s.costo) : null;
  const cantidadValida = s.cantidad === null || s.cantidad >= 1;

  switch (s.intencion) {
    case "ayuda":
    case "deshacer":
    case "no_entiendo":
      return ok({ tipo: s.intencion });
    case "consultar":
      if (s.consulta === null) return ok({ tipo: "no_entiendo" });
      if (s.consulta === "producto") {
        return producto ? ok({ tipo: "consultar_producto", producto }) : falta("producto");
      }
      return ok({ tipo: "consultar", consulta: s.consulta });
    case "crear_producto":
      if (!producto) return falta("producto");
      if (precio === null) return falta("precio");
      if (!cantidadValida) return falta("cantidad");
      return ok({ tipo: "crear_producto", nombre: producto, precio, costo, cantidad: s.cantidad ?? 1 });
    case "reponer":
      if (!producto) return falta("producto");
      if (s.cantidad === null || s.cantidad < 1) return falta("cantidad");
      return ok({ tipo: "reponer", producto, cantidad: s.cantidad, costo });
    case "apartar":
      if (!producto) return falta("producto");
      if (!cliente) return falta("cliente");
      if (!cantidadValida) return falta("cantidad");
      return ok({ tipo: "apartar", producto, cliente, cantidad: s.cantidad ?? 1 });
    case "vender":
      if (!producto) return falta("producto");
      if (!cantidadValida) return falta("cantidad");
      return ok({ tipo: "vender", producto, cantidad: s.cantidad ?? 1, cliente, metodo: s.metodo });
    case "marcar_pagado":
    case "liberar":
    case "cobrar":
      return tienePedido ? ok({ tipo: s.intencion, pedido }) : falta("pedido");
    case "abonar": {
      if (!tienePedido) return falta("pedido");
      const monto = s.monto !== null && s.monto > 0 ? aCentavos(s.monto) : null;
      return monto === null ? falta("monto") : ok({ tipo: "abonar", pedido, monto, metodo: s.metodo });
    }
    case "gasto": {
      const monto = s.monto !== null && s.monto > 0 ? aCentavos(s.monto) : null;
      if (monto === null) return falta("montoGasto");
      return ok({ tipo: "gasto", monto, categoria: s.categoria ?? "otros", nota: limpio(s.nota) });
    }
    case "enviar":
      return tienePedido
        ? ok({ tipo: "enviar", pedido, paquetera: limpio(s.paquetera), guia: limpio(s.guia) })
        : falta("pedido");
  }
}

const numeroDe = (texto: string): number | null => {
  const m = texto.replace(/\$/g, "").match(/\d+(?:[.,]\d{1,2})?/);
  return m ? Number(m[0].replace(",", ".")) : null;
};

/** Pone la respuesta de la persona en el dato que faltaba. Null si no se entiende. */
export function completarSalida(s: SalidaEntender, falta: Falta, texto: string): SalidaEntender | null {
  const t = texto.trim();
  if (!t) return null;
  switch (falta) {
    case "producto":
      return { ...s, producto: t };
    case "cliente":
      return { ...s, cliente: t };
    case "pedido":
      return /^#?\d+$/.test(t) ? { ...s, pedido: Number(t.replace("#", "")) } : { ...s, cliente: t };
    case "precio": {
      const n = numeroDe(t);
      return n === null ? null : { ...s, precio: n };
    }
    case "monto":
    case "montoGasto": {
      const n = numeroDe(t);
      return n === null ? null : { ...s, monto: n };
    }
    case "cantidad": {
      const n = numeroDe(t);
      return n === null || !Number.isInteger(n) ? null : { ...s, cantidad: n };
    }
  }
}
