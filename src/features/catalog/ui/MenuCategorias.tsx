"use client";

import Image from "next/image";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { urlFoto } from "@/lib/fotos";
import { conBusqueda, ruta } from "@/lib/ruta";
import { textos } from "@/lib/textos";
import { destacadosDelMenu, tiendasDelMenu, type DestacadoMenu, type TiendasMenu } from "../actions/menu";
import { RUTA_TIENDAS } from "../explorar";
import { RUBROS } from "../rubros";
import { ESTILO } from "./CirculosCategoria";

const e = textos.explorar.encabezado;
const m = e.menu;
const MAX_SUBS = 9;
const ESPERA_MS = 120;

const foco = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro";
const hrefRubro = (id: string) => ruta(`/marketplace/categoria/${id}`);
const hrefSub = (id: string, sub: string) => conBusqueda(hrefRubro(id), new URLSearchParams({ sub }));

/** Un círculo con el logo de la tienda, o su inicial. */
function Avatar({ logo, nombre, clase }: { logo: string | null; nombre: string; clase: string }) {
  return logo ? (
    <span className={`${clase} relative block shrink-0 overflow-hidden rounded-full bg-white`}>
      <Image src={urlFoto(logo)} alt="" fill sizes="40px" className="object-cover" />
    </span>
  ) : (
    <span aria-hidden="true" className={`${clase} flex shrink-0 items-center justify-center rounded-full bg-accion text-[11px] font-bold text-accion-texto`}>
      {nombre.trim().charAt(0).toUpperCase() || "L"}
    </span>
  );
}

/**
 * El menú "Categorías" del Marketplace. En escritorio: la lista de rubros a la izquierda y, a la derecha, el rubro con sus categorías,
 * tres productos nuevos y la franja de tiendas, sobre un fondo oscuro que cierra al tocarlo. En el celular: pantalla completa con acordeón.
 */
