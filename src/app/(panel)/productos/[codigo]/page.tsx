import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { colorDeEstado } from "@/components/ui/StatusChip";
import { TarjetaDato } from "@/components/ui/TarjetaDato";
import type { Estado } from "@/components/ui/StatusChip";
import { nombreBase } from "@/domain";
import { codigoDeBarrasDe } from "@/features/counter/repositorio";
import { CodigoDeBarrasForm } from "@/features/counter/ui/CodigoDeBarrasForm";
import { actualizarOfertas, ofertasDe } from "@/features/offers/repositorio";
import { OfertaProducto } from "@/features/offers/ui/OfertaProducto";
import { estadoVisible } from "@/features/products/estadoVisible";
import { fotosDelGrupo } from "@/features/products/fotosVariantes";
import { listarAvisosDeStock, listarGrupo, obtenerProducto, pedidosDeProducto, type Producto } from "@/features/products/repositorio";
import { AccionesProducto } from "@/features/products/ui/AccionesProducto";
import { AvisoCreado } from "@/features/products/ui/AvisoCreado";
import { AvisosDeStock } from "@/features/products/ui/AvisosDeStock";
import { BorrarProducto } from "@/features/products/ui/BorrarProducto";
import { CompartirProducto } from "@/features/products/ui/CompartirProducto";
import { GaleriaProducto } from "@/features/products/ui/GaleriaProducto";
import { LoQueTeDeja } from "@/features/products/ui/LoQueTeDeja";
import { PedidosDelProducto } from "@/features/products/ui/PedidosDelProducto";
import { StickerVendido } from "@/features/products/ui/StickerVendido";
import { VistaPreviaProducto } from "@/features/products/ui/VistaPreviaProducto";
import { MAXIMO_VARIANTES } from "@/features/products/variantes";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.productos;

export const metadata: Metadata = { title: t.titulo };

export default function ProductoPage({ params, searchParams }: PageProps<"/productos/[codigo]">) {
  return (
    <>
      <AvisoCreado />
      <Detalle params={params} searchParams={searchParams} />
    </>
  );
}

/** La ganancia por unidad de una variante, o "sin costo". */
function gananciaDe(v: Producto) {
  return v.costoUnitario === undefined || v.costoUnitario === null ? null : v.precio - v.costoUnitario;
}

