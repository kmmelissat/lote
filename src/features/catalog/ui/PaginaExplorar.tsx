import type { Route } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import {
  explorarOfertas,
  explorarPromociones,
  explorarProductos,
  explorarRubros,
  explorarTiendas,
  ORDENES_EXPLORAR,
  RUTA_TIENDAS,
  type OrdenExplorar,
} from "../explorar";
import { categoriaPorTexto, esRubro, rubroDeCategoria, type RubroId } from "../rubros";
import { colorDeMarca } from "../marca";
import { HeroMercadito } from "./HeroMercadito";
import { MosaicoPromos } from "./MosaicoPromos";
import { FilaProductos } from "./FilaProductos";
import { BandaTiendas } from "./BandaTiendas";
import { EstanteProductos } from "./EstanteProductos";
import { SobreExplorar } from "./SobreExplorar";
import { BarraCategorias } from "./BarraCategorias";
import { CirculosCategoria } from "./CirculosCategoria";
import { CuerpoExplorar } from "./CuerpoExplorar";
import { PanelFiltros } from "./PanelFiltros";
import {
  enlace,
  enlaceExplorar,
  type Filtros,
  type Vista,
} from "./enlacesExplorar";
import { JsonLd } from "@/lib/jsonld";
import { urlSitio } from "@/lib/sitio";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";
import { leerDolares } from "@/domain";
import { esDepartamento } from "@/lib/departamentos";

const t = textos.explorar;

// 30 llena filas enteras con 5, 3 o 2 columnas
const POR_PAGINA = 30;
// Cuántos productos lleva cada fila de arriba (Destacados, Ofertas), y cuántos necesita para mostrarse:
// una fila con una o dos tarjetas se ve vacía
const POR_FILA = 10;
const MINIMO_FILA = 4;

/** Dólares escritos por la persona → número, o undefined si está vacío o no es válido. */
function dolares(texto: string): number | undefined {
  const c = leerDolares(texto);
  return c === null ? undefined : c / 100;
}

