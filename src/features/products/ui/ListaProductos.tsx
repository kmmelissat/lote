"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BotonIconoLink } from "@/components/ui/BotonIcono";
import { colorDeEstado } from "@/components/ui/StatusChip";
import { TarjetaDato } from "@/components/ui/TarjetaDato";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { pocoStock } from "@/domain";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { filtrarProductos, FILTROS_ESTADO, ordenarGrupos, ORDENES, resumenDeInventario, type Falta, type FiltroEstado, type Orden } from "../filtro";
import type { Producto } from "../repositorio";
import { agruparProductos, type GrupoProducto } from "../variantes";
import { CampoBusqueda } from "@/components/ui/CampoBusqueda";
import { ListaDesplegable } from "@/components/ui/ListaDesplegable";

const t = textos.productos;

function nombreDelFiltro(e: FiltroEstado) {
  if (e === "todos") return t.buscar.todos;
  if (e === "poco") return t.buscar.poco;
  return textos.estadosProducto[e];
}

type ResumenStock = { disponibles: number; apartadas: number; poco: boolean };

// Stock: un punto con el color de su significado (teal si queda bastante, ámbar si queda poco —el umbral es el del negocio— y rojo si no queda nada) y el texto. Sin pastilla: una por fila hace ruido.
function Stock({ disponibles, apartadas, poco }: ResumenStock) {
  const agotado = disponibles === 0;
  return (
    <span className="flex flex-col items-start gap-0.5">
      <span className={`inline-flex items-center gap-2 text-sm font-medium ${agotado ? "text-error" : ""}`}>
        <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${agotado ? "bg-error" : poco ? "bg-ambar" : "bg-teal"}`} />
        {agotado ? t.lista.agotado : t.quedan(disponibles)}
      </span>
      {apartadas > 0 && <span className="text-xs text-texto-2">{t.lista.apartadas(apartadas)}</span>}
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
      className="relative z-10 inline-flex min-h-8 items-center gap-1 text-sm font-bold text-teal hover:underline max-md:min-h-10"
    >
      <Icon nombre="mas" className="size-4" />
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
      <span className={`font-bold ${ganancia < 0 ? "text-error" : "text-teal"}`}>
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
    <span className={`whitespace-nowrap font-bold ${min < 0 ? "text-error" : "text-teal"}`}>
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
  puedeGestionar,
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
  /** Crear e importar son de dueña y administradora: al resto no se le ofrecen */
  puedeGestionar: boolean;
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
  const grupos = useMemo(
    () => ordenarGrupos(agruparProductos(filtrarProductos(productos, { texto, estado, umbral, categoria, falta })), orden),
    [productos, texto, estado, umbral, categoria, falta, orden],
  );
  const inventario = useMemo(() => resumenDeInventario(productos), [productos]);
  // Cuántos productos se están acabando, sin importar los otros filtros: es un dato del inventario, no de la búsqueda
  const pocoStockCuenta = useMemo(
    () => agruparProductos(filtrarProductos(productos, { texto: "", estado: "poco", umbral })).length,
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
      <section aria-label={t.inventario.titulo} className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <TarjetaDato
          etiqueta={t.inventario.unidades}
          valor={inventario.unidades}
          texto={t.inventario.unidadesNota(inventario.productos)}
          href="/productos?estado=disponible"
          banda={colorDeEstado("disponible")}
          icono="caja"
          alTocar={() => elegirEstado("disponible")}
        />
        <TarjetaDato
          etiqueta={t.inventario.poco}
          valor={pocoStockCuenta}
          texto={t.inventario.pocoNota}
          href="/productos?estado=poco"
          banda={colorDeEstado("poco_stock")}
          icono="reloj"
          alTocar={() => elegirEstado("poco")}
        />
        <TarjetaDato
          etiqueta={t.inventario.valen}
          valor={formatearDolares(inventario.valorVenta)}
          texto={t.inventario.valenNota}
          href="/productos"
          banda={colorDeEstado("pagado")}
          icono="moneda"
          alTocar={() => elegirEstado("todos")}
        />
        {inventario.gananciaPotencial !== null && (
          <TarjetaDato
            etiqueta={t.inventario.ganancia}
            valor={formatearDolares(inventario.gananciaPotencial)}
            texto={inventario.sinCosto > 0 ? t.inventario.sinCosto(inventario.sinCosto) : t.inventario.gananciaNota}
            href="/ganancia"
            banda={colorDeEstado("entregado")}
            icono="ganancia"
          />
        )}
      </section>

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
          <Button
            variante="suave"
            icono="filtros"
            aria-expanded={verFiltros}
            aria-controls="filtros-productos"
            onClick={() => setVerFiltros((v) => !v)}
          >
            {t.buscar.filtros}
            {filtrosActivos > 0 && (
              <span className="rounded-full bg-teal-oscuro px-2 text-xs tabular-nums text-white">{filtrosActivos}</span>
            )}
          </Button>
          {puedeGestionar && <BotonIconoLink icono="hoja" etiqueta={t.importar.boton} href="/productos/importar" />}
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] md:mx-0 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        <div role="group" aria-label={t.buscar.estados} className="flex min-w-full gap-2 md:min-w-0 md:flex-wrap">
          {FILTROS_ESTADO.filter((e) => e === "todos" || e === estado || cantidades[e] > 0).map((e) => {
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
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold text-texto-2 transition-colors hover:bg-fondo aria-pressed:bg-teal-fondo aria-pressed:text-teal-oscuro md:min-h-10">
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

      <div id="filtros-productos" hidden={!verFiltros} className="flex flex-wrap items-end gap-3 rounded-[24px] border border-borde bg-superficie p-4">
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
              className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-borde-control bg-superficie px-4 text-sm font-bold text-teal-oscuro transition-colors hover:bg-fondo aria-pressed:border-teal-oscuro aria-pressed:bg-teal-fondo md:min-h-10"
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
              <Button
                variante="secundario"
                icono="x"
                onClick={() => {
                  setTexto("");
                  setEstado("todos");
                  setCategoria("");
                  setFalta(undefined);
                  guardarEnUrl({ texto: "", estado: "todos", categoria: "", falta: undefined });
                }}
              >
                {t.buscar.limpiar}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden p-0 md:p-0">
          {/* Encabezados de las columnas: solo en pantalla ancha, donde las columnas se alinean */}
          <div
            aria-hidden="true"
            className={`hidden gap-x-4 border-b border-borde px-4 py-2 text-xs font-medium uppercase tracking-wide text-texto-2 md:grid ${columnas}`}
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
                <li key={g.clave} className="border-t border-borde first:border-t-0">
                  <div className={`${fila} hover:bg-teal-fondo`}>
                    {foto ? (
                      <Image
                        src={urlFoto(foto)}
                        alt=""
                        width={56}
                        height={56}
                        className="size-14 rounded-xl border-2 border-teal-oscuro/20 object-cover max-md:row-span-2 max-md:self-start"
                      />
                    ) : (
                      <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-xl border-2 border-teal-oscuro/20 bg-fondo text-texto-2 max-md:row-span-2 max-md:self-start">
                        <Icon nombre="caja" className="size-6" />
                      </span>
                    )}
                    <div className="min-w-0">
                      {/* El enlace del nombre cubre toda la fila; "Agregar costo" y el botón de variantes quedan por encima (z-10) */}
                      <Link href={`/productos/${p.codigo}`} className="block truncate font-medium after:absolute after:inset-0">
                        {g.nombre}
                      </Link>
                      {g.conVariantes ? (
                        <button
                          type="button"
                          aria-expanded={abierto}
                          aria-controls={idLista}
                          onClick={() => alternar(g.clave)}
                          className="relative z-10 -ml-2 inline-flex min-h-8 max-md:min-h-10 items-center gap-1 rounded-lg px-2 text-sm text-teal hover:bg-teal-fondo"
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
                    <p className="whitespace-nowrap font-bold md:order-5 md:text-right">{g.conVariantes ? rangoDePrecio(g) : formatearDolares(p.precio)}</p>
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
                    <ul id={idLista} className="border-t border-borde bg-fondo">
                      {g.miembros.map((m) => (
                        <li key={m.id} className="border-t border-borde first:border-t-0">
                          <div className={`${fila} py-2 hover:bg-teal-fondo`}>
                            <span aria-hidden="true" className="max-md:hidden" />
                            <div className="min-w-0 max-md:col-span-2">
                              <Link href={`/productos/${p.codigo}?variante=${m.codigo}`} className="block truncate text-sm font-medium after:absolute after:inset-0">
                                {m.variante}
                              </Link>
                              <p className="text-xs text-texto-2">#{m.codigo}</p>
                            </div>
                            <span aria-hidden="true" className="hidden xl:order-2 xl:block" />
                            <p className="hidden text-right text-sm tabular-nums xl:order-4 xl:block">{m.vendidas}</p>
                            <p className="text-sm font-bold md:order-5 md:text-right">{formatearDolares(m.precio)}</p>
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
        </Card>
      )}
    </div>
  );
}