/** Todas las variantes en una tabla: stock, precio y ganancia. Cada fila lleva a ver solo esa. */
function TablaVariantes({ variantes, umbral, url }: { variantes: Producto[]; umbral: number; url: (v: Producto) => string }) {
  return (
    <Card role="region" aria-labelledby="variantes-producto" className="flex flex-col gap-3">
      <div>
        <h2 id="variantes-producto" className="font-bold">
          {t.variantes.titulo}
        </h2>
        <p className="text-sm text-texto-2">{t.variantes.ayuda}</p>
      </div>
      <ul className="overflow-hidden rounded-2xl border border-borde">
        {variantes.map((v) => {
          const g = gananciaDe(v);
          const estado = estadoVisible(v, umbral);
          return (
            <li key={v.id} className="border-t border-borde first:border-t-0">
              <Link
                href={url(v)}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-teal-fondo md:grid-cols-[minmax(0,1fr)_9rem_6rem_7rem]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{v.variante}</span>
                  <span className="text-sm text-texto-2">#{v.codigo}</span>
                </span>
                <span className="text-right font-bold tabular-nums md:order-3">{formatearDolares(v.precio)}</span>
                <span className="inline-flex items-center gap-2 text-sm md:order-2">
                  <span
                    aria-hidden="true"
                    className={`size-2.5 rounded-full ${v.disponibles === 0 ? "bg-error" : estado === "poco_stock" ? "bg-ambar" : "bg-teal"}`}
                  />
                  {v.disponibles > 0 ? t.quedan(v.disponibles) : t.lista.agotado}
                </span>
                {v.costoUnitario !== undefined && (
                  <span className={`text-right text-sm md:order-4 ${g !== null && g < 0 ? "text-error" : "text-teal"}`}>
                    {g === null ? <span className="text-ambar-texto">{t.sinCosto}</span> : `${g < 0 ? "−" : "+"}${formatearDolares(Math.abs(g))}`}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

async function Detalle({ params, searchParams }: Pick<PageProps<"/productos/[codigo]">, "params" | "searchParams">) {
  const codigo = Number((await params).codigo);
  if (!Number.isInteger(codigo)) notFound();
  const { variante } = await searchParams;
  const elegida = typeof variante === "string" ? Number(variante) : null;

  const { supabase, negocio } = await negocioActual();
  // Antes de leer el producto, para que vea el precio de la oferta que ya empezó o ya terminó
  if (negocio.puedeVender) await actualizarOfertas(supabase, negocio.id).catch(() => undefined);
  const encontrado = await obtenerProducto(supabase, negocio.id, codigo, negocio.puedeGestionar);
  if (!encontrado) notFound();
  const variantes = encontrado.grupo ? await listarGrupo(supabase, negocio.id, encontrado.grupo, negocio.puedeGestionar) : [];
  const conVariantes = variantes.length > 1;
  // Un producto con variantes tiene una sola dirección, la de la primera: /productos/7 es el producto entero y
  // /productos/7?variante=12 una variante. Quien llega con el código de otra (un pedido, por ejemplo) ve esa.
  const primera = variantes[0]?.codigo;
  if (conVariantes && codigo !== primera) redirect(`/productos/${primera}?variante=${elegida ?? codigo}`);
  const urlDe = (v: Producto) => `/productos/${primera}?variante=${v.codigo}`;
  const urlTodas = `/productos/${primera ?? codigo}`;
  const enFoco = conVariantes ? variantes.find((v) => v.codigo === elegida) : undefined;
  const general = conVariantes && !enFoco;
  const p = enFoco ?? encontrado;
  // Aparte y sin romper nada: si todavía no existe la columna, la ficha se ve igual.
  const codigoDeBarras = !general && negocio.puedeGestionar && negocio.tieneLocal ? await codigoDeBarrasDe(supabase, p.id).catch(() => null) : null;
  // Quiénes esperan este producto (o cualquiera de sus variantes)
  const idsDelProducto = p.grupo ? variantes.map((v) => v.id) : [p.id];
  // La oferta cubre lo que se está viendo: todas las variantes en la vista general, o solo la elegida
  const idsDeOferta = general ? variantes.map((v) => v.id) : [p.id];
  const [avisos, pedidos, ofertas] = await Promise.all([
    listarAvisosDeStock(supabase, idsDelProducto),
    pedidosDeProducto(supabase, negocio.id, idsDelProducto).catch(() => []),
    negocio.puedeGestionar ? ofertasDe(supabase, idsDeOferta) : [],
  ]);

  const base = nombreBase(p.nombre, p.variante);
  const suma = (k: "disponibles" | "apartadas" | "vendidas" | "cantidad") => (general ? variantes.reduce((n, v) => n + v[k], 0) : p[k]);
  const disponibles = suma("disponibles");
  const precios = variantes.map((v) => v.precio);
  const [bajo, alto] = [Math.min(...precios), Math.max(...precios)];
  const precioTexto = general ? (bajo === alto ? formatearDolares(bajo) : t.detalle.entre(formatearDolares(bajo), formatearDolares(alto))) : formatearDolares(p.precio);
  const estadoGeneral: Estado = disponibles > 0 ? "disponible" : suma("apartadas") > 0 ? "apartado" : "vendido";
  // En la vista general van todas las fotos, las de cada variante marcadas con su nombre (como en la vitrina)
  const { fotos, de: deVariante } = general ? fotosDelGrupo(variantes) : { fotos: p.fotos, de: {} };

  const etiquetas = [p.categoria, p.marca, p.condicion === "usado" ? t.form.usado : t.form.nuevo].filter((x): x is string => !!x);
  const sumaVariantes = variantes.map((v) => ({ codigo: v.codigo, etiqueta: v.variante ?? v.nombre }));

  const est = t.detalle.estadisticas;

  return (
    <>
      <PageHeader
        titulo={base}
        descripcion={general ? t.detalle.resumenVariantes(variantes.length) : p.variante ? t.detalle.soloVariante(p.variante, p.codigo) : `#${p.codigo}`}
        volver={{ href: "/productos", etiqueta: t.volver }}
        accion={
          negocio.puedeGestionar && (
            <div className="flex items-center gap-2">
              <ButtonLink href={`/productos/${p.codigo}/editar`} variante="mango" icono="editar">
                {t.editar.boton}
              </ButtonLink>
              <AccionesProducto
                codigo={p.codigo}
                precio={p.precio}
                variantes={sumaVariantes}
                puedeAgregarVariante={variantes.length < MAXIMO_VARIANTES}
              />
            </div>
          )
        }
      />

      {/* Con variantes: ver todas juntas, o una sola */}
      {conVariantes && (
        <nav aria-label={t.detalle.ver} className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-texto-2">{t.detalle.ver}:</span>
          {[{ href: urlTodas, texto: t.detalle.todas, actual: general }, ...variantes.map((v) => ({ href: urlDe(v), texto: v.variante ?? "", actual: !general && v.codigo === p.codigo }))].map((x) => (
            <Link
              key={x.href}
              href={x.href}
              aria-current={x.actual ? "page" : undefined}
              className="inline-flex min-h-10 items-center rounded-full px-4 text-sm font-bold text-texto-2 transition-colors hover:bg-fondo aria-[current=page]:bg-teal-fondo aria-[current=page]:text-teal-oscuro"
            >
              {x.texto}
            </Link>
          ))}
        </nav>
      )}

      <section aria-label={t.detalle.stock} className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TarjetaDato etiqueta={est.disponibles} valor={disponibles} texto={est.disponiblesDe(suma("cantidad"))} banda={colorDeEstado("disponible")} icono="caja" />
        <TarjetaDato etiqueta={est.apartadas} valor={suma("apartadas")} texto={est.apartadasNota} banda={colorDeEstado("apartado")} icono="reloj" />
        <TarjetaDato etiqueta={est.vendidas} valor={suma("vendidas")} texto={est.vendidasNota} banda={colorDeEstado("pagado")} icono="moneda" />
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        {/* A la izquierda, el producto como lo ve la clienta en la vitrina */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-4">
          <VistaPreviaProducto
            soloFicha
            foto={fotos[0] ?? null}
            nombre={general ? base : p.nombre}
            precio={precioTexto}
            unidades={disponibles}
            variantes={general ? variantes.length : 0}
            categoria={p.categoria ?? ""}
          >
            {p.descripcion && <p className="text-sm text-texto-2">{p.descripcion}</p>}
            {etiquetas.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {etiquetas.map((e) => (
                  <li key={e} className="rounded-full bg-fondo px-3 py-1 text-sm font-medium">
                    {e}
                  </li>
                ))}
              </ul>
            )}
          </VistaPreviaProducto>
          {negocio.slug && negocio.vitrinaActiva && (
            <ButtonLink href={`/c/${negocio.slug}/${p.codigo}`} target="_blank" rel="noopener noreferrer" variante="suave" icono="enlace" className="justify-center">
              {t.detalle.verEnVitrina}
              <span className="sr-only"> (se abre en una pestaña nueva)</span>
            </ButtonLink>
          )}
        </div>

        {/* A la derecha, el panel: lo que pasa con el producto */}
        <div className="flex min-w-0 flex-col gap-4">
          <LoQueTeDeja productos={general ? variantes : [p]} hrefCosto={negocio.puedeGestionar ? `/productos/${p.codigo}/editar` : undefined} />

          {general && <TablaVariantes variantes={variantes} umbral={negocio.umbralPocoStock} url={urlDe} />}

          <PedidosDelProducto pedidos={pedidos} />

          {!general && conVariantes && (
            <ButtonLink href={urlTodas} variante="suave" tamano="chico" icono="atras" className="self-start">
              {t.detalle.verTodas}
            </ButtonLink>
          )}

          {/* Con una sola foto ya está en la tarjeta de la izquierda: la galería solo aparece cuando hay más */}
          {fotos.length > 1 && (
            <Card role="region" aria-label={t.fotos.etiqueta} className="flex flex-col gap-3">
              <h2 className="font-bold">{t.fotos.etiqueta}</h2>
              <GaleriaProducto fotos={fotos} nombre={general ? base : p.nombre} de={deVariante} />
            </Card>
          )}

          {negocio.slug && (
            <CompartirProducto
              slug={negocio.slug}
              // Solo lo que el componente usa: un objeto completo viajaría al navegador con sus costos.
              producto={{
                codigo: p.codigo,
                nombre: general ? base : p.nombre,
                descripcion: p.descripcion,
                precio: general ? bajo : p.precio,
                estado: general ? estadoGeneral : p.estado,
                disponibles,
              }}
            />
          )}

          <AvisosDeStock avisos={avisos} producto={base} />

          {!general && p.estado === "vendido" && p.fotos[0] && (
            <StickerVendido foto={urlFoto(p.fotos[0])} nombre={p.nombre} codigo={p.codigo} negocio={negocio.nombre} />
          )}
          {negocio.puedeGestionar && (
            <OfertaProducto
              codigo={p.codigo}
              todas={general}
              precios={general ? variantes.map((v) => v.precio) : [p.precio]}
              ofertas={ofertas}
            />
          )}
          {!general && negocio.puedeGestionar && negocio.tieneLocal && <CodigoDeBarrasForm productoId={p.id} actual={codigoDeBarras} />}

          {/* En la vista general se borra el producto entero; para borrar una sola variante, se elige primero */}
          {negocio.puedeGestionar &&
            (general ? (
              <BorrarProducto codigo={p.codigo} nombre={base} alcance="todas" variantes={variantes.length} />
            ) : (
              <BorrarProducto
                codigo={p.codigo}
                nombre={p.nombre}
                alcance={conVariantes ? "variante" : "producto"}
                // La que quede primera pasa a ser la dirección del producto
                despues={conVariantes ? `/productos/${variantes.find((v) => v.codigo !== p.codigo)?.codigo}` : undefined}
              />
            ))}
        </div>
      </div>
    </>
  );
}
