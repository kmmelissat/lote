"use client";

import { useMemo, useState } from "react";
import { contactoGuardable, contactoParaEscribir, limpiarContactoEscrito, normalizarTexto, type TipoContacto } from "@/domain";
import { Icon } from "@/components/ui/Icon";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { ClienteParaVender } from "@/features/customers/repositorio";
import type { CanalDeVenta } from "../plan";

export type { CanalDeVenta };

const t = textos.pedidos.form;
const tm = textos.mostrador.cliente;

const CANALES: CanalDeVenta[] = ["instagram", "whatsapp"];
const campo = "h-11 w-full rounded-[14px] border bg-superficie px-3.5 text-sm outline-none focus:border-teal";
const prefijo = "flex h-11 items-center rounded-l-[14px] border border-r-0 border-linea bg-gris-50 px-3 text-sm font-medium text-texto-2";

/** Lo que se escribió en cada modo de contacto, ya limpio. Se guarda como "+503 7000 1234", "@usuario" o el correo. */
export type ContactosEscritos = Record<TipoContacto, string>;
export const SIN_CONTACTOS: ContactosEscritos = { telefono: "", usuario: "", correo: "" };

/** Lo que ya se puede guardar de cada uno y si alguno quedó a medias. */
export function contactosGuardables(c: ContactosEscritos) {
  const telefono = contactoGuardable("telefono", c.telefono);
  const usuario = contactoGuardable("usuario", c.usuario);
  const correo = contactoGuardable("correo", c.correo);
  const incompleto = (["telefono", "usuario", "correo"] as const).some((k) => c[k].trim() !== "" && { telefono, usuario, correo }[k] === "");
  return { telefono, usuario, correo, incompleto, hay: Boolean(telefono || usuario || correo) };
}

const MAXIMO_SUGERENCIAS = 5;

/**
 * Para quién es la venta, todo a la vista: el nombre (con sugerencias de clientas que ya existen y cuánto deben) y las tres
 * formas de contactarla: teléfono, usuario y correo. Se llena la que haya; no hace falta ninguna.
 */
