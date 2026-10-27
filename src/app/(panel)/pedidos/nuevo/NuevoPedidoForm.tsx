"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { Select } from "@/components/ui/Select";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { nuevoPedido, type EstadoNuevoPedido } from "./actions";

const t = textos.pedidos.form;

export type OpcionProducto = {
  id: string;
  codigo: number;
  nombre: string;
  disponibles: number;
  /** centavos */
  precio: number;
};

type Fila = { clave: number; productoId: string; cantidad: string };


export function NuevoPedidoForm({ productos }: { productos: OpcionProducto[] }) {
  const [estado, accion, pendiente] = useActionState<EstadoNuevoPedido, FormData>(nuevoPedido, {});
  const v = estado.valores ?? {};
  const [tipo, setTipo] = useState(v.tipo ?? "apartado");
  const [filas, setFilas] = useState<Fila[]>([{ clave: 0, productoId: "", cantidad: "1" }]);
  const [siguienteClave, setSiguienteClave] = useState(1);

  const porId = new Map(productos.map((p) => [p.id, p]));
  const total = filas.reduce((suma, f) => {
    const p = porId.get(f.productoId);
    const n = Number(f.cantidad);
    return p && Number.isInteger(n) && n > 0 ? suma + p.precio * n : suma;
  }, 0);

  const cambiar = (clave: number, cambio: Partial<Fila>) =>
    setFilas((fs) => fs.map((f) => (f.clave === clave ? { ...f, ...cambio } : f)));

  if (!productos.length) return <p className="text-texto-2">{t.sinProductos}</p>;

  const items = filas
    .filter((f) => f.productoId)
    .map((f) => ({ productoId: f.productoId, cantidad: Number(f.cantidad) }));

  return (
    <form action={accion} className="flex max-w-xl flex-col gap-5">
      <fieldset className="flex gap-6">
        <legend className="mb-1.5 text-sm font-medium">{t.tipo}</legend>
        {(["apartado", "venta"] as const).map((o) => (
          <label key={o} className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name="tipo"
              value={o}
              checked={tipo === o}
              onChange={() => setTipo(o)}
              className="size-5 accent-teal"
            />
            {t[o]}
          </label>
        ))}
      </fieldset>

      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <ul className="flex flex-col gap-3">
        {filas.map((f, i) => {
          const p = porId.get(f.productoId);
          return (
            <li key={f.clave} className="flex items-end gap-3">
              <label className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-sm font-medium">{i === 0 ? t.producto : `${t.producto} ${i + 1}`}</span>
                <Select
                  value={f.productoId}
                  onChange={(e) => cambiar(f.clave, { productoId: e.target.value, cantidad: "1" })}
                >
                  <option value="">{t.elegirProducto}</option>
                  {productos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {t.disponiblesOpcion(o.nombre, o.codigo, o.disponibles)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex w-20 flex-col gap-1.5">
                <span className="text-sm font-medium">{t.cantidad}</span>
                <input
                  type="number"
                  min={1}
                  max={p?.disponibles}
                  inputMode="numeric"
                  value={f.cantidad}
                  onChange={(e) => cambiar(f.clave, { cantidad: e.target.value })}
                  className="h-12 rounded-xl border border-borde bg-superficie px-3 text-base"
                />
              </label>
              {filas.length > 1 && (
                <button
                  type="button"
                  aria-label={t.quitar(i + 1)}
                  onClick={() => setFilas((fs) => fs.filter((x) => x.clave !== f.clave))}
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl text-texto-2 hover:bg-teal-fondo"
                >
                  <span aria-hidden="true">×</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => {
          setFilas((fs) => [...fs, { clave: siguienteClave, productoId: "", cantidad: "1" }]);
          setSiguienteClave((n) => n + 1);
        }}
        className="inline-flex min-h-11 items-center self-start text-teal underline"
      >
        {t.otroProducto}
      </button>

      <Field
        etiqueta={tipo === "apartado" ? t.cliente : t.clienteOpcional}
        name="cliente"
        autoComplete="off"
        autoCapitalize="none"
        defaultValue={v.cliente}
      />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t.canal}</span>
        <Select
          name="canal"
          defaultValue={v.canal ?? (tipo === "venta" ? "presencial" : "instagram")}
          key={tipo}
        >
          {(["instagram", "whatsapp", "presencial"] as const).map((c) => (
            <option key={c} value={c}>
              {textos.pedidos.canales[c]}
            </option>
          ))}
        </Select>
      </label>

      {tipo === "venta" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t.pago}</span>
          <Select name="metodo" defaultValue="efectivo">
            {(["efectivo", "transferencia", "billetera"] as const).map((m) => (
              <option key={m} value={m}>
                {textos.cobro.metodos[m]}
              </option>
            ))}
          </Select>
        </label>
      )}

      <p className="text-lg">
        {t.total}: <strong>{formatearDolares(total)}</strong>
      </p>

      <MensajeError>{estado.error}</MensajeError>
      <Button type="submit" disabled={pendiente || !items.length}>
        {pendiente ? t.registrando : t.registrar}
      </Button>
    </form>
  );
}