export async function PaginaExplorar({
  searchParams,
  categoriaRuta,
}: Pick<PageProps<"/marketplace">, "searchParams"> & {
  /** El rubro de /marketplace/categoria/<rubro>; manda sobre ?categoria= */
  categoriaRuta?: string;
}) {
  await connection();
  const params = await searchParams;
  const texto = (k: string) =>
    typeof params[k] === "string" ? (params[k] as string).slice(0, 80) : "";
  const vista: Vista = texto("vista") === "tiendas" ? "tiendas" : "productos";
  const busqueda = texto("q").trim();
  const pedida = (categoriaRuta ?? texto("categoria")).slice(0, 80).trim();
  const categoria = esRubro(pedida) ? pedida : "";
  const subPedida = texto("sub").trim();
  const sub =
    categoria && rubroDeCategoria(subPedida) === categoria ? subPedida : "";
  const orden = (ORDENES_EXPLORAR as readonly string[]).includes(texto("orden"))
    ? (texto("orden") as OrdenExplorar)
    : "recientes";
  const min = texto("min").trim();
  const max = texto("max").trim();
  const depto = esDepartamento(texto("depto")) ? texto("depto") : "";
  const gratis = texto("gratis") === "1";
  const oferta = texto("oferta") === "1";
  const pagina = Math.max(1, Math.floor(Number(texto("pagina"))) || 1);
  const f: Filtros = {
    vista,
    busqueda,
    categoria,
    sub,
    orden,
    min,
    max,
    depto,
    gratis,
    oferta,
  };

  const supabase = createPublicClient();
  const rubros = await explorarRubros(supabase);
  // Una dirección vieja con el nombre de una categoría ("Blusas") lleva a su rubro y a su categoría del catálogo
  if (pedida && !categoria) {
    const deEsa = categoriaPorTexto(pedida);
    permanentRedirect(
      enlace({ ...f, categoria: deEsa?.rubro ?? "", sub: deEsa?.nombre ?? "" }),
    );
  }
  const rubro = rubros.find((r) => r.id === categoria);
  const nombreRubro = rubro?.nombre ?? "";
  // Las categorías del catálogo que se piden: la elegida, o todas las del rubro
  const categorias = categoria
    ? sub
      ? [sub]
      : (rubro?.nombres ?? [])
    : undefined;
  const filtrando = Boolean(
    busqueda || categoria || sub || min || max || depto || gratis || oferta,
  );
  // La portada (sin buscar ni filtrar) abre con filas que atraen: destacados, ofertas o lo nuevo
  const portada = vista === "productos" && !filtrando && pagina === 1;
  // En categoría y búsqueda los filtros van en una columna a la izquierda (en el celular, en una hoja)
  const conPanel = vista === "productos" && filtrando;
  // Para la foto de cada círculo: lo más reciente que se ve en Explorar, de donde sale el producto con foto de cada rubro
  const conCirculos = vista === "productos" && !filtrando;
  const [tiendas, { productos, total }, ofertas, promociones, { productos: recientes }] =
    await Promise.all([
      // En productos las tiendas son una fila de acceso rápido; en tiendas, el contenido principal
      explorarTiendas(
        supabase,
        vista === "tiendas" ? busqueda || undefined : undefined,
        vista === "tiendas" ? categorias : undefined,
      ),
      vista === "productos"
        ? // Uno de más, solo para saber si hay otra página
          explorarProductos(supabase, {
            busqueda: busqueda || undefined,
            categorias,
            limite: POR_PAGINA + 1,
            desde: (pagina - 1) * POR_PAGINA,
            orden,
            precioMin: dolares(min),
            precioMax: dolares(max),
            oferta,
            envioGratis: gratis,
            departamento: depto || undefined,
          })
        : Promise.resolve({ productos: [], total: null }),
      portada ? explorarOfertas(supabase, POR_FILA) : Promise.resolve([]),
      portada ? explorarPromociones(supabase, POR_FILA) : Promise.resolve([]),
      conCirculos
        ? explorarProductos(supabase, { limite: 100, desde: 0, orden: "recientes" })
        : Promise.resolve({ productos: [], total: null }),
    ]);
  const hayMas = productos.length > POR_PAGINA;
  const visibles = productos.slice(0, POR_PAGINA);
  const vacio =
    vista === "tiendas" ? tiendas.length === 0 : visibles.length === 0;
  const sugeridas = rubros
    .filter((r) => r.productos >= 2 && r.id !== "otros")
    .slice(0, 4);
  const totalProductos = rubros.reduce((n, r) => n + r.productos, 0);

  // Cuántos filtros del panel hay puestos (el rubro tiene su propio resaltado)
  const activos = [min || max, depto, gratis, oferta].filter(Boolean).length;
  // Sin ningún filtro: lo que usan la barra de categorías y sus enlaces
  const limpio: Filtros = { ...f, busqueda: "", categoria: "", sub: "", orden: "recientes", min: "", max: "", depto: "", gratis: false, oferta: false, vista: "productos", pagina: 1 };
  const quitar =
    activos > 0 || categoria || sub
      ? enlace({
          ...f,
          categoria: "",
          sub: "",
          min: "",
          max: "",
          depto: "",
          gratis: false,
          oferta: false,
          pagina: 1,
        })
      : null;
  // El color y el logo de cada tienda, para que sus productos se distingan en la grilla
  const marcas = new Map(
    tiendas.map((x) => [
      x.slug,
      { color: colorDeMarca(x.color).hex, logo: x.logo },
    ]),
  );
  const marcaDe = (p: { tiendaSlug: string }) =>
    marcas.get(p.tiendaSlug) ?? { color: colorDeMarca(null).hex, logo: null };

  // La tienda del momento (para el mosaico): la que más productos tiene entre los que se ven
  const porTienda = Map.groupBy(visibles, (p) => p.tiendaSlug);
  const [slugMomento] = [...porTienda].sort((a, b) => b[1].length - a[1].length)[0] ?? [];
  const tiendaMomento = tiendas.find((x) => x.slug === slugMomento);

  // La foto de cada círculo: el producto más reciente con imagen de ese rubro
  const fotosRubro: Partial<Record<RubroId, string>> = {};
  for (const p of recientes) {
    const id = rubroDeCategoria(p.categoria);
    if (id && p.foto && !fotosRubro[id]) fotosRubro[id] = p.foto;
  }

  // El mosaico de la portada: fotos de lo que está en oferta, lo más nuevo y la tienda del momento
  const fotosOferta = [...ofertas.map((p) => p.foto), ...promociones.flatMap((x) => x.fotos.slice(0, 1))].filter((f): f is string => !!f);
  const tiendasConOferta = new Set([...ofertas.map((p) => p.tiendaSlug), ...promociones.map((x) => x.tiendaSlug)].filter(Boolean)).size;

  // Los dos estantes de la portada: lo que está en oferta (si hay suficiente) y lo más nuevo
  const hayOfertas = ofertas.length + promociones.length >= MINIMO_FILA;

  return (
    <div className="flex flex-col gap-6">
      <JsonLd
        datos={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: t.titulo,
          description: t.descripcion,
          url: `${urlSitio}/marketplace`,
        }}
      />

      <BarraCategorias
        enOferta={oferta}
        enTiendas={vista === "tiendas"}
        enlaceOfertas={enlaceExplorar({ ...limpio, oferta: true })}
        enlaceTiendas={{ href: RUTA_TIENDAS }}
      />

      <HeroMercadito
        tiendas={tiendas.length}
        // Lo mismo que cuenta la grilla (todos los productos a la vista); con una categoría puesta, lo de esa categoría
        totalProductos={vista === "productos" && !filtrando && total !== null ? total : rubro ? rubro.productos : totalProductos}
        titulo={nombreRubro ? t.encabezadoRubro(nombreRubro) : undefined}
        mosaico={
          portada ? (
            <MosaicoPromos
              fotosOferta={fotosOferta}
              tiendasConOferta={tiendasConOferta}
              verOfertas={enlaceExplorar({ ...limpio, oferta: true }).href}
              fotosNuevos={visibles.flatMap((p) => (p.foto ? [p.foto] : [])).slice(0, 2)}
              verNuevos={"#nuevos" as Route}
              tienda={tiendaMomento ?? tiendas[0] ?? null}
            />
          ) : undefined
        }
        extra={
          // En tiendas no hay fila de categorías: ahí se sugieren las que tienen más productos
          vista === "tiendas" && sugeridas.length > 0 && !busqueda ? (
            <ul
              aria-label={t.sugeridas}
              className="mt-3 flex flex-wrap items-center justify-center gap-2"
            >
              <li className="text-sm font-bold text-teal">{t.sugeridas}</li>
              {sugeridas.map((c) => (
                <li key={c.id}>
                  <Link
                    {...enlaceExplorar({
                      ...f,
                      categoria: c.id,
                      sub: "",
                      vista: "productos",
                      pagina: 1,
                    })}
                    className="inline-flex h-9 items-center rounded-full border border-teal-oscuro bg-crema px-4 text-sm font-bold text-teal-oscuro hover:bg-limon"
                  >
                    {c.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-4">
        {vista === "productos" && (
          <>
            {rubros.length > 0 && !filtrando && (
              <CirculosCategoria
                rubros={rubros}
                enlace={(id) => enlaceExplorar({ ...f, categoria: id, sub: "", pagina: 1 })}
                verTodas="#todos"
                fotos={fotosRubro}
              />
            )}
            {/* Portada: dos estantes, la tienda del momento y la invitación a ver todas las tiendas */}
            {portada && (
              <div className="flex flex-col gap-10 py-2">
                {hayOfertas && (
                  <EstanteProductos id="ofertas" titulo={t.estantes.ofertas} verTodo={enlaceExplorar({ ...limpio, oferta: true })}>
                    <FilaProductos titulo={t.estantes.ofertas} productos={ofertas} promociones={promociones} marcaDe={marcaDe} eager />
                  </EstanteProductos>
                )}
                {visibles.length > 0 && (
                  <EstanteProductos id="nuevos" titulo={t.estantes.nuevos} verTodo={{ href: "#todos" }}>
                    <FilaProductos titulo={t.estantes.nuevos} productos={visibles.slice(0, POR_FILA)} marcaDe={marcaDe} eager={!hayOfertas} />
                  </EstanteProductos>
                )}
                {tiendas.length > 0 && <BandaTiendas tiendas={tiendas} destino={{ href: RUTA_TIENDAS }} />}
              </div>
            )}
          </>
        )}

        <div className={conPanel ? "grid items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8" : undefined}>
          {conPanel && (
            <PanelFiltros
              f={f}
              rubros={rubros}
              enlaceRubro={(id) => enlaceExplorar({ ...f, categoria: id, sub: "", pagina: 1 })}
              enlaceSub={(nombre) => enlaceExplorar({ ...f, sub: nombre, pagina: 1 })}
            />
          )}
          <CuerpoExplorar
            vista={vista}
            total={total}
            visibles={visibles}
            limpiar={quitar}
            orden={orden}
            f={f}
            vacio={vacio}
            filtrando={filtrando}
            tiendas={tiendas}
            marcaDe={marcaDe}
            portada={portada}
            hayMas={hayMas}
            pagina={pagina}
            porPagina={POR_PAGINA}
          />
        </div>
      </div>

      <SobreExplorar rubro={rubro} rubros={rubros} />
    </div>
  );
}
