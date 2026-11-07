"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Clock, Store, X } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { urlFoto } from "@/lib/fotos";
import { conBusqueda } from "@/lib/ruta";
import { textos } from "@/lib/textos";
import { categoriasPopulares } from "../actions/buscar";
import { trozosResaltados, type SugerenciaCategoria } from "../busqueda";
import { RUTA_TIENDAS } from "../explorar";
import { guardarRecientes, leerRecientes, MAX_RECIENTES } from "./busquedasRecientes";
import { ESTILO } from "./CirculosCategoria";
import { useSugerencias } from "./useSugerencias";

const t = textos.explorar;
const b = t.buscador;

const contenedor = "max-md:order-3 h-12 w-full md:h-11 md:w-auto md:min-w-0 md:flex-1";
const claseCampo = "h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-texto-2/70 [&::-webkit-search-cancel-button]:hidden";
const claseForm =
  "flex h-full w-full items-center overflow-hidden rounded-full border border-teal-oscuro bg-white focus-within:ring-2 focus-within:ring-accion";
const fila =
  "flex min-h-12 w-full items-center gap-3 rounded-[12px] px-2 py-1.5 text-left text-[15px] text-texto aria-selected:bg-teal-fondo hover:bg-teal-fondo/60";

const hrefBusqueda = (q: string): Route => conBusqueda("/marketplace", new URLSearchParams({ q }));

/** El nombre con lo que se escribió en negrita (sin importar tildes, mayúsculas ni plurales simples). */
const resaltar = (texto: string, q: string): ReactNode =>
  trozosResaltados(texto, q).map((t, i) =>
    t.marcado ? (
      <strong key={i} className="font-extrabold">
        {t.texto}
      </strong>
    ) : (
      <span key={i}>{t.texto}</span>
    ),
  );

type Opcion = { href: Route; reciente?: string };

/**
 * El buscador del encabezado con sugerencias (patrón combobox). Vacío y enfocado: búsquedas recientes y categorías populares.
 * Desde 2 letras (con 200 ms de espera): productos, tiendas y categorías. Enter sin elegir nada va a la búsqueda de siempre.
 */
export function BuscadorAutocompletar() {
  return (
    <Suspense
      fallback={
        <div className={contenedor}>
          <form action="/marketplace" role="search" className={claseForm}>
            <input type="search" name="q" aria-label={t.buscar} placeholder={t.buscar} className={claseCampo} />
          </form>
        </div>
      }
    >
      <Lector />
    </Suspense>
  );
}

function Lector() {
  const q = useSearchParams().get("q") ?? "";
  return <Buscador key={q} inicial={q} />;
}

