import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { StatusChip, type Estado } from "@/components/ui/StatusChip";
import { nombreBase } from "@/domain";
import { codigoDeBarrasDe } from "@/features/counter/repositorio";
import { CodigoDeBarrasForm } from "@/features/counter/ui/CodigoDeBarrasForm";
import { estadoVisible } from "@/features/products/estadoVisible";
import { separarFotos } from "@/features/products/fotosVariantes";
import { listarAvisosDeStock, listarGrupo, obtenerProducto, type Producto } from "@/features/products/repositorio";
import { AccionesProducto } from "@/features/products/ui/AccionesProducto";
import { AvisoCreado } from "@/features/products/ui/AvisoCreado";
import { AvisosDeStock } from "@/features/products/ui/AvisosDeStock";
import { BorrarProducto } from "@/features/products/ui/BorrarProducto";
import { CompartirProducto } from "@/features/products/ui/CompartirProducto";
import { GaleriaProducto } from "@/features/products/ui/GaleriaProducto";
import { LoQueTeDeja } from "@/features/products/ui/LoQueTeDeja";
import { StickerVendido } from "@/features/products/ui/StickerVendido";
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

/** Cómo van las unidades: una barra con disponibles, apartadas y vendidas. */
function BarraStock({ disponibles, apartadas, vendidas, cantidad }: { disponibles: number; apartadas: number; vendidas: number; cantidad: number }) {
  const partes = [
    { clave: "disponibles", valor: disponibles, etiqueta: t.detalle.disponibles, color: "bg-teal" },
    { clave: "apartadas", valor: apartadas, etiqueta: t.detalle.apartadas, color: "bg-mango" },
    { clave: "vendidas", valor: vendidas, etiqueta: t.detalle.vendidas, color: "bg-rosa" },
  ];
  const total = Math.max(cantidad, 1);
  return (
    <div className="flex flex-col gap-2 border-t-2 border-teal-oscuro/10 pt-4">
      <h2 className="text-sm font-bold">{t.detalle.stock}</h2>
      <div
        role="img"
        aria-label={partes.map((x) => `${x.etiqueta}: ${x.valor}`).join(", ")}
        className="flex h-4 overflow-hidden rounded-full border-2 border-teal-oscuro bg-white"
      >
        {partes.map((x) => (
          <span key={x.clave} className={x.color} style={{ width: `${(x.valor / total) * 100}%` }} />
        ))}
      </div>
      <ul className="grid grid-cols-3 gap-2 text-sm">
        {partes.map((x) => (
          <li key={x.clave} className="flex items-center gap-2">
            <span aria-hidden="true" className={`size-3 shrink-0 rounded-full border border-teal-oscuro ${x.color}`} />
            <span className="min-w-0">
              <span className="block font-bold tabular-nums">{x.valor}</span>
              <span className="text-texto-2">{x.etiqueta}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** La ganancia por unidad de una variante, o "sin costo". */
function gananciaDe(v: Producto) {
  return v.costoUnitario === undefined || v.costoUnitario === null ? null : v.precio - v.costoUnitario;
}

/** Todas las variantes en una tabla: estado, precio y ganancia. Cada fila lleva a ver solo esa. */
function TablaVariantes({ variantes, umbral, url }: { variantes: Producto[]; umbral: number; url: (v: Producto) => string }) {
  return (
    <section className="flex flex-col gap-3 bg-superficie p-5 shadow-dura">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-oscuro bg-teal-fondo text-teal-oscuro">
          <Icon nombre="productos" className="size-6" />
        </span>
        <div>
          <h2 className="text-lg font-bold leading-tight">{t.variantes.titulo}</h2>
          <p className="text-sm text-texto-2">{t.variantes.ayuda}</p>
        </div>
      </div>
      <ul className="overflow-hidden rounded-2xl border-2 border-teal-oscuro/20">
        {variantes.map((v) => {
          const g = gananciaDe(v);
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
                <span className="md:order-2">
                  <StatusChip estado={estadoVisible(v, umbral)} texto={v.disponibles > 0 ? t.quedan(v.disponibles) : undefined} />
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
    </section>
  );
}

async function Detalle({ params, searchParams }: Pick<PageProps<"/productos/[codigo]">, "params" | "searchParams">) {
  const codigo = Number((await params).codigo);
  if (!Number.isInteger(codigo)) notFound();
  const { variante } = await searchParams;
  const elegida = typeof variante === "string" ? Number(variante) : null;

  const { supabase, negocio } = await negocioActual();
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
  const avisos = await listarAvisosDeStock(supabase, p.grupo ? variantes.map((v) => v.id) : [p.id]);

  const base = nombreBase(p.nombre, p.variante);
  const suma = (k: "disponibles" | "apartadas" | "vendidas" | "cantidad") => (general ? variantes.reduce((n, v) => n + v[k], 0) : p[k]);
  const disponibles = suma("disponibles");
  const precios = variantes.map((v) => v.precio);
  const [bajo, alto] = [Math.min(...precios), Math.max(...precios)];
  const precioTexto = general ? (bajo === alto ? formatearDolares(bajo) : t.detalle.entre(formatearDolares(bajo), formatearDolares(alto))) : formatearDolares(p.precio);
  const estadoGeneral: Estado = disponibles > 0 ? "disponible" : suma("apartadas") > 0 ? "apartado" : "vendido";
  // En la vista general, las fotos que comparten todas; si no hay ninguna en común, las de la primera
  const generales = general ? separarFotos(variantes.map((v) => v.fotos)).generales : [];
  const fotos = !general ? p.fotos : generales.length ? generales : variantes[0].fotos;

  const etiquetas = [p.categoria, p.marca, p.condicion === "usado" ? t.form.usado : t.form.nuevo].filter((x): x is string => !!x);

  return (
    <>
      <PageHeader
        titulo={base}
        descripcion={general ? t.detalle.resumenVariantes(variantes.length) : p.variante ? t.detalle.soloVariante(p.variante, p.codigo) : `#${p.codigo}`}
        volver={{ href: "/productos", etiqueta: t.volver }}
        accion={
          negocio.puedeGestionar && (
            <div className="flex items-center gap-2">
              <ButtonLink href={`/productos/${p.codigo}/editar`} variante="mango" className="h-10 max-md:min-h-11 px-5 text-sm">
                {t.editar.boton}
              </ButtonLink>
              <AccionesProducto
                codigo={p.codigo}
                precio={p.precio}
                variantes={variantes.map((v) => ({ codigo: v.codigo, etiqueta: v.variante ?? v.nombre }))}
                puedeAgregarVariante={variantes.length < MAXIMO_VARIANTES}
              />
            </div>
          )
        }
      />

      {/* Con variantes: ver todas juntas, o una sola */}
      {conVariantes && (
        <nav aria-label={t.detalle.ver} className="-mt-2 mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-texto-2">{t.detalle.ver}:</span>
          <Link
            href={urlTodas}
            aria-current={general ? "page" : undefined}
            className="inline-flex h-9 items-center rounded-full border-2 border-teal-oscuro px-4 text-sm font-bold hover:bg-teal-fondo aria-[current=page]:bg-teal-oscuro aria-[current=page]:text-white"
          >
            {t.detalle.todas}
          </Link>
          {variantes.map((v) => (
            <Link
              key={v.id}
              href={urlDe(v)}
              aria-current={!general && v.codigo === p.codigo ? "page" : undefined}
              className="inline-flex h-9 items-center rounded-full border-2 border-teal-oscuro/30 px-4 text-sm font-medium hover:border-teal-oscuro aria-[current=page]:border-teal-oscuro aria-[current=page]:bg-teal-oscuro aria-[current=page]:font-bold aria-[current=page]:text-white"
            >
              {v.variante}
            </Link>
          ))}
        </nav>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <GaleriaProducto fotos={fotos} nombre={general ? base : p.nombre} />

        <div className="flex min-w-0 flex-col gap-4">
          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-4xl font-bold tabular-nums">{precioTexto}</p>
              <StatusChip
                estado={general ? estadoGeneral : estadoVisible(p, negocio.umbralPocoStock)}
                texto={disponibles > 0 ? t.quedan(disponibles) : undefined}
              />
            </div>
            {p.descripcion && <p className="text-texto-2">{p.descripcion}</p>}
            {etiquetas.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {etiquetas.map((e) => (
                  <li key={e} className="rounded-full bg-fondo px-3 py-1 text-sm">
                    {e}
                  </li>
                ))}
              </ul>
            )}
            <BarraStock disponibles={disponibles} apartadas={suma("apartadas")} vendidas={suma("vendidas")} cantidad={suma("cantidad")} />
          </Card>

          <LoQueTeDeja productos={general ? variantes : [p]} hrefCosto={negocio.puedeGestionar ? `/productos/${p.codigo}/editar` : undefined} />

          {!general && conVariantes && (
            <ButtonLink href={urlTodas} variante="secundario" className="h-10 max-md:min-h-11 self-start px-5 text-sm">
              <Icon nombre="flecha" className="size-4 rotate-90" />
              {t.detalle.verTodas}
            </ButtonLink>
          )}
        </div>
      </div>

      {general && (
        <div className="mt-6">
          <TablaVariantes variantes={variantes} umbral={negocio.umbralPocoStock} url={urlDe} />
        </div>
      )}

      <div className="mt-6">
        <AvisosDeStock avisos={avisos} producto={base} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
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
        {!general && p.estado === "vendido" && p.fotos[0] && (
          <StickerVendido foto={urlFoto(p.fotos[0])} nombre={p.nombre} codigo={p.codigo} negocio={negocio.nombre} />
        )}
        {!general && negocio.puedeGestionar && negocio.tieneLocal && <CodigoDeBarrasForm productoId={p.id} actual={codigoDeBarras} />}
      </div>

      {/* En la vista general se borra el producto entero; para borrar una sola variante, se elige primero */}
      {negocio.puedeGestionar && (
        <div className="mt-6">
          {general ? (
            <BorrarProducto codigo={p.codigo} nombre={base} alcance="todas" variantes={variantes.length} />
          ) : (
            <BorrarProducto
              codigo={p.codigo}
              nombre={p.nombre}
              alcance={conVariantes ? "variante" : "producto"}
              // La que quede primera pasa a ser la dirección del producto
              despues={conVariantes ? `/productos/${variantes.find((v) => v.codigo !== p.codigo)?.codigo}` : undefined}
            />
          )}
        </div>
      )}
    </>
  );
}
