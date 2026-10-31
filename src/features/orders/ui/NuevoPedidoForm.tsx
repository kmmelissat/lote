"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import { digitosLocales, normalizarTelefono, telefonoElSalvador } from "@/domain";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { MensajeError } from "@/components/ui/MensajeError";
import { Monito } from "@/components/ui/Monito";
import { TARJETA } from "@/components/ui/tarjeta";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { nuevoPedido, type EstadoNuevoPedido } from "../actions/nuevo";
import { BarraFormulario } from "@/components/ui/BarraFormulario";
import { CampoBusqueda } from "@/components/ui/CampoBusqueda";

const t = textos.pedidos.form;

// Lo mismo que acepta la acción del servidor
const MAXIMO_PRODUCTOS = 20;

export type OpcionProducto = {
  id: string;
  codigo: number;
  nombre: string;
  disponibles: number;
  /** centavos */
  precio: number;
  foto: string | null;
  variante: string | null;
};

const nombreCompleto = (p: OpcionProducto) => (p.variante ? `${p.nombre} (${p.variante})` : p.nombre);

function presentarContacto(crudo: string): string {
  if (telefonoElSalvador(crudo)) return digitosLocales(crudo);
  return crudo.replace(/[^A-Za-z0-9@._]/g, "").slice(0, 60);
}

function limpiarContacto(crudo: string): string {
  if (/[A-Za-z@]/.test(crudo)) return crudo.replace(/[^A-Za-z0-9@._]/g, "").slice(0, 60);
  return digitosLocales(crudo);
}

const CANALES = ["instagram", "whatsapp", "presencial"] as const;
const METODOS: { clave: "efectivo" | "transferencia" | "billetera"; icono: NombreIcono }[] = [
  { clave: "efectivo", icono: "efectivo" },
  { clave: "transferencia", icono: "banco" },
  { clave: "billetera", icono: "billetera" },
];