function Buscador({ inicial }: { inicial: string }) {
  const router = useRouter();
  const id = useId();
  const listaId = `${id}-lista`;
  const raiz = useRef<HTMLDivElement>(null);
  const [texto, setTexto] = useState(inicial);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const [recientes, setRecientes] = useState<string[]>([]);
  const [populares, setPopulares] = useState<SugerenciaCategoria[]>([]);

  const q = texto.trim().replace(/\s+/g, " ");
  const buscando = q.length >= 2;

  const resultado = useSugerencias(q, buscando && abierto);

  // Se cierra al tocar fuera
  useEffect(() => {
    if (!abierto) return;
    const alTocar = (e: PointerEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", alTocar);
    return () => document.removeEventListener("pointerdown", alTocar);
  }, [abierto]);

  const abrir = () => {
    setAbierto(true);
    setRecientes(leerRecientes());
    if (populares.length === 0) categoriasPopulares(6).then(setPopulares);
  };
  const recordar = (palabra: string) => {
    const limpia = palabra.trim().replace(/\s+/g, " ");
    if (limpia.length < 2) return;
    const lista = [limpia, ...leerRecientes().filter((r) => r.toLowerCase() !== limpia.toLowerCase())].slice(0, MAX_RECIENTES);
    guardarRecientes(lista);
    setRecientes(lista);
  };
  const quitar = (palabra: string) => {
    const lista = leerRecientes().filter((r) => r !== palabra);
    guardarRecientes(lista);
    setRecientes(lista);
    setActivo(-1);
  };
  const borrarTodo = () => {
    guardarRecientes([]);
    setRecientes([]);
    setActivo(-1);
  };

  // Lo que se muestra: las sugerencias de esta búsqueda (o las anteriores mientras llegan las nuevas)
  const data = buscando ? (resultado?.data ?? null) : null;
  const cargando = buscando && resultado?.q !== q;
  const sinNada = !!data && !cargando && !data.productos.length && !data.tiendas.length && !data.categorias.length;

  // La lista plana de filas, en el orden en que se ven: así las flechas cruzan los grupos
  const opciones: Opcion[] = [];
  const agregar = (o: Opcion) => opciones.push(o) - 1;
  const iRecientes = !buscando ? recientes.map((r) => agregar({ href: hrefBusqueda(r), reciente: r })) : [];
  const iPopulares = !buscando ? populares.map((c) => agregar({ href: c.href })) : [];
  const iProductos = data ? data.productos.map((p) => agregar({ href: p.href })) : [];
  const iTiendas = data ? data.tiendas.map((x) => agregar({ href: x.href })) : [];
  const iCategorias = data ? data.categorias.map((c) => agregar({ href: c.href })) : [];
  const iAlternativas = sinNada ? data.alternativas.map((c) => agregar({ href: c.href })) : [];
  const iTodasTiendas = sinNada ? agregar({ href: RUTA_TIENDAS }) : -1;
  const iVerTodos = buscando ? agregar({ href: hrefBusqueda(q) }) : -1;

  const opcionId = (i: number) => `${id}-op-${i}`;
  const hayPanel = abierto && (!buscando ? recientes.length > 0 || populares.length > 0 : true);
  const cuenta = data ? data.productos.length + data.tiendas.length + data.categorias.length : 0;

  const ir = (href: Route) => {
    if (buscando) recordar(q);
    setAbierto(false);
    router.push(href);
  };

  const alTeclear = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (abierto) {
        e.preventDefault();
        setAbierto(false);
        setActivo(-1);
      }
    } else if (e.key === "Tab") {
      setAbierto(false);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!abierto) return abrir();
      if (opciones.length === 0) return;
      const paso = e.key === "ArrowDown" ? 1 : -1;
      setActivo((a) => (a === -1 ? (paso === 1 ? 0 : opciones.length - 1) : (a + paso + opciones.length) % opciones.length));
    } else if (e.key === "Enter" && abierto && activo >= 0 && opciones[activo]) {
      e.preventDefault();
      ir(opciones[activo].href);
    } else if ((e.key === "Delete" || e.key === "Backspace") && abierto && !buscando && opciones[activo]?.reciente && !e.currentTarget.value) {
      e.preventDefault();
      quitar(opciones[activo].reciente!);
    }
  };

  // El elegido siempre a la vista dentro de la lista con scroll
  useEffect(() => {
    if (activo >= 0) document.getElementById(`${id}-op-${activo}`)?.scrollIntoView({ block: "nearest" });
  }, [activo, id]);

  const titulo = (texto: string, idGrupo: string) => (
    <p id={idGrupo} className="px-2 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-texto-2">
      {texto}
    </p>
  );
  const grupo = (idGrupo: string, nombre: string, hijos: ReactNode) => (
    <div role="group" aria-labelledby={idGrupo}>
      {titulo(nombre, idGrupo)}
      {hijos}
    </div>
  );
  const circulo = (c: SugerenciaCategoria) => {
    const { Icono, fondo } = ESTILO[c.rubro];
    return (
      <span aria-hidden="true" className={`flex size-11 shrink-0 items-center justify-center rounded-full text-teal-oscuro ${fondo}`}>
        <Icono className="size-5" strokeWidth={2} />
      </span>
    );
  };
  const opcionProps = (i: number) => ({
    id: opcionId(i),
    role: "option" as const,
    "aria-selected": activo === i,
    tabIndex: -1,
    onMouseMove: () => activo !== i && setActivo(i),
    onClick: () => buscando && recordar(q),
  });

  return (
    <div ref={raiz} className={`relative ${contenedor}`}>
      {abierto && <div aria-hidden="true" className="fixed inset-0 -z-10 bg-teal-oscuro/40 md:hidden" />}
      <div className={abierto ? "max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:z-10 max-md:bg-fondo max-md:p-4 max-md:pb-3 max-md:shadow-dura-chica md:h-full" : "h-full"}>
        <form
          action="/marketplace"
          role="search"
          onSubmit={() => {
            recordar(q);
            setAbierto(false);
          }}
          className={`${claseForm} max-md:h-12 md:h-full`}
        >
          <input
            type="search"
            name="q"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setActivo(-1);
              if (!abierto) abrir();
            }}
            onFocus={() => !abierto && abrir()}
            onKeyDown={alTeclear}
            role="combobox"
            aria-expanded={hayPanel}
            aria-controls={listaId}
            aria-autocomplete="list"
            aria-activedescendant={hayPanel && activo >= 0 ? opcionId(activo) : undefined}
            aria-label={t.buscar}
            placeholder={t.buscar}
            autoComplete="off"
            enterKeyHint="search"
            className={claseCampo}
          />
          {texto && (
            <button
              type="button"
              aria-label={b.cerrar}
              onClick={() => {
                setTexto("");
                setActivo(-1);
                document.querySelector<HTMLInputElement>(`[aria-controls="${listaId}"]`)?.focus();
              }}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-texto-2 hover:bg-teal-fondo"
            >
              <X className="size-4" />
            </button>
          )}
          <button type="submit" aria-label={t.buscarBoton} className="mr-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accion text-accion-texto transition-transform hover:-translate-y-0.5 md:size-9">
            <Icon nombre="buscar" className="size-5" />
          </button>
        </form>

        <div
          hidden={!hayPanel}
          className="z-20 mt-2 max-h-[70vh] overflow-y-auto overscroll-contain rounded-[20px] border-2 border-teal-oscuro bg-white p-2 shadow-[0_12px_32px_-8px_rgba(10,60,64,0.28)] md:absolute md:inset-x-0 md:top-full"
        >
          <p className="sr-only" aria-live="polite">
            {hayPanel && buscando && !cargando ? b.anuncio(cuenta) : ""}
          </p>
          <div id={listaId} role="listbox" aria-label={b.lista} aria-busy={cargando}>
            {!buscando && (
              <>
                {recientes.length > 0 && (
                  <div role="group" aria-labelledby={`${id}-rec`}>
                    <div className="flex items-center justify-between pr-2">
                      {titulo(b.recientes, `${id}-rec`)}
                      <button type="button" onClick={borrarTodo} className="pt-2 text-xs font-bold text-teal underline">
                        {b.borrarTodo}
                      </button>
                    </div>
                    {recientes.map((r, k) => (
                      <div key={r} className="flex items-center">
                        <Link href={hrefBusqueda(r)} {...opcionProps(iRecientes[k])} className={`${fila} min-w-0 flex-1`}>
                          <Clock aria-hidden="true" className="size-4 shrink-0 text-texto-2" />
                          <span className="truncate">{r}</span>
                        </Link>
                        <button type="button" aria-label={b.quitar(r)} onClick={() => quitar(r)} className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-texto-2 hover:bg-teal-fondo">
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {populares.length > 0 && (
                  <div role="group" aria-labelledby={`${id}-pop`}>
                    {titulo(b.populares, `${id}-pop`)}
                    <div className="flex flex-wrap gap-2 px-2 pb-2">
                      {populares.map((c, k) => (
                        <Link
                          key={c.href}
                          href={c.href}
                          {...opcionProps(iPopulares[k])}
                          className="inline-flex min-h-11 items-center rounded-full border border-teal-oscuro bg-white px-4 text-sm font-bold text-teal-oscuro aria-selected:bg-teal-fondo hover:bg-teal-fondo/60"
                        >
                          {c.nombre}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {buscando && cargando && !data && (
              <div role="presentation" aria-label={b.cargando} className="flex flex-col gap-1 p-1">
                {[0, 1, 2].map((k) => (
                  <div key={k} className="flex min-h-12 animate-pulse items-center gap-3 px-2">
                    <span className="size-11 shrink-0 rounded-[10px] bg-teal-fondo" />
                    <span className="flex flex-1 flex-col gap-1.5">
                      <span className="h-3.5 w-2/3 rounded bg-teal-fondo" />
                      <span className="h-3 w-1/3 rounded bg-teal-fondo/70" />
                    </span>
                  </div>
                ))}
              </div>
            )}

            {data && data.productos.length > 0 &&
              grupo(
                `${id}-g-prod`,
                b.productos,
                data.productos.map((p, k) => (
                  <Link key={p.href} href={p.href} {...opcionProps(iProductos[k])} className={fila}>
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-[10px] bg-crema">
                      {p.foto && <Image src={urlFoto(p.foto)} alt="" fill sizes="44px" className="object-cover" />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{resaltar(p.nombre, q)}</span>
                      <span className="truncate text-sm text-texto-2">
                        <span className="font-bold text-texto">{p.precio}</span> · {p.tienda}
                      </span>
                    </span>
                  </Link>
                )),
              )}

            {data && data.tiendas.length > 0 &&
              grupo(
                `${id}-g-tiendas`,
                b.tiendas,
                data.tiendas.map((x, k) => (
                  <Link key={x.href} href={x.href} {...opcionProps(iTiendas[k])} className={fila}>
                    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-crema text-teal-oscuro">
                      {x.logo ? <Image src={urlFoto(x.logo)} alt="" fill sizes="44px" className="object-cover" /> : <Store aria-hidden="true" className="size-5" />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{resaltar(x.nombre, q)}</span>
                      <span className="truncate text-sm text-texto-2">{b.productosDe(x.productos)}</span>
                    </span>
                  </Link>
                )),
              )}

            {data && data.categorias.length > 0 &&
              grupo(
                `${id}-g-cat`,
                b.categorias,
                data.categorias.map((c, k) => (
                  <Link key={c.href} href={c.href} {...opcionProps(iCategorias[k])} className={fila}>
                    {circulo(c)}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{resaltar(c.nombre, q)}</span>
                      {c.enRubro && <span className="truncate text-sm text-texto-2">{b.enRubro(c.enRubro)}</span>}
                    </span>
                  </Link>
                )),
              )}

            {sinNada && (
              <div className="flex flex-col gap-1 pb-1">
                <p className="px-2 pt-3 text-base font-bold">{b.nada(q)}</p>
                {data.alternativas.length > 0 &&
                  grupo(
                    `${id}-g-alt`,
                    b.nadaTexto,
                    data.alternativas.map((c, k) => (
                      <Link key={c.href} href={c.href} {...opcionProps(iAlternativas[k])} className={fila}>
                        {circulo(c)}
                        <span className="truncate">{c.nombre}</span>
                      </Link>
                    )),
                  )}
                <Link href={RUTA_TIENDAS} {...opcionProps(iTodasTiendas)} className={`${fila} font-bold text-teal`}>
                  {b.todasLasTiendas}
                  <ArrowRight aria-hidden="true" className="ml-auto size-4" />
                </Link>
              </div>
            )}

            {buscando && (
              <Link href={hrefBusqueda(q)} {...opcionProps(iVerTodos)} className={`${fila} mt-1 border-t border-teal-oscuro/15 font-bold text-teal-oscuro`}>
                <span className="min-w-0 flex-1 truncate">{b.verTodos(q)}</span>
                <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
