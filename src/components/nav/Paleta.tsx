"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, type NombreIcono } from "@/components/ui/Icon";
import { buscarEnLote, type ResultadosBusqueda } from "@/features/search/actions/buscar";
import { textos } from "@/lib/textos";
import { accionesDe, PANTALLAS } from "./acciones";

const t = textos.nav.paleta;

type Opcion = { clave: string; grupo: string; titulo: string; detalle?: string; href: string; icono: NombreIcono };

const normalizar = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** El buscador de todo (⌘K): acciones y pantallas al instante, y productos, clientes y pedidos mientras escribís. */
export function Paleta({ cerrar, tieneLocal }: { cerrar: () => void; tieneLocal: boolean }) {
  const router = useRouter();
  const [consulta, setConsulta] = useState("");
  const [encontrado, setEncontrado] = useState<ResultadosBusqueda | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [activa, setActiva] = useState(0);
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => {
    entrada.current?.focus();
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = antes;
    };
  }, []);

  // Busca un instante después de que dejás de escribir; si llega otra tecla, la anterior se descarta.
  useEffect(() => {
    if (consulta.trim().length < 2) return;
    let vigente = true;
    const id = setTimeout(() => {
      setBuscando(true);
      buscarEnLote(consulta)
        .then((r) => vigente && setEncontrado(r))
        .catch(() => vigente && setEncontrado(null))
        .finally(() => vigente && setBuscando(false));
    }, 200);
    return () => {
      vigente = false;
      clearTimeout(id);
    };
  }, [consulta]);

  const opciones = useMemo<Opcion[]>(() => {
    const q = normalizar(consulta.trim());
    const locales: Opcion[] = [
      ...accionesDe(tieneLocal).map((a) => ({ clave: `a-${a.href}`, grupo: textos.nav.rapida.titulo, titulo: a.etiqueta, href: a.href, icono: a.icono })),
      ...PANTALLAS.map((p) => ({ clave: `p-${p.href}`, grupo: t.acciones, titulo: p.etiqueta, href: p.href, icono: p.icono })),
    ].filter((o) => !q || normalizar(o.titulo).includes(q));
    const remotos: Opcion[] =
      q.length >= 2 && encontrado
        ? [
            ...encontrado.productos.map((r) => ({ ...r, clave: `pr-${r.clave}`, grupo: t.productos, icono: "productos" as const })),
            ...encontrado.clientes.map((r) => ({ ...r, clave: `cl-${r.clave}`, grupo: t.clientes, icono: "clientes" as const })),
            ...encontrado.pedidos.map((r) => ({ ...r, clave: `pe-${r.clave}`, grupo: t.pedidos, icono: "pedidos" as const })),
          ]
        : [];
    return [...remotos, ...locales];
  }, [consulta, encontrado, tieneLocal]);

  const ir = (o: Opcion) => {
    cerrar();
    router.push(o.href);
  };

  const alTeclear = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return cerrar();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiva((a) => Math.min(a + 1, opciones.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiva((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && opciones[activa]) {
      e.preventDefault();
      ir(opciones[activa]);
    }
  };

  let grupoAnterior = "";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-teal-oscuro/40 px-3 pt-[12vh]" onMouseDown={cerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.titulo}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={alTeclear}
        className="flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-superficie shadow-dura"
      >
        <div className="flex items-center gap-3 border-b-2 border-teal-oscuro/15 px-4">
          <Icon nombre="buscar" className="size-5 shrink-0 text-texto-2" />
          <input
            ref={entrada}
            value={consulta}
            onChange={(e) => {
              setConsulta(e.target.value);
              setActiva(0);
              if (e.target.value.trim().length < 2) setEncontrado(null);
            }}
            placeholder={t.placeholder}
            aria-label={t.titulo}
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-texto-2"
          />
          <kbd className="hidden rounded-md border border-borde px-1.5 py-0.5 text-xs text-texto-2 sm:block">Esc</kbd>
        </div>
        <ul className="flex flex-col overflow-y-auto p-2" role="listbox" aria-label={t.titulo}>
          {opciones.map((o, i) => {
            const titulo = o.grupo !== grupoAnterior;
            grupoAnterior = o.grupo;
            return (
              <li key={o.clave} role="presentation">
                {titulo && <p className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-texto-2">{o.grupo}</p>}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === activa}
                  onMouseEnter={() => setActiva(i)}
                  onClick={() => ir(o)}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left ${i === activa ? "bg-teal-fondo" : ""}`}
                >
                  <Icon nombre={o.icono} className="size-5 shrink-0 text-teal" />
                  <span className="min-w-0 flex-1 truncate font-medium">{o.titulo}</span>
                  {o.detalle && <span className="shrink-0 truncate text-sm text-texto-2">{o.detalle}</span>}
                </button>
              </li>
            );
          })}
          {opciones.length === 0 && <li className="px-3 py-6 text-center text-texto-2">{buscando ? t.buscando : t.sinResultados}</li>}
        </ul>
        <p className="hidden border-t-2 border-teal-oscuro/15 px-4 py-2 text-xs text-texto-2 sm:block">{t.ayuda}</p>
      </div>
    </div>
  );
}
