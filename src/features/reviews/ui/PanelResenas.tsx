"use client";

import { useActionState, useRef, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useConfirmar } from "@/components/ui/Confirmar";
import { Estrellas } from "@/components/ui/Estrellas";
import { EstrellasInput } from "@/components/ui/EstrellasInput";
import { Field } from "@/components/ui/Field";
import { MensajeError } from "@/components/ui/MensajeError";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { TARJETA } from "@/components/ui/tarjeta";
import { formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { agregarResenaManual, borrarResena, cambiarEstadoResena, type EstadoResenaForm } from "../actions/resenas";
import type { ResenaPanel } from "../repositorio";

const t = textos.resenas;

const chip = { pendiente: "bg-limon", publicada: "bg-teal-fondo", oculta: "bg-gris-fondo" } as const;
const boton = "inline-flex h-10 max-md:min-h-11 items-center rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold text-teal-oscuro hover:bg-limon disabled:opacity-50";

function FilaResena({ r }: { r: ResenaPanel }) {
  const [pendiente, empezar] = useTransition();
  const { avisar } = useToast();
  const confirmar = useConfirmar();

  function cambiar(estado: "publicada" | "oculta") {
    empezar(async () => {
      const res = await cambiarEstadoResena(r.id, estado);
      avisar(res.error ?? t.hecho[estado], { tipo: res.error ? "error" : "exito" });
    });
  }
  // El modal se abre antes de la acción (no dentro de una transición, que lo dejaría sin abrir)
  async function borrar() {
    if (!(await confirmar({ titulo: t.confirmarBorrar, texto: t.confirmarBorrarTexto, confirmar: t.borrar, peligro: true }))) return;
    empezar(async () => {
      const res = await borrarResena(r.id);
      avisar(res.error ?? t.hecho.borrada, { tipo: res.error ? "error" : "exito" });
    });
  }

  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-teal-oscuro/20 bg-white p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Estrellas valor={r.estrellas} className="size-4" />
        <span className="sr-only">{textos.vitrina.resenas.estrellasDe(r.estrellas)}</span>
        <span className="font-bold">{r.nombre}</span>
        <span className={`rounded-full border border-teal-oscuro/40 px-2.5 py-0.5 text-xs font-bold ${chip[r.estado]}`}>{t.estados[r.estado]}</span>
        <span className="text-xs text-texto-2">
          {t.origen[r.origen]} · {formatearFecha(r.creadoEn)}
        </span>
      </div>
      <p className="text-sm text-texto-2">{r.producto ? `${r.producto.nombre} (#${r.producto.codigo})` : t.deTienda}</p>
      {r.texto && <p className="leading-relaxed">{r.texto}</p>}
      <div className="flex flex-wrap gap-2 pt-1">
        {r.estado !== "publicada" && (
          <button type="button" disabled={pendiente} onClick={() => cambiar("publicada")} className={`${boton} bg-limon`}>
            {t.publicar}
          </button>
        )}
        {r.estado !== "oculta" && (
          <button type="button" disabled={pendiente} onClick={() => cambiar("oculta")} className={boton}>
            {t.ocultar}
          </button>
        )}
        <button type="button" disabled={pendiente} onClick={borrar} className="inline-flex h-10 max-md:min-h-11 items-center rounded-full px-4 text-sm font-medium text-error hover:bg-error-fondo disabled:opacity-50">
          {t.borrar}
        </button>
      </div>
    </li>
  );
}

function NuevaResena({ productos }: { productos: { codigo: number; nombre: string }[] }) {
  const [estado, accion, pendiente] = useActionState<EstadoResenaForm, FormData>(agregarResenaManual, {});
  const formulario = useRef<HTMLFormElement>(null);
  const n = t.nueva;
  return (
    <section aria-labelledby="nueva-resena" className={`${TARJETA} flex flex-col gap-4 bg-crema`}>
      <div>
        <h2 id="nueva-resena" className="font-bold">
          {n.titulo}
        </h2>
        <p className="text-sm text-texto-2">{n.ayuda}</p>
      </div>
      {/* key: al guardar, el formulario arranca limpio */}
      <form key={estado.listo ? "listo" : "editando"} ref={formulario} action={accion} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field etiqueta={n.nombre} name="nombre" required maxLength={60} placeholder={n.nombrePlaceholder} />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{n.producto}</span>
          <Select name="producto" defaultValue="">
            <option value="">{n.tienda}</option>
            {productos.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </label>
        <EstrellasInput etiqueta={n.estrellas} />
        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className="text-sm font-medium">{n.texto}</span>
          <textarea
            name="texto"
            rows={3}
            maxLength={500}
            placeholder={n.textoPlaceholder}
            className="rounded-[14px] border-2 border-borde-control bg-superficie px-4 py-3 text-base placeholder:text-texto-2/60 focus:border-teal"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <Button type="submit" variante="mango" disabled={pendiente}>
            {pendiente ? n.guardando : n.boton}
          </Button>
          {estado.listo && (
            <p role="status" className="text-sm font-medium text-teal">
              {n.listo}
            </p>
          )}
          <MensajeError>{estado.error}</MensajeError>
        </div>
      </form>
    </section>
  );
}

/** Las reseñas de la tienda: las de clientes esperan a que las publiques, y se pueden agregar las propias. */
export function PanelResenas({ resenas, productos }: { resenas: ResenaPanel[]; productos: { codigo: number; nombre: string }[] }) {
  return (
    <div className="flex flex-col gap-4">
      {resenas.length === 0 ? (
        <div className="rounded-[24px] border-2 border-dashed border-teal-oscuro bg-crema p-6">
          <h2 className="font-bold">{t.vacioTitulo}</h2>
          <p className="mt-1 max-w-xl text-texto-2">{t.vacioTexto}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {resenas.map((r) => (
            <FilaResena key={r.id} r={r} />
          ))}
        </ul>
      )}
      <NuevaResena productos={productos} />
    </div>
  );
}
