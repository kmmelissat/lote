"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BotonPunch } from "@/components/ui/BotonesPunch";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { pocoStock } from "@/domain";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { filtrarProductos, FILTROS_ESTADO, ordenarGrupos, ORDENES, resumenDeInventario, type Falta, type FiltroEstado, type Orden } from "../filtro";
import type { Producto } from "../repositorio";
import { agruparProductos, type GrupoProducto } from "../variantes";
import { ResumenInventario } from "./ResumenInventario";
import { CampoBusqueda } from "@/components/ui/CampoBusqueda";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";

const t = textos.productos;

function nombreDelFiltro(e: FiltroEstado) {
  if (e === "todos") return t.buscar.todos;
  if (e === "poco") return t.buscar.poco;
  return textos.estadosProducto[e];
}

type ResumenStock = { disponibles: number; apartadas: number; poco: boolean };

// Stock: chip con el estado del producto (los mismos que las pestañas; amarillo si queda poco —el umbral es el del negocio—) y debajo cuánto queda.
function Stock({ disponibles, apartadas, poco }: ResumenStock) {
  const estado = disponibles > 0 ? "disponible" : apartadas > 0 ? "apartado" : "vendido";
  const seAcaba = poco && disponibles > 0;
  const tono =
    estado === "vendido"
      ? "bg-gris-100 text-chip-texto-neutro"
      : estado === "apartado"
        ? "bg-chip-amarillo text-chip-texto-amarillo"
        : poco
          ? "bg-chip-amarillo text-chip-texto-amarillo"
          : "bg-chip-celeste text-chip-texto-celeste";
  return (
    <span className="flex flex-col items-start gap-1">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${tono}`}>
        {seAcaba && (
          <span aria-hidden="true" className="relative flex size-2">
            <span className="absolute inline-flex size-full rounded-full bg-ambar opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-ambar" />
          </span>
        )}
        {seAcaba ? t.buscar.poco : textos.estadosProducto[estado]}
      </span>
      {(disponibles > 0 || apartadas > 0) && (
        <span className="text-xs text-texto-2">{[disponibles > 0 && t.quedan(disponibles), apartadas > 0 && t.lista.apartadas(apartadas)].filter(Boolean).join(" · ")}</span>
      )}
    </span>
  );
}

const stockDe = (p: Producto, umbral: number): ResumenStock => ({
  disponibles: p.disponibles,
  apartadas: p.apartadas,
  poco: pocoStock(p, umbral),
});

const stockDelGrupo = (g: GrupoProducto, umbral: number): ResumenStock => ({
  disponibles: g.miembros.reduce((suma, m) => suma + m.disponibles, 0),
  apartadas: g.miembros.reduce((suma, m) => suma + m.apartadas, 0),
  poco: g.miembros.some((m) => pocoStock(m, umbral)),
});

const rangoDePrecio = (g: GrupoProducto) => {
  const precios = g.miembros.map((m) => m.precio);
  const min = Math.min(...precios);
  const max = Math.max(...precios);
  return min === max ? formatearDolares(min) : `${formatearDolares(min)} – ${formatearDolares(max)}`;
};

function AgregarCosto({ codigo }: { codigo: number }) {
  return (
    <Link
      href={`/productos/${codigo}/editar`}
      className="relative z-10 inline-flex min-h-8 items-center gap-1 rounded-full bg-chip-amarillo px-2.5 text-xs font-medium text-chip-texto-amarillo hover:brightness-95 max-md:min-h-10"
    >
      <Icon nombre="mas" className="size-3.5" />
      {t.lista.agregarCosto}
    </Link>
  );
}

function Ganancia({ p }: { p: Producto }) {
  if (p.costoUnitario === undefined) return null;
  // Sin costo no hay ganancia que mostrar: se avisa, igual que en Inicio, y el aviso lleva a ponerlo.
  if (p.costoUnitario === null) return <AgregarCosto codigo={p.codigo} />;
  const ganancia = p.precio - p.costoUnitario;
  const margen = p.precio > 0 ? Math.round((ganancia / p.precio) * 100) : 0;
  return (
    <span className="flex items-baseline gap-1.5">
      <span className={`font-semibold ${ganancia < 0 ? "text-error" : "text-teal"}`}>
        {ganancia < 0 ? "−" : "+"}
        {formatearDolares(Math.abs(ganancia))}
      </span>
      <span className="text-xs text-texto-2">{t.lista.margen(margen)}</span>
    </span>
  );
}

function GananciaGrupo({ g }: { g: GrupoProducto }) {
  if (g.miembros.every((m) => m.costoUnitario === undefined)) return null;
  const sinCosto = g.miembros.find((m) => m.costoUnitario === null);
  if (sinCosto) return <AgregarCosto codigo={sinCosto.codigo} />;
  const ganancias = g.miembros.map((m) => m.precio - (m.costoUnitario ?? 0));
  const min = Math.min(...ganancias);
  const max = Math.max(...ganancias);
  const signo = (n: number) => (n < 0 ? "−" : "+");
  return (
    <span className={`whitespace-nowrap font-semibold ${min < 0 ? "text-error" : "text-teal"}`}>
      {signo(min)}
      {formatearDolares(Math.abs(min))}
      {max !== min && ` – ${signo(max)}${formatearDolares(Math.abs(max))}`}
    </span>
  );
}

// Entre md y xl: foto, producto, stock, precio (y ganancia). Desde xl entran también la categoría y lo vendido, para usar el ancho.
const COLUMNAS_CON_GANANCIA = "md:grid-cols-[3.5rem_minmax(0,1fr)_9rem_9rem_11rem] xl:grid-cols-[3.5rem_minmax(0,2fr)_minmax(0,1fr)_9rem_6rem_9rem_11rem]";
const COLUMNAS_SIN_GANANCIA = "md:grid-cols-[3.5rem_minmax(0,1fr)_9rem_9rem] xl:grid-cols-[3.5rem_minmax(0,2fr)_minmax(0,1fr)_9rem_6rem_9rem]";

export function ListaProductos({
  productos,
  umbral,
  textoInicial,
  estadoInicial,
  categorias,
  categoriaInicial,
  ordenInicial,
  faltaInicial,
}: {
  productos: Producto[];
  umbral: number;
  textoInicial: string;
  estadoInicial: FiltroEstado;
  /** Las categorías del negocio, para filtrar */
  categorias: string[];
  categoriaInicial: string;
  ordenInicial: Orden;
  faltaInicial: Falta | undefined;
}) {
  const [texto, setTexto] = useState(textoInicial);
  const [estado, setEstado] = useState(estadoInicial);
  const [categoria, setCategoria] = useState(categoriaInicial);
  const [orden, setOrden] = useState(ordenInicial);
  const [falta, setFalta] = useState(faltaInicial);
  const filtrosActivos = Number(categoria !== "") + Number(falta !== undefined) + Number(orden !== "recientes");
  // Los filtros avanzados van plegados; si el enlace trae alguno, se abren para que se vea por qué la lista es esa
  const [verFiltros, setVerFiltros] = useState(ordenInicial !== "recientes" || categoriaInicial !== "" || faltaInicial !== undefined);
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const verGanancia = productos.some((p) => p.costoUnitario !== undefined);
  const columnas = verGanancia ? COLUMNAS_CON_GANANCIA : COLUMNAS_SIN_GANANCIA;

  // Las pestañas cuentan productos (un producto con variantes es uno solo), no filas de la base.
  const cantidades = useMemo(
    () =>
      Object.fromEntries(
        FILTROS_ESTADO.map((e) => [e, agruparProductos(filtrarProductos(productos, { texto: "", estado: e, umbral, categoria, falta })).length]),
      ),
    [productos, umbral, categoria, falta],
  );
  const grupos = useMemo(() => {
    const ordenados = ordenarGrupos(agruparProductos(filtrarProductos(productos, { texto, estado, umbral, categoria, falta })), orden);
    // Con el orden por defecto, lo que se está acabando va primero (lo agotado no: ya no hay qué reponer a tiempo). Es estable: el resto conserva su orden.
    if (orden !== "recientes") return ordenados;
    const seAcaba = (g: GrupoProducto) => {
      const st = stockDelGrupo(g, umbral);
      return st.disponibles > 0 && st.poco;
    };
    return [...ordenados.filter(seAcaba), ...ordenados.filter((g) => !seAcaba(g))];
  }, [productos, texto, estado, umbral, categoria, falta, orden]);
  const inventario = useMemo(() => resumenDeInventario(productos), [productos]);
  // Cuántos productos se están acabando o se agotaron, sin importar los otros filtros: es un dato del inventario, no de la búsqueda
  const pocoStockCuenta = useMemo(
    () => agruparProductos(filtrarProductos(productos, { texto: "", estado: "poco", umbral })).length,
    [productos, umbral],
  );
  const agotadosCuenta = useMemo(
    () => agruparProductos(filtrarProductos(productos, { texto: "", estado: "vendido", umbral })).length,
    [productos, umbral],
  );
  const veCostos = inventario.valorCosto !== null;
  // "Sin costo" solo tiene sentido para quien ve los costos
  const faltas = veCostos ? (["costo", "foto"] as const) : (["foto"] as const);

  // La URL sigue al filtro (sin recargar), así un enlace o un refresco conservan lo que se ve.
  function guardarEnUrl(cambios: Partial<{ texto: string; estado: FiltroEstado; categoria: string; orden: Orden; falta: Falta | undefined }>) {
    const n = { texto, estado, categoria, orden, falta, ...cambios };
    const q = new URLSearchParams();
    if (n.texto.trim()) q.set("q", n.texto);
    if (n.estado !== "todos") q.set("estado", n.estado);
    if (n.categoria) q.set("categoria", n.categoria);
    if (n.orden !== "recientes") q.set("orden", n.orden);
    if (n.falta) q.set("falta", n.falta);
    const cadena = q.toString();
    window.history.replaceState(null, "", cadena ? `/productos?${cadena}` : "/productos");
  }

  function elegirEstado(nuevo: FiltroEstado) {
    setEstado(nuevo);
    guardarEnUrl({ estado: nuevo });
  }

  function alternar(clave: string) {
    setAbiertos((actuales) => {
      const nuevos = new Set(actuales);
      if (!nuevos.delete(clave)) nuevos.add(clave);
      return nuevos;
    });
  }

  const filtrando = texto.trim() !== "" || estado !== "todos" || categoria !== "" || falta !== undefined;
  const fila = `relative grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 md:gap-x-4 ${columnas}`;

  return (
    <div className="flex flex-col gap-4">
      <ResumenInventario
        resumen={inventario}
        acabando={pocoStockCuenta}
        agotados={agotadosCuenta}
        verAcabando={() => elegirEstado("poco")}
        verAgotados={() => elegirEstado("vendido")}
        verSinCosto={() => {
          setFalta("costo");
          setVerFiltros(true);
          guardarEnUrl({ falta: "costo" });
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <CampoBusqueda
          className="min-w-48 flex-1 md:max-w-md"
          role="searchbox"
          aria-label={t.buscar.etiqueta}
          placeholder={t.buscar.placeholder}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            guardarEnUrl({ texto: e.target.value });
          }}
        />
        <div className="flex items-center gap-2 md:ml-auto">
          <BotonPunch
            variante="secundario"
            aria-expanded={verFiltros}
            aria-controls="filtros-productos"
            onClick={() => setVerFiltros((v) => !v)}
          >
            <Icon nombre="filtros" className="size-4" />
            {t.buscar.filtros}
            {filtrosActivos > 0 && (
              <span className="rounded-md bg-teal-oscuro px-1.5 text-xs tabular-nums text-white">{filtrosActivos}</span>
            )}
          </BotonPunch>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] md:mx-0 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        <div role="group" aria-label={t.buscar.estados} className="flex w-max min-w-full gap-1 rounded-[14px] bg-gris-100 p-1 md:w-fit md:min-w-0">
          {FILTROS_ESTADO.filter((e) => e === "todos" || e === estado || (cantidades[e] > 0 && cantidades[e] < cantidades.todos)).map((e) => {
            const activo = e === estado;
            return (
              <button
                key={e}
                type="button"
                aria-pressed={activo}
                title={e === "poco" ? t.buscar.poco : nombreDelFiltro(e)}
                onClick={() => {
                  setEstado(e);
                  guardarEnUrl({ estado: e });
                }}
                className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-[10px] px-3.5 text-sm font-medium text-texto-2 transition-colors hover:text-teal-oscuro aria-pressed:border-linea aria-pressed:bg-superficie aria-pressed:text-teal-oscuro aria-pressed:shadow-xs border border-transparent md:min-h-9">
                {e === "poco" ? (
                  <>
                    <span className="md:hidden">{t.buscar.pocoCorto}</span>
                    <span className="hidden md:inline">{t.buscar.poco}</span>
                  </>
                ) : (
                  nombreDelFiltro(e)
                )}
                <span className="text-xs font-medium tabular-nums opacity-70">{cantidades[e]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div id="filtros-productos" hidden={!verFiltros} className="flex flex-wrap items-end gap-3 rounded-3xl border border-linea bg-superficie p-4">
        {categorias.length > 0 && (
          <div className="w-full sm:w-56">
            <ListaDesplegable
              variante="pildora"
              valor={categoria}
              alCambiar={(v) => {
                setCategoria(v);
                guardarEnUrl({ categoria: v });
              }}
              opciones={[{ valor: "", etiqueta: t.buscar.todasCategorias }, ...categorias.map((c) => ({ valor: c, etiqueta: c }))]}
              placeholder={t.buscar.categoria}
            />
          </div>
        )}
        <div className="w-full sm:w-56">
          <ListaDesplegable
            variante="pildora"
            valor={orden}
            alCambiar={(v) => {
              const nuevo = ORDENES.find((o) => o === v) ?? "recientes";
              setOrden(nuevo);
              guardarEnUrl({ orden: nuevo });
            }}
            opciones={ORDENES.map((o) => ({ valor: o, etiqueta: t.buscar.ordenes[o] }))}
            placeholder={t.buscar.orden}
          />
        </div>
        <div role="group" aria-label={t.buscar.faltas} className="flex flex-wrap gap-2">
          {faltas.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={falta === f}
              onClick={() => {
                const nueva = falta === f ? undefined : f;
                setFalta(nueva);
                guardarEnUrl({ falta: nueva });
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-[14px] border border-linea bg-superficie px-4 text-sm font-medium text-teal-oscuro transition-colors hover:bg-gris-50 aria-pressed:border-teal aria-pressed:bg-teal-fondo md:min-h-10"
            >
              {f === "costo" ? t.buscar.sinCosto : t.buscar.sinFoto}
            </button>
          ))}
        </div>
      </div>

      {!grupos.length ? (
        <EmptyState
          texto={t.buscar.sinResultados}
          accion={
            filtrando ? (
              <BotonPunch
                variante="secundario"
                onClick={() => {
                  setTexto("");
                  setEstado("todos");
                  setCategoria("");
                  setFalta(undefined);
                  guardarEnUrl({ texto: "", estado: "todos", categoria: "", falta: undefined });
                }}
              >
                <Icon nombre="x" className="size-4" />
                {t.buscar.limpiar}
              </BotonPunch>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-linea bg-superficie shadow-xs">
          {/* Encabezados de las columnas: solo en pantalla ancha, donde las columnas se alinean */}
          <div
            aria-hidden="true"
            className={`hidden gap-x-4 border-b border-linea bg-gris-50 px-4 py-3 text-xs font-medium text-texto-2 md:grid ${columnas}`}
          >
            <span />
            <span>{t.lista.producto}</span>
            <span className="hidden xl:block">{t.lista.categoria}</span>
            <span>{t.lista.stock}</span>
            <span className="hidden text-right xl:block">{t.lista.vendidas}</span>
            <span className="text-right">{t.lista.precio}</span>
            {verGanancia && <span>{t.lista.ganancia}</span>}
          </div>
          <ul>
            {grupos.map((g) => {
              const abierto = abiertos.has(g.clave);
              const p = g.principal;
              const foto = g.miembros.find((m) => m.fotos[0])?.fotos[0];
              const idLista = `variantes-${g.clave}`;
              return (
                <li key={g.clave} className="border-t border-linea first:border-t-0">
                  <div className={`${fila} hover:bg-gris-50`}>
                    {foto ? (
                      <Image
                        src={urlFoto(foto)}
                        alt=""
                        width={56}
                        height={56}
                        className="size-14 rounded-[14px] border border-linea object-cover max-md:row-span-2 max-md:self-start"
                      />
                    ) : (
                      <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-[14px] border border-linea bg-gris-100 text-texto-2 max-md:row-span-2 max-md:self-start">
                        <Icon nombre="caja" className="size-6" />
                      </span>
                    )}
                    <div className="min-w-0">
                      {/* El enlace del nombre cubre toda la fila; "Agregar costo" y el botón de variantes quedan por encima (z-10) */}
                      <Link href={`/productos/${p.codigo}`} className="block truncate font-semibold after:absolute after:inset-0">
                        {g.nombre}
                      </Link>
                      {g.conVariantes ? (
                        <button
                          type="button"
                          aria-expanded={abierto}
                          aria-controls={idLista}
                          onClick={() => alternar(g.clave)}
                          className="relative z-10 -ml-2 inline-flex min-h-8 max-md:min-h-10 items-center gap-1 rounded-lg px-2 text-sm text-teal hover:bg-gris-50"
                        >
                          {t.lista.variantes(g.miembros.length)}
                          <Icon nombre="flecha" className={`size-4 transition-transform duration-150 ${abierto ? "rotate-180" : ""}`} />
                        </button>
                      ) : (
                        <p className="text-sm text-texto-2">#{p.codigo}</p>
                      )}
                      {(p.categoria || p.marca) && (
                        <p className="truncate text-xs text-texto-2 xl:hidden">{[p.categoria, p.marca].filter(Boolean).join(" · ")}</p>
                      )}
                    </div>
                    <div className="hidden min-w-0 xl:order-2 xl:block">
                      <p className="truncate text-sm">{p.categoria ?? "—"}</p>
                      {p.marca && <p className="truncate text-xs text-texto-2">{p.marca}</p>}
                    </div>
                    <p className="hidden text-right text-sm tabular-nums xl:order-4 xl:block">
                      {g.miembros.reduce((suma, m) => suma + m.vendidas, 0)}
                    </p>
                    <p className="whitespace-nowrap font-semibold tabular-nums md:order-5 md:text-right">{g.conVariantes ? rangoDePrecio(g) : formatearDolares(p.precio)}</p>
                    <div className="col-start-2 col-span-2 flex flex-wrap items-center justify-between gap-2 md:contents">
                      <div className="md:order-3">
                        <Stock {...(g.conVariantes ? stockDelGrupo(g, umbral) : stockDe(p, umbral))} />
                      </div>
                      {verGanancia && (
                        <div className="md:order-6">{g.conVariantes ? <GananciaGrupo g={g} /> : <Ganancia p={p} />}</div>
                      )}
                    </div>
                  </div>

                  {g.conVariantes && abierto && (
                    <ul id={idLista} className="ml-8 border-l-2 border-ficha-lila border-t border-t-linea bg-gris-50 md:ml-10">
                      {g.miembros.map((m) => (
                        <li key={m.id} className="border-t border-linea first:border-t-0">
                          <div className={`${fila} py-2 hover:bg-gris-50`}>
                            <span aria-hidden="true" className="max-md:hidden" />
                            <div className="min-w-0 max-md:col-span-2">
                              <Link href={`/productos/${p.codigo}?variante=${m.codigo}`} className="block truncate text-sm font-medium after:absolute after:inset-0">
                                {m.variante}
                              </Link>
                              <p className="text-xs text-texto-2">#{m.codigo}</p>
                            </div>
                            <span aria-hidden="true" className="hidden xl:order-2 xl:block" />
                            <p className="hidden text-right text-sm tabular-nums xl:order-4 xl:block">{m.vendidas}</p>
                            <p className="text-sm font-semibold tabular-nums md:order-5 md:text-right">{formatearDolares(m.precio)}</p>
                            <div className="col-span-3 flex flex-wrap items-center justify-between gap-2 md:contents">
                              <div className="md:order-3">
                                <Stock {...stockDe(m, umbral)} />
                              </div>
                              {verGanancia && (
                                <div className="md:order-6">
                                  <Ganancia p={m} />
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
