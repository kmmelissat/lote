import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import {
  explorarDestacados,
  explorarOfertas,
  explorarPromociones,
  explorarProductos,
  explorarRubros,
  explorarTiendas,
  ORDENES_EXPLORAR,
  type OrdenExplorar,
} from "../explorar";
import { categoriaPorTexto, esRubro, rubroDeCategoria } from "../rubros";
import { ejemplosDeBusqueda, rubroDeProducto } from "../portada";
import { colorDeMarca } from "../marca";
import { HeroMercadito } from "./HeroMercadito";
import { SeccionCalle } from "./CalleTiendas";
import { FilaProductos } from "./FilaProductos";
import { PanelFiltros } from "./PanelFiltros";
import { SobreExplorar } from "./SobreExplorar";
import { TarjetasRubro } from "./TarjetasRubro";
import { CuerpoExplorar } from "./CuerpoExplorar";
import { chip, enlace, enlaceExplorar, type Filtros, type Vista } from "./enlacesExplorar";
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
  const sub = categoria && rubroDeCategoria(subPedida) === categoria ? subPedida : "";
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
    permanentRedirect(enlace({ ...f, categoria: deEsa?.rubro ?? "", sub: deEsa?.nombre ?? "" }));
  }
  const rubro = rubros.find((r) => r.id === categoria);
  const nombreRubro = rubro?.nombre ?? "";
  // Las categorías del catálogo que se piden: la elegida, o todas las del rubro
  const categorias = categoria ? (sub ? [sub] : (rubro?.nombres ?? [])) : undefined;
  const filtrando = Boolean(
    busqueda || categoria || sub || min || max || depto || gratis || oferta,
  );
  // La portada (sin buscar ni filtrar) abre con filas que atraen: destacados, ofertas o lo nuevo
  const portada = vista === "productos" && !filtrando && pagina === 1;
  const [tiendas, { productos, total }, destacados, ofertas, promociones] =
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
      portada ? explorarDestacados(supabase, POR_FILA) : Promise.resolve([]),
      portada ? explorarOfertas(supabase, POR_FILA) : Promise.resolve([]),
      portada ? explorarPromociones(supabase, POR_FILA) : Promise.resolve([]),
    ]);
  const hayMas = productos.length > POR_PAGINA;
  const visibles = productos.slice(0, POR_PAGINA);
  const vacio =
    vista === "tiendas" ? tiendas.length === 0 : visibles.length === 0;
  const sugeridas = rubros
    .filter((r) => r.productos >= 2 && r.id !== "otros")
    .slice(0, 4);
  const totalProductos = rubros.reduce((n, r) => n + r.productos, 0);

  // Ejemplos del buscador, de productos reales (destacados y ofertas primero): cambian en cada visita
  const ejemplos = ejemplosDeBusqueda(
    [...destacados, ...ofertas, ...visibles],
    rubroDeProducto,
    3,
  );
  // Cuántos filtros del panel hay puestos (el rubro tiene su propio resaltado)
  const activos = [min || max, depto, gratis, oferta].filter(Boolean).length;
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
  const panel = (
    <PanelFiltros
      filtros={{
        busqueda,
        categoria,
        sub,
        orden,
        min,
        max,
        departamento: depto,
        gratis,
        oferta,
      }}
      rubros={rubros}
      enlaceRubro={(id) => enlaceExplorar({ ...f, categoria: id, sub: "", pagina: 1 })}
      enlaceCategoria={(nombre) => enlaceExplorar({ ...f, sub: nombre, pagina: 1 })}
      limpiar={quitar}
    />
  );
  // El color y el logo de cada tienda, para que sus productos se distingan en la grilla
  const marcas = new Map(
    tiendas.map((x) => [
      x.slug,
      { color: colorDeMarca(x.color).hex, logo: x.logo },
    ]),
  );
  const marcaDe = (p: { tiendaSlug: string }) =>
    marcas.get(p.tiendaSlug) ?? { color: colorDeMarca(null).hex, logo: null };

  // Las dos filas de la portada: lo que haya de destacados y ofertas; si falta alguna, lo nuevo
  const filas = [
    destacados.length >= MINIMO_FILA && {
      id: "destacados",
      titulo: t.destacadosTitulo,
      ayuda: t.destacadosAyuda,
      icono: "★",
      productos: destacados,
      promociones: [],
    },
    ofertas.length + promociones.length >= MINIMO_FILA && {
      id: "ofertas",
      titulo: t.ofertasTitulo,
      ayuda: t.ofertasAyuda,
      icono: "%",
      productos: ofertas,
      promociones,
    },
    {
      id: "nuevos",
      titulo: t.nuevosTitulo,
      ayuda: t.nuevosAyuda,
      icono: "✦",
      productos: visibles.slice(0, POR_FILA),
      promociones: [],
    },
  ]
    .filter((x) => x !== false)
    .slice(0, 2);
  const fila = (i: number) =>
    filas[i] && (
      <FilaProductos
        id={`fila-${filas[i].id}`}
        titulo={filas[i].titulo}
        ayuda={filas[i].ayuda}
        icono={
          <span className="text-lg font-extrabold leading-none">
            {filas[i].icono}
          </span>
        }
        productos={filas[i].productos}
        promociones={filas[i].promociones}
        marcaDe={marcaDe}
        eager={i === 0}
      />
    );

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

      <HeroMercadito
        tiendas={tiendas.length}
        totalProductos={rubro ? rubro.productos : totalProductos}
        ejemplos={ejemplos}
        busqueda={busqueda}
        titulo={nombreRubro ? t.encabezadoRubro(nombreRubro) : undefined}
        ocultos={
          <>
            {vista !== "productos" && (
              <input type="hidden" name="vista" value={vista} />
            )}
            {categoria && (
              <input type="hidden" name="categoria" value={categoria} />
            )}
            {sub && <input type="hidden" name="sub" value={sub} />}
          </>
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
              <TarjetasRubro
                rubros={rubros}
                activo={categoria}
                enlace={(id) =>
                  enlaceExplorar({ ...f, categoria: id, sub: "", pagina: 1 })
                }
              />
            )}
            {/* En el celular el panel de filtros está cerrado: las categorías del rubro van como chips que se deslizan */}
            {rubro && rubro.categorias.length > 1 && (
              <nav aria-label={t.panel.categoriasDe(rubro.nombre)} className="-mx-1 lg:hidden">
                <ul className="flex snap-x gap-2 overflow-x-auto px-1 pb-1">
                  <li className="shrink-0">
                    <Link {...enlaceExplorar({ ...f, sub: "", pagina: 1 })} aria-current={sub ? undefined : "true"} className={chip(!sub)}>
                      {t.panel.todoElRubro}
                    </Link>
                  </li>
                  {rubro.categorias.map((c) => (
                    <li key={c.categoria} className="shrink-0 snap-start">
                      <Link {...enlaceExplorar({ ...f, sub: c.categoria, pagina: 1 })} aria-current={sub === c.categoria ? "true" : undefined} className={chip(sub === c.categoria)}>
                        {c.categoria}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {/* Portada: las dos filas que atraen, la calle con las tiendas y después todo */}
            {portada && (
              <div className="flex flex-col gap-8 py-2">
                {fila(0)}
                {fila(1)}
                {tiendas.length > 0 && (
                  <SeccionCalle
                    tiendas={tiendas.slice(0, 20)}
                    verTodas={enlaceExplorar({ ...f, vista: "tiendas" })}
                  />
                )}
              </div>
            )}
            {!filtrando && (
              <h2 className="-mb-1 font-logo text-xl font-bold">{t.todosTitulo}</h2>
            )}
          </>
        )}

        <div
          className={
            vista === "productos"
              ? "flex flex-col gap-4 lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start lg:gap-6"
              : "contents"
          }
        >
          {vista === "productos" && (
            <aside
              aria-label={t.filtros}
              className="sticky top-4 hidden rounded-[24px] border border-teal-oscuro bg-superficie p-4 shadow-dura-chica lg:block"
            >
              {panel}
            </aside>
          )}
          <CuerpoExplorar
            vista={vista}
            total={total}
            visibles={visibles}
            min={min}
            max={max}
            depto={depto}
            gratis={gratis}
            oferta={oferta}
            activos={activos}
            panel={panel}
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