export function NuevoPedidoForm({ productos }: { productos: OpcionProducto[] }) {
  const [estado, accion, pendiente] = useActionState<EstadoNuevoPedido, FormData>(nuevoPedido, {});
  const v = estado.valores ?? {};
  const [tipo, setTipo] = useState<"apartado" | "venta">(v.tipo === "venta" ? "venta" : "apartado");
  const [canalElegido, setCanalElegido] = useState<string | null>(v.canal ?? null);
  const [metodo, setMetodo] = useState<string>("efectivo");
  const [contacto, setContacto] = useState(() => presentarContacto(v.contacto ?? ""));
  const [busqueda, setBusqueda] = useState("");
  // id del producto -> cantidad (solo los que están en el pedido)
  const [cantidades, setCantidades] = useState<Record<string, number>>({});

  // Solo a un teléfono se le puede escribir por WhatsApp: ahí tiene sentido preguntar si acepta avisos
  const esTelefono = normalizarTelefono(contacto) !== null;
  const canal = canalElegido ?? (tipo === "venta" ? "presencial" : "instagram");
  const porId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);

  const items = Object.entries(cantidades)
    .filter(([, n]) => n > 0)
    .map(([productoId, cantidad]) => ({ productoId, cantidad }));
  const unidades = items.reduce((suma, i) => suma + i.cantidad, 0);
  const total = items.reduce((suma, i) => suma + (porId.get(i.productoId)?.precio ?? 0) * i.cantidad, 0);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) => nombreCompleto(p).toLowerCase().includes(q) || String(p.codigo).includes(q));
  }, [productos, busqueda]);

  function cambiar(p: OpcionProducto, diferencia: number) {
    setCantidades((actual) => {
      const nueva = Math.min(p.disponibles, Math.max(0, (actual[p.id] ?? 0) + diferencia));
      if (nueva > 0 && !(p.id in actual) && Object.keys(actual).length >= MAXIMO_PRODUCTOS) return actual;
      const { [p.id]: _quitado, ...resto } = actual;
      void _quitado;
      return nueva > 0 ? { ...resto, [p.id]: nueva } : resto;
    });
  }

  if (!productos.length) {
    return (
      <EmptyState
        titulo={t.sinProductosTitulo}
        texto={t.sinProductos}
        accion={
          <ButtonLink href="/productos/nuevo" variante="mango">
            {t.sinProductosAccion}
          </ButtonLink>
        }
      />
    );
  }

  return (
    <form action={accion} className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="flex min-w-0 flex-col gap-5">
        {/* 1. Qué se registra */}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-lg font-bold">{t.tipo}</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["apartado", "venta"] as const).map((o) => (
              <label
                key={o}
                className={`${TARJETA} flex cursor-pointer items-start gap-3 transition-[transform,box-shadow] duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal ${
                  tipo === o ? "bg-limon shadow-dura-chica" : "bg-superficie hover:-translate-y-0.5"
                }`}
              >
                <input
                  type="radio"
                  name="tipo"
                  value={o}
                  checked={tipo === o}
                  onChange={() => setTipo(o)}
                  className="sr-only"
                />
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-teal-oscuro bg-superficie">
                  <Icon nombre={o === "apartado" ? "reloj" : "moneda"} className="size-5" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-bold">{t[o]}</span>
                  <span className="text-sm">{o === "apartado" ? t.apartadoAyuda : t.ventaAyuda}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* 2. Qué se lleva */}
        <section aria-labelledby="productos-titulo" className={`${TARJETA} flex flex-col gap-3 bg-superficie`}>
          <h2 id="productos-titulo" className="text-lg font-bold">
            {t.productos}
          </h2>
          <CampoBusqueda
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={t.buscar}
            aria-label={t.buscar}
          />

          {filtrados.length === 0 ? (
            <p className="py-6 text-center text-texto-2">{t.sinResultados}</p>
          ) : (
            <ul className="-mx-1 flex max-h-[26rem] flex-col gap-2 overflow-y-auto px-1 py-1">
              {filtrados.map((p) => {
                const n = cantidades[p.id] ?? 0;
                return (
                  <li
                    key={p.id}
                    className={`flex items-center gap-3 rounded-[20px] border-2 p-2 pr-3 ${
                      n > 0 ? "border-teal-oscuro bg-crema" : "border-borde bg-superficie"
                    }`}
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border-2 border-teal-oscuro bg-teal-fondo">
                      {p.foto ? (
                        <Image src={urlFoto(p.foto)} alt="" fill sizes="56px" className="object-cover" />
                      ) : (
                        <div className="grid size-full place-items-center text-teal">
                          <Icon nombre="productos" className="size-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">{nombreCompleto(p)}</p>
                      <p className="text-sm">
                        <span className="font-bold tabular-nums">{formatearDolares(p.precio)}</span>
                        <span className="text-texto-2">
                          {" · #"}
                          {p.codigo}
                          {" · "}
                          {p.disponibles === 1 ? "queda 1" : `quedan ${p.disponibles}`}
                        </span>
                      </p>
                    </div>
                    {n === 0 ? (
                      <button
                        type="button"
                        onClick={() => cambiar(p, 1)}
                        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border-2 border-teal-oscuro bg-superficie px-4 text-sm font-bold hover:bg-limon"
                      >
                        <Icon nombre="mas" className="size-4" />
                        {t.agregar}
                      </button>
                    ) : (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label={t.menosDe(nombreCompleto(p))}
                          onClick={() => cambiar(p, -1)}
                          className="grid size-11 place-items-center rounded-full border-2 border-teal-oscuro bg-superficie text-lg font-bold"
                        >
                          <span aria-hidden="true">−</span>
                        </button>
                        <span aria-live="polite" className="w-7 text-center font-bold tabular-nums">
                          {n}
                        </span>
                        <button
                          type="button"
                          aria-label={t.masDe(nombreCompleto(p))}
                          title={n >= p.disponibles ? t.tope(p.disponibles) : undefined}
                          disabled={n >= p.disponibles}
                          onClick={() => cambiar(p, 1)}
                          className="grid size-11 place-items-center rounded-full border-2 border-teal-oscuro bg-mango text-lg font-bold disabled:opacity-40"
                        >
                          <span aria-hidden="true">+</span>
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 3. Para quién y cómo */}
        <section aria-labelledby="quien-titulo" className={`${TARJETA} flex flex-col gap-4 bg-superficie`}>
          <h2 id="quien-titulo" className="text-lg font-bold">
            {t.quien}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              etiqueta={tipo === "apartado" ? t.cliente : t.clienteOpcional}
              name="cliente"
              autoComplete="off"
              defaultValue={v.cliente}
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{t.contacto}</span>
              <span className="flex">
                {/^\d+$/.test(contacto) && contacto.length > 0 && (
                  <span className="flex h-12 items-center rounded-l-[14px] border-2 border-r-0 border-borde-control bg-fondo px-3 font-bold text-texto-2">
                    +503
                  </span>
                )}
                <input
                  name="contacto"
                  value={contacto}
                  onChange={(e) => setContacto(limpiarContacto(e.target.value))}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode={/^\d+$/.test(contacto) && contacto ? "numeric" : "text"}
                  pattern={/^\d+$/.test(contacto) && contacto ? "[0-9]{8}" : "[A-Za-z0-9@._]*"}
                  placeholder={/^\d+$/.test(contacto) && contacto ? "7000 1234" : "7000 1234 o @usuario"}
                  title={t.contactoAyuda}
                  className={`h-12 min-w-0 flex-1 border-2 border-borde-control bg-superficie px-4 text-base focus:border-teal ${
                    /^\d+$/.test(contacto) && contacto ? "rounded-r-[14px] tabular-nums" : "rounded-[14px]"
                  }`}
                />
              </span>
            </label>
          </div>
          <p className="-mt-2 text-sm text-texto-2">{t.contactoAyuda}</p>
          {esTelefono && (
            <label className="flex cursor-pointer items-start gap-3 rounded-[20px] border-2 border-teal-oscuro bg-crema p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal">
              <input type="checkbox" name="acepta" defaultChecked={v.acepta} className="mt-0.5 size-5 shrink-0 accent-teal" />
              <span className="flex flex-col">
                <span className="font-bold">{t.acepta}</span>
                <span className="text-sm text-texto-2">{t.aceptaAyuda}</span>
              </span>
            </label>
          )}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-medium">{t.canal}</legend>
            <div className="flex flex-wrap gap-2">
              {CANALES.map((c) => (
                <Opcion key={c} activa={canal === c}>
                  <input
                    type="radio"
                    name="canal"
                    value={c}
                    checked={canal === c}
                    onChange={() => setCanalElegido(c)}
                    className="sr-only"
                  />
                  {textos.pedidos.canales[c]}
                </Opcion>
              ))}
            </div>
          </fieldset>

          {tipo === "venta" && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 text-sm font-medium">{t.pago}</legend>
              <div className="flex flex-wrap gap-2">
                {METODOS.map((m) => (
                  <Opcion key={m.clave} activa={metodo === m.clave}>
                    <input
                      type="radio"
                      name="metodo"
                      value={m.clave}
                      checked={metodo === m.clave}
                      onChange={() => setMetodo(m.clave)}
                      className="sr-only"
                    />
                    <Icon nombre={m.icono} className="size-4" />
                    {textos.cobro.metodos[m.clave]}
                  </Opcion>
                ))}
              </div>
            </fieldset>
          )}
        </section>
      </div>

      {/* Resumen: a un lado en pantalla ancha, al final en el celular */}
      <aside className="relative mt-8 lg:sticky lg:top-4 lg:mt-10">
        <Monito nombre="calculadora" className="pointer-events-none absolute -top-[4.6rem] right-5 w-16 text-rosa" />
        <div className={`${TARJETA} flex flex-col gap-4 bg-limon shadow-dura`}>
          <h2 className="text-lg font-bold">{t.resumen}</h2>

          {items.length === 0 ? (
            <p>{t.resumenVacio}</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {items.map((i) => {
                const p = porId.get(i.productoId);
                if (!p) return null;
                return (
                  <li key={i.productoId} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      {i.cantidad} × {nombreCompleto(p)}
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">{formatearDolares(p.precio * i.cantidad)}</span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-end justify-between gap-3 border-t-2 border-teal-oscuro pt-3">
            <div>
              <p className="text-sm font-medium">{t.total}</p>
              {unidades > 0 && <p className="text-sm">{t.unidades(unidades)}</p>}
            </div>
            <p className="text-3xl font-bold tabular-nums" aria-live="polite">
              {formatearDolares(total)}
            </p>
          </div>

          <MensajeError>{estado.error}</MensajeError>
        </div>
      </aside>
      <BarraFormulario>
        <p className="mr-auto text-sm font-bold tabular-nums">{formatearDolares(total)}</p>
        <Button type="submit" variante="mango" disabled={pendiente || !items.length}>
          {pendiente ? t.registrando : t.registrar}
        </Button>
      </BarraFormulario>
    </form>
  );
}

/** Una opción en forma de píldora: el radio va escondido adentro y la píldora se pinta cuando está elegido. */
function Opcion({ activa, children }: { activa: boolean; children: React.ReactNode }) {
  return (
    <label
      className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal ${
        activa ? "bg-limon shadow-dura-chica" : "bg-superficie hover:bg-teal-fondo"
      }`}
    >
      {children}
    </label>
  );
}