export function ClienteDeVenta({
  clientes,
  apartado,
  cliente,
  cambiarCliente,
  contactos,
  cambiarContactos,
  acepta,
  cambiarAcepta,
  canal,
  cambiarCanal,
  modoChat,
}: {
  clientes: ClienteParaVender[];
  apartado: boolean;
  cliente: string;
  cambiarCliente: (v: string) => void;
  contactos: ContactosEscritos;
  cambiarContactos: (nuevos: ContactosEscritos) => void;
  acepta: boolean;
  cambiarAcepta: (v: boolean) => void;
  canal: CanalDeVenta;
  cambiarCanal: (c: CanalDeVenta) => void;
  /** El canal solo se pregunta en un pedido de chat; en persona es "en persona" */
  modoChat: boolean;
}) {
  const [enfocado, setEnfocado] = useState(false);
  const [correoAbierto, setCorreoAbierto] = useState(false);
  const verCorreo = correoAbierto || contactos.correo.trim() !== "";
  const q = normalizarTexto(cliente.trim());
  const existente = useMemo(() => clientes.find((c) => normalizarTexto(c.nombre) === q), [clientes, q]);
  const sugerencias = useMemo(
    () => (q && !existente ? clientes.filter((c) => normalizarTexto(c.nombre).includes(q)).slice(0, MAXIMO_SUGERENCIAS) : []),
    [clientes, q, existente],
  );
  const g = contactosGuardables(contactos);

  function escribir(tipo: TipoContacto, texto: string) {
    cambiarContactos({ ...contactos, [tipo]: limpiarContactoEscrito(tipo, texto) });
  }

  function elegir(c: ClienteParaVender) {
    cambiarCliente(c.nombre);
    // Lo que ya se sabe de ella se llena solo; lo que ya escribiste no se pisa
    const guardado = c.contacto ? contactoParaEscribir(c.contacto) : null;
    const delUsuario = c.usuario ? contactoParaEscribir(c.usuario) : null;
    cambiarContactos({
      telefono: contactos.telefono || (guardado?.tipo === "telefono" ? guardado.texto : ""),
      usuario: contactos.usuario || (guardado?.tipo === "usuario" ? guardado.texto : (delUsuario?.texto ?? "")),
      correo: contactos.correo || (guardado?.tipo === "correo" ? guardado.texto : (c.correo ?? "")),
    });
    setEnfocado(false);
  }

  const borde = (incompleto: boolean) => (incompleto ? "border-error" : "border-linea");
  const telefonoMal = contactos.telefono.trim() !== "" && g.telefono === "";
  const usuarioMal = contactos.usuario.trim() !== "" && g.usuario === "";
  const correoMal = contactos.correo.trim() !== "" && g.correo === "";

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex flex-col gap-1">
        <label htmlFor="cliente-nombre" className="text-xs font-medium text-texto-2">
          {tm.nombre}
        </label>
        <input
          id="cliente-nombre"
          value={cliente}
          onChange={(e) => cambiarCliente(e.target.value)}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setTimeout(() => setEnfocado(false), 150)}
          maxLength={80}
          autoComplete="off"
          role="combobox"
          aria-expanded={enfocado && sugerencias.length > 0}
          aria-controls="sugerencias-clientes"
          placeholder={apartado ? tm.placeholderApartado : tm.placeholder}
          className={`${campo} border-linea`}
        />
        {enfocado && sugerencias.length > 0 && (
          <ul id="sugerencias-clientes" role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-linea bg-superficie shadow-md">
            {sugerencias.map((c) => (
              <li key={c.nombre} role="option" aria-selected="false">
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => elegir(c)} className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-gris-50">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{c.nombre}</span>
                    {(c.contacto || c.usuario || c.correo) && <span className="block truncate text-texto-2">{[c.contacto, c.usuario, c.correo].filter(Boolean).join(" · ")}</span>}
                  </span>
                  {c.saldo > 0 && <span className="shrink-0 font-semibold tabular-nums text-error">{tm.debe(formatearDolares(c.saldo))}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {existente && (
        <p className="rounded-[14px] bg-gris-50 px-3 py-2 text-sm">
          <span className="font-semibold">{tm.yaEs}</span> · {tm.pedidos(existente.pedidos)}
          {existente.saldo > 0 && <span className="font-semibold text-error"> · {tm.debe(formatearDolares(existente.saldo))}</span>}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium text-texto-2">{tm.contacto.telefono}</span>
          <span className="flex">
            <span className={prefijo}>+503</span>
            <input
              value={contactos.telefono}
              onChange={(e) => escribir("telefono", e.target.value)}
              inputMode="numeric"
              autoComplete="off"
              placeholder={tm.contacto.placeholder.telefono}
              className={`h-11 min-w-0 flex-1 rounded-r-[14px] border bg-superficie px-3 text-sm tabular-nums outline-none focus:border-teal ${borde(telefonoMal)}`}
            />
          </span>
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium text-texto-2">{tm.contacto.usuario}</span>
          <span className="flex">
            <span className={prefijo}>@</span>
            <input
              value={contactos.usuario}
              onChange={(e) => escribir("usuario", e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder={tm.contacto.placeholder.usuario}
              className={`h-11 min-w-0 flex-1 rounded-r-[14px] border bg-superficie px-3 text-sm outline-none focus:border-teal ${borde(usuarioMal)}`}
            />
          </span>
        </label>
      </div>
      {verCorreo ? (
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-texto-2">{tm.contacto.correo}</span>
        <input
          type="email"
          value={contactos.correo}
          onChange={(e) => escribir("correo", e.target.value)}
          inputMode="email"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={tm.contacto.placeholder.correo}
          className={`${campo} ${borde(correoMal)}`}
        />
      </label>
      ) : (
        <button type="button" onClick={() => setCorreoAbierto(true)} className="flex min-h-9 w-fit items-center gap-1.5 text-sm font-medium text-teal">
          <Icon nombre="mas" className="size-4" />
          {tm.agregarCorreo}
        </button>
      )}
      {telefonoMal && <p className="text-sm text-error">{tm.contacto.invalido.telefono}</p>}
      {usuarioMal && <p className="text-sm text-error">{tm.contacto.invalido.usuario}</p>}
      {correoMal && <p className="text-sm text-error">{tm.contacto.invalido.correo}</p>}

      {g.telefono && (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-linea bg-gris-50 p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal">
          <input type="checkbox" checked={acepta} onChange={(e) => cambiarAcepta(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-teal" />
          <span className="flex flex-col">
            <span className="text-sm font-semibold">{t.acepta}</span>
            <span className="text-xs text-texto-2">{t.aceptaAyuda}</span>
          </span>
        </label>
      )}
      {modoChat && (
        <div role="radiogroup" aria-labelledby="canal-venta" className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 text-sm">
          <span id="canal-venta" className="text-texto-2">
            {t.canal}
          </span>
          {CANALES.map((c) => (
            <label key={c} className="flex min-h-9 cursor-pointer items-center gap-2">
              <input type="radio" name="canal-venta" checked={canal === c} onChange={() => cambiarCanal(c)} className="size-4 accent-teal" />
              {textos.pedidos.canales[c]}
            </label>
          ))}
        </div>
      )}

    </div>
  );
}
