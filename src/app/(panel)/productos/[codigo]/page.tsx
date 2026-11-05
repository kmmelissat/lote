import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/nav/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { BotonIconoLink } from "@/components/ui/BotonIcono";
import { Card } from "@/components/ui/Card";
import { colorDeEstado } from "@/components/ui/StatusChip";
import { TarjetaDato } from "@/components/ui/TarjetaDato";
import { nombreBase } from "@/domain";
import { codigoDeBarrasDe } from "@/features/counter/repositorio";
import { CodigoDeBarrasForm } from "@/features/counter/ui/CodigoDeBarrasForm";
import { cuentasDelNegocio, tarjetasDelNegocio } from "@/features/gestion/repositorio";
import { actualizarOfertas, ofertasDe } from "@/features/offers/repositorio";
import { OfertaProducto } from "@/features/offers/ui/OfertaProducto";
import { fotosDelGrupo } from "@/features/products/fotosVariantes";
import { listarAvisosDeStock, listarGrupo, obtenerProducto, pedidosDeProducto, type Producto } from "@/features/products/repositorio";
import { resumenFicha } from "@/features/products/resumenFicha";
import { AccionesProducto } from "@/features/products/ui/AccionesProducto";
import { AvisoCreado } from "@/features/products/ui/AvisoCreado";
import { AvisosDeStock } from "@/features/products/ui/AvisosDeStock";
import { BorrarProducto } from "@/features/products/ui/BorrarProducto";
import { CompartirProducto } from "@/features/products/ui/CompartirProducto";
import { GaleriaProducto } from "@/features/products/ui/GaleriaProducto";
import { LoQueTeDeja } from "@/features/products/ui/LoQueTeDeja";
import { PedidosDelProducto } from "@/features/products/ui/PedidosDelProducto";
import { StickerVendido } from "@/features/products/ui/StickerVendido";
import { TablaVariantes } from "@/features/products/ui/TablaVariantes";
import { VerVariantes } from "@/features/products/ui/VerVariantes";
import { VistaPreviaProducto } from "@/features/products/ui/VistaPreviaProducto";
import { MAXIMO_VARIANTES } from "@/features/products/variantes";
import { urlFoto } from "@/lib/fotos";
import { negocioActual } from "@/lib/negocio";
import { conBusqueda, ruta } from "@/lib/ruta";
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
  const urlDe = (v: Producto) => conBusqueda(ruta(`/productos/${primera}`), `variante=${v.codigo}`);
  const urlTodas = ruta(`/productos/${primera ?? codigo}`);
  const enFoco = conVariantes ? variantes.find((v) => v.codigo === elegida) : undefined;
  const general = conVariantes && !enFoco;
  const p = enFoco ?? encontrado;
  const otraVariante = variantes.find((v) => v.codigo !== p.codigo);
  // Quiénes esperan este producto (o cualquiera de sus variantes)
  const idsDelProducto = p.grupo ? variantes.map((v) => v.id) : [p.id];
  // La oferta cubre lo que se está viendo: todas las variantes en la vista general, o solo la elegida
  const idsDeOferta = general ? variantes.map((v) => v.id) : [p.id];
  const [avisos, pedidos, ofertas, cuentas, tarjetas, codigoDeBarras] = await Promise.all([
    listarAvisosDeStock(supabase, idsDelProducto),
    pedidosDeProducto(supabase, negocio.id, idsDelProducto).catch(() => []),
    negocio.puedeGestionar ? ofertasDe(supabase, idsDeOferta) : [],
    negocio.puedeGestionar ? cuentasDelNegocio(supabase, negocio.id) : [],
    negocio.puedeGestionar ? tarjetasDelNegocio(supabase, negocio.id) : [],
    // Aparte y sin romper nada: si todavía no existe la columna, la ficha se ve igual.
    !general && negocio.puedeGestionar && negocio.tieneLocal ? codigoDeBarrasDe(supabase, p.id).catch(() => null) : null,
  ]);

  const base = nombreBase(p.nombre, p.variante);
  const r = resumenFicha(p, variantes, general);
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
              <BotonIconoLink href={`/productos/${p.codigo}/editar`} variante="mango" icono="editar" etiqueta={t.editar.boton} />
              <AccionesProducto
                codigo={p.codigo}
                precio={p.precio}
                variantes={sumaVariantes}
                puedeAgregarVariante={variantes.length < MAXIMO_VARIANTES}
                cuentas={cuentas}
                tarjetas={tarjetas}
              />
            </div>
          )
        }
      />

      {/* Con variantes: ver todas juntas, o una sola */}
      {conVariantes && (
        <VerVariantes
          opciones={[
            { href: urlTodas, texto: t.detalle.todas, actual: general },
            ...variantes.map((v) => ({ href: urlDe(v), texto: v.variante ?? "", actual: !general && v.codigo === p.codigo })),
          ]}
        />
      )}

      <section aria-label={t.detalle.stock} className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TarjetaDato etiqueta={est.disponibles} valor={r.disponibles} texto={est.disponiblesDe(r.cantidad)} banda={colorDeEstado("disponible")} icono="caja" />
        <TarjetaDato etiqueta={est.apartadas} valor={r.apartadas} texto={est.apartadasNota} banda={colorDeEstado("apartado")} icono="reloj" />
        <TarjetaDato etiqueta={est.vendidas} valor={r.vendidas} texto={est.vendidasNota} banda={colorDeEstado("pagado")} icono="moneda" />
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        {/* A la izquierda, el producto como lo ve el cliente en la vitrina */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-4">
          <VistaPreviaProducto
            soloFicha
            foto={fotos[0] ?? null}
            nombre={general ? base : p.nombre}
            precio={r.precioTexto}
            unidades={r.disponibles}
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
          <LoQueTeDeja productos={general ? variantes : [p]} hrefCosto={negocio.puedeGestionar ? ruta(`/productos/${p.codigo}/editar`) : undefined} />

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
                precio: r.precioBajo,
                estado: r.estado,
                disponibles: r.disponibles,
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
                despues={otraVariante ? ruta(`/productos/${otraVariante.codigo}`) : undefined}
              />
            ))}
        </div>
      </div>
    </>
  );
}
