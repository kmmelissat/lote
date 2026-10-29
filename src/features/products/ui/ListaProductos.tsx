"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Monito } from "@/components/ui/Monito";
import { Icon } from "@/components/ui/Icon";
import { pocoStock } from "@/domain";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import { filtrarProductos, FILTROS_ESTADO, type FiltroEstado } from "../filtro";
import type { Producto } from "../repositorio";
import { agruparProductos, type GrupoProducto } from "../variantes";
import { CampoBusqueda } from "@/components/ui/CampoBusqueda";

const t = textos.productos;

function nombreDelFiltro(e: FiltroEstado) {
  if (e === "todos") return t.buscar.todos;
  if (e === "poco") return t.buscar.poco;
  return textos.estadosProducto[e];
}

type ResumenStock = { disponibles: number; apartadas: number; poco: boolean };

// Semáforo de stock: verde si queda bastante, ámbar si queda poco (el umbral es el del negocio) y rojo si no queda nada.
function Stock({ disponibles, apartadas, poco }: ResumenStock) {
  if (disponibles === 0) {
    return (
      <span className="flex flex-col items-start gap-0.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-error-fondo px-3 py-1 text-sm font-medium text-error">
          <span aria-hidden="true" className="size-2 rounded-full bg-error" />
          {t.lista.agotado}
        </span>
        {apartadas > 0 && <span className="text-xs text-texto-2">{t.lista.apartadas(apartadas)}</span>}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
        poco ? "bg-perla text-ambar-texto" : "bg-teal-fondo text-teal"
      }`}
    >
      <span aria-hidden="true" className={`size-2 rounded-full ${poco ? "bg-ambar" : "bg-teal"}`} />
      {t.quedan(disponibles)}
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
      className="relative z-10 inline-flex min-h-8 max-md:min-h-10 items-center rounded-full bg-perla px-3 text-sm font-medium text-ambar-texto hover:brightness-95"
    >
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

const COLUMNAS_CON_GANANCIA = "md:grid-cols-[3.5rem_minmax(0,1fr)_8rem_9rem_11rem]";
const COLUMNAS_SIN_GANANCIA = "md:grid-cols-[3.5rem_minmax(0,1fr)_8rem_9rem]";

export function ListaProductos({
  productos,
  umbral,
  textoInicial,
  estadoInicial,
  puedeGestionar,
}: {
  productos: Producto[];
  umbral: number;
  textoInicial: string;
  estadoInicial: FiltroEstado;
  /** Crear e importar son de dueña y administradora: al resto no se le ofrecen */
  puedeGestionar: boolean;
}) {
  const [texto, setTexto] = useState(textoInicial);
  const [estado, setEstado] = useState(estadoInicial);
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const verGanancia = productos.some((p) => p.costoUnitario !== undefined);
  const columnas = verGanancia ? COLUMNAS_CON_GANANCIA : COLUMNAS_SIN_GANANCIA;

  // Las pestañas cuentan productos (un producto con variantes es uno solo), no filas de la base.
  const cantidades = useMemo(
    () =>
      Object.fromEntries(
        FILTROS_ESTADO.map((e) => [e, agruparProductos(filtrarProductos(productos, { texto: "", estado: e, umbral })).length]),
      ),
    [productos, umbral],
  );
  const grupos = useMemo(
    () => agruparProductos(filtrarProductos(productos, { texto, estado, umbral })),
    [productos, texto, estado, umbral],
  );

  // La URL sigue al filtro (sin recargar), así un enlace o un refresco conservan lo que se ve.
  function guardarEnUrl(nuevoTexto: string, nuevoEstado: FiltroEstado) {
    const q = new URLSearchParams();
    if (nuevoTexto.trim()) q.set("q", nuevoTexto);
    if (nuevoEstado !== "todos") q.set("estado", nuevoEstado);
    const cadena = q.toString();
    window.history.replaceState(null, "", cadena ? `/productos?${cadena}` : "/productos");
  }

  function alternar(clave: string) {
    setAbiertos((actuales) => {
      const nuevos = new Set(actuales);
      if (!nuevos.delete(clave)) nuevos.add(clave);
      return nuevos;
    });
  }

  const filtrando = texto.trim() !== "" || estado !== "todos";
  const fila = `relative grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 md:gap-x-4 ${columnas}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <CampoBusqueda
          className="min-w-48 flex-1 md:max-w-md"
          role="searchbox"
          aria-label={t.buscar.etiqueta}
          placeholder={t.buscar.placeholder}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            guardarEnUrl(e.target.value, estado);
          }}
        />
        {puedeGestionar && (
          <div className="flex flex-wrap gap-2 md:ml-auto">
            <ButtonLink href="/productos/importar" variante="secundario">
              {t.importar.boton}
            </ButtonLink>
            <ButtonLink href="/productos/nuevo" variante="mango">{t.agregar}</ButtonLink>
          </div>
        )}
      </div>

      <div role="group" aria-label={t.buscar.estados} className="flex flex-wrap gap-2">
        {FILTROS_ESTADO.map((e) => {
          const activo = e === estado;
          const vacio = cantidades[e] === 0;
          return (
            <button
              key={e}
              type="button"
              aria-pressed={activo}
              onClick={() => {
                setEstado(e);
                guardarEnUrl(texto, e);
              }}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-sm font-bold transition-[transform,background-color] duration-150 ${
                activo
                  ? "border-teal-oscuro bg-mango text-teal-oscuro"
                  : "border-teal-oscuro/20 bg-superficie text-texto-2 hover:-translate-y-0.5 hover:border-teal-oscuro hover:bg-limon/40"
              } ${vacio && !activo ? "opacity-60" : ""}`}
            >
              {nombreDelFiltro(e)}
              <span className={`rounded-full px-2 text-xs ${activo ? "bg-white/70" : "bg-gris-fondo"}`}>{cantidades[e]}</span>
            </button>
          );
        })}
      </div>

      {!grupos.length ? (
        <EmptyState
          texto={t.buscar.sinResultados}
          accion={
            filtrando ? (
              <button
                type="button"
                onClick={() => {
                  setTexto("");
                  setEstado("todos");
                  guardarEnUrl("", "todos");
                }}
                className="inline-flex h-12 items-center rounded-full border border-borde bg-superficie px-6 font-medium text-teal hover:bg-teal-fondo"
              >
                {t.buscar.limpiar}
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[24px] border-2 border-teal-oscuro bg-superficie shadow-dura">
          {/* Encabezados de las columnas: solo en pantalla ancha, donde las columnas se alinean */}
          <div
            aria-hidden="true"
            className={`hidden gap-x-4 border-b-2 border-teal-oscuro bg-crema px-4 py-2 text-xs font-bold text-teal-oscuro md:grid ${columnas}`}
          >
            <span />
            <span>{t.lista.producto}</span>
            <span>{t.lista.stock}</span>
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
                  <div className={`${fila} hover:bg-limon/25`}>
                    {foto ? (
                      <Image
                        src={urlFoto(foto)}
                        alt=""
                        width={56}
                        height={56}
                        className="size-14 rounded-xl border-2 border-teal-oscuro/20 object-cover max-md:row-span-2 max-md:self-start"
                      />
                    ) : (
                      <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-xl border-2 border-teal-oscuro/20 bg-crema max-md:row-span-2 max-md:self-start">
                        <Monito nombre="caja" className="w-6 text-teal/50" />
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
                    </div>
                    <p className="whitespace-nowrap font-bold md:order-4 md:text-right">{g.conVariantes ? rangoDePrecio(g) : formatearDolares(p.precio)}</p>
                    <div className="col-start-2 col-span-2 flex flex-wrap items-center justify-between gap-2 md:contents">
                      <div className="md:order-3">
                        <Stock {...(g.conVariantes ? stockDelGrupo(g, umbral) : stockDe(p, umbral))} />
                      </div>
                      {verGanancia && (
                        <div className="md:order-5">{g.conVariantes ? <GananciaGrupo g={g} /> : <Ganancia p={p} />}</div>
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
                              <Link href={`/productos/${m.codigo}`} className="block truncate text-sm font-medium after:absolute after:inset-0">
                                {m.variante}
                              </Link>
                              <p className="text-xs text-texto-2">#{m.codigo}</p>
                            </div>
                            <p className="text-sm font-bold md:order-4 md:text-right">{formatearDolares(m.precio)}</p>
                            <div className="col-span-3 flex flex-wrap items-center justify-between gap-2 md:contents">
                              <div className="md:order-3">
                                <Stock {...stockDe(m, umbral)} />
                              </div>
                              {verGanancia && (
                                <div className="md:order-5">
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