export function MenuCategorias() {
  const [abierto, setAbierto] = useState(false);
  const [rubro, setRubro] = useState<string>(RUBROS[0].id);
  const [movil, setMovil] = useState<string | null>(null);
  const [destacados, setDestacados] = useState<Record<string, DestacadoMenu[]>>({});
  const [tiendas, setTiendas] = useState<TiendasMenu | null>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pedidos = useRef(new Set<string>());
  const activo = RUBROS.find((r) => r.id === rubro) ?? RUBROS[0];

  const cerrar = useCallback((devolverFoco = false) => {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  }, []);

  // "Ver todas" de los círculos de categoría abre este mismo menú
  useEffect(() => {
    const abrir = () => setAbierto(true);
    window.addEventListener("lote:abrir-categorias", abrir);
    return () => window.removeEventListener("lote:abrir-categorias", abrir);
  }, []);

  // Mientras está abierto: Escape cierra y devuelve el foco al botón, y la página de atrás no se desliza
  useEffect(() => {
    if (!abierto) return;
    const tecla = (ev: globalThis.KeyboardEvent) => ev.key === "Escape" && cerrar(true);
    document.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = antes;
    };
  }, [abierto, cerrar]);

  // Las tiendas se piden una vez, al abrir por primera vez
  useEffect(() => {
    if (abierto && !pedidos.current.has("tiendas")) {
      pedidos.current.add("tiendas");
      void tiendasDelMenu().then(setTiendas);
    }
  }, [abierto]);

  // Los destacados del rubro a la vista, una vez por rubro
  useEffect(() => {
    if (!abierto || pedidos.current.has(rubro)) return;
    pedidos.current.add(rubro);
    void destacadosDelMenu(rubro).then((d) => setDestacados((previo) => ({ ...previo, [rubro]: d })));
  }, [abierto, rubro]);

  useEffect(() => () => void (espera.current && clearTimeout(espera.current)), []);

  // Cambiar de categoría con el mouse espera un instante: no parpadea al cruzar la lista en diagonal
  const pasarPor = (id: string) => {
    if (espera.current) clearTimeout(espera.current);
    espera.current = setTimeout(() => setRubro(id), ESPERA_MS);
  };
  const salirDeLista = () => espera.current && clearTimeout(espera.current);

  const alTeclearLista = (ev: KeyboardEvent<HTMLUListElement>) => {
    const filas = [...(lista.current?.querySelectorAll<HTMLAnchorElement>("a") ?? [])];
    const i = filas.indexOf(document.activeElement as HTMLAnchorElement);
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      filas[(i + (ev.key === "ArrowDown" ? 1 : -1) + filas.length) % filas.length]?.focus();
    } else if (ev.key === "ArrowRight") {
      ev.preventDefault();
      panel.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    }
  };
  const alTeclearPanel = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (ev.key !== "ArrowLeft") return;
    ev.preventDefault();
    lista.current?.querySelector<HTMLAnchorElement>(`a[data-rubro="${activo.id}"]`)?.focus();
  };

  const subs = activo.categorias.map(([nombre]) => nombre);
  const hay = destacados[activo.id];
  const aviso = (ev: React.MouseEvent) => (ev.target as HTMLElement).closest("a") && cerrar();

  return (
    <>
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls="menu-categorias"
        onClick={() => setAbierto((a) => !a)}
        className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-teal-oscuro bg-white px-3 text-sm font-bold text-teal-oscuro transition-colors hover:bg-teal-fondo/50 aria-expanded:bg-teal-fondo/60 max-md:order-4 max-md:-ml-1 max-md:border-0 max-md:bg-transparent max-md:font-semibold md:px-4 ${foco}`}
      >
        <LayoutGrid aria-hidden="true" className="size-4 md:hidden" strokeWidth={2.2} />
        <span>{e.categorias}</span>
        <Icon nombre="flecha" className={`size-4 transition-transform duration-200 max-md:hidden ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto && (
        <>
          {/* El fondo oscuro (tinta al 40%) va detrás de la barra y cubre la página; tocarlo cierra el menú */}
          <div aria-hidden="true" onClick={() => cerrar()} className="fixed inset-0 -z-10 bg-teal-oscuro/40 max-md:hidden" />

          <div
            id="menu-categorias"
            role="dialog"
            aria-label={e.categorias}
            onClick={aviso}
            className="z-50 flex flex-col overflow-hidden bg-white max-md:fixed max-md:inset-0 md:absolute md:left-0 md:top-full md:mt-3 md:max-h-[calc(100dvh-6.5rem)] md:w-[min(56rem,100%)] md:flex-row md:rounded-[22px] md:border md:border-teal-oscuro md:shadow-dura"
          >
            {/* Celular: pantalla completa con acordeón, una categoría abierta a la vez */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-teal-oscuro/15 px-4 md:hidden">
              <p className="font-logo text-lg font-bold">{e.categorias}</p>
              <button type="button" onClick={() => cerrar(true)} aria-label={m.cerrar} className={`inline-flex size-11 items-center justify-center rounded-full ${foco}`}>
                <span aria-hidden="true" className="text-2xl leading-none">×</span>
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto p-2 md:hidden">
              {RUBROS.map((r) => {
                const { Icono, fondo } = ESTILO[r.id];
                const abiertoAqui = movil === r.id;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      aria-expanded={abiertoAqui}
                      aria-controls={`acordeon-${r.id}`}
                      onClick={() => setMovil(abiertoAqui ? null : r.id)}
                      className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-semibold ${foco}`}
                    >
                      <span aria-hidden="true" className={`flex size-7 shrink-0 items-center justify-center rounded-full ${fondo}`}>
                        <Icono className="size-4" strokeWidth={2} />
                      </span>
                      <span className="flex-1">{r.nombre}</span>
                      <Icon nombre="flecha" className={`size-4 transition-transform ${abiertoAqui ? "rotate-180" : ""}`} />
                    </button>
                    {abiertoAqui && (
                      <ul id={`acordeon-${r.id}`} className="mb-2 ml-[52px] flex flex-col">
                        <li>
                          <Link href={hrefRubro(r.id)} className={`flex min-h-11 items-center rounded-lg text-[15px] font-extrabold text-teal-oscuro ${foco}`}>
                            {e.verTodo(r.nombre)} →
                          </Link>
                        </li>
                        {r.categorias.map(([nombre]) => (
                          <li key={nombre}>
                            <Link href={hrefSub(r.id, nombre)} rel="nofollow" className={`flex min-h-11 items-center rounded-lg text-[15px] font-medium text-teal-oscuro ${foco}`}>
                              {nombre}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Escritorio: los rubros a la izquierda; al pasar o enfocar uno, a la derecha aparece su contenido */}
            <ul
              ref={lista}
              onKeyDown={alTeclearLista}
              onMouseLeave={salirDeLista}
              className="hidden w-64 shrink-0 flex-col overflow-y-auto bg-teal-fondo/40 p-2 [scrollbar-color:rgba(0,56,68,0.25)_transparent] [scrollbar-width:thin] md:flex"
            >
              {RUBROS.map((r) => {
                const { Icono, fondo } = ESTILO[r.id];
                const esActivo = r.id === activo.id;
                return (
                  <li key={r.id}>
                    <Link
                      href={hrefRubro(r.id)}
                      data-rubro={r.id}
                      onMouseEnter={() => pasarPor(r.id)}
                      onFocus={() => setRubro(r.id)}
                      className={`flex h-11 items-center gap-3 rounded-xl border-2 px-2.5 text-[15px] font-semibold ${foco} ${esActivo ? "border-teal-oscuro bg-white" : "border-transparent hover:bg-white/70"}`}
                    >
                      <span aria-hidden="true" className={`flex size-7 shrink-0 items-center justify-center rounded-full ${fondo} text-teal-oscuro`}>
                        <Icono className="size-4" strokeWidth={2} />
                      </span>
                      <span className="flex-1 truncate">{r.nombre}</span>
                      <Icon nombre="flecha" className={`size-4 -rotate-90 ${esActivo ? "text-mango" : "text-texto-2/60"}`} />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div ref={panel} onKeyDown={alTeclearPanel} className="hidden min-w-0 flex-1 flex-col justify-between gap-5 overflow-y-auto md:flex">
              <div className="flex flex-col gap-5 p-6 pb-0">
                <Link href={hrefRubro(activo.id)} className={`inline-flex items-center gap-2 self-start rounded font-logo text-[20px] font-extrabold leading-tight text-teal-oscuro hover:underline ${foco}`}>
                  {e.verTodo(activo.nombre)}
                  <Icon nombre="flecha" className="size-5 -rotate-90 text-mango" />
                </Link>
                <ul className="grid grid-cols-3 gap-x-3 gap-y-0.5">
                  {subs.slice(0, MAX_SUBS).map((nombre) => (
                    <li key={nombre}>
                      <Link href={hrefSub(activo.id, nombre)} rel="nofollow" className={`block rounded-lg px-2 py-1.5 text-[15px] font-medium text-teal-oscuro transition-colors hover:bg-crema hover:underline ${foco}`}>
                        {nombre}
                      </Link>
                    </li>
                  ))}
                  {subs.length > MAX_SUBS && (
                    <li>
                      <Link href={hrefRubro(activo.id)} className={`block rounded-lg px-2 py-1.5 text-[15px] font-bold text-teal underline ${foco}`}>
                        {m.verTodas}
                      </Link>
                    </li>
                  )}
                </ul>

                {/* Productos reales de la categoría; sin ninguno, la fila no aparece */}
                {hay === undefined ? (
                  <div aria-hidden="true" className="grid grid-cols-3 gap-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-[168px] animate-pulse rounded-2xl bg-teal-fondo/60" />
                    ))}
                  </div>
                ) : (
                  hay.length > 0 && (
                    <section aria-label={m.destacadosEn(activo.nombre)} className="flex flex-col gap-2">
                      <h3 className="text-sm font-extrabold text-teal-oscuro">{m.destacadosEn(activo.nombre)}</h3>
                      <ul className="grid grid-cols-3 gap-3">
                        {hay.map((p) => (
                          <li key={`${p.tiendaSlug}-${p.codigo}`} className="min-w-0">
                            <Link href={ruta(`/c/${p.tiendaSlug}/${p.codigo}`)} className={`group flex flex-col gap-1.5 rounded-2xl ${foco}`}>
                              <span className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-teal-fondo">
                                {p.foto && <Image src={urlFoto(p.foto)} alt="" fill sizes="180px" className="object-cover transition-transform duration-200 group-hover:scale-105" />}
                              </span>
                              <span className="truncate text-sm font-bold text-teal-oscuro group-hover:underline">{p.nombre}</span>
                              <span className="flex items-center gap-1.5 text-sm text-texto-2">
                                <span className="font-extrabold tabular-nums text-teal-oscuro">{p.precio}</span>
                                <Avatar logo={p.tiendaLogo} nombre={p.tiendaNombre} clase="size-5" />
                                <span className="truncate text-xs">{p.tiendaNombre}</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )
                )}
              </div>

              {tiendas && tiendas.total > 0 && (
                <div className="flex items-center gap-4 bg-limon px-6 py-3.5">
                  <div aria-hidden="true" className="flex items-center pl-2">
                    {tiendas.tiendas.map((t) => (
                      <Avatar key={t.slug} logo={t.logo} nombre={t.nombre} clase="-ml-2 size-9 border-2 border-limon" />
                    ))}
                  </div>
                  <p className="flex-1 font-logo text-base font-extrabold text-teal-oscuro">{m.tiendas(tiendas.total)}</p>
                  <Link href={RUTA_TIENDAS} className={`inline-flex h-10 items-center rounded-full bg-teal-oscuro px-5 text-sm font-bold text-white ${foco}`}>
                    {m.verTiendas}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
