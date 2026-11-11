import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EnlacePunch, estiloBotonPunch, TARJETA_PUNCH } from "@/components/ui/BotonesPunch";
import { Icon } from "@/components/ui/Icon";
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
import { EncabezadoTarjeta } from "@/components/ui/EncabezadoTarjeta";
import { CabeceraProducto } from "@/features/products/ui/CabeceraProducto";
import { CompartirProducto } from "@/features/products/ui/CompartirProducto";
import { FranjaProducto } from "@/features/products/ui/FranjaProducto";
import { GaleriaProducto } from "@/features/products/ui/GaleriaProducto";
import { TarjetaResumen } from "@/features/products/ui/TarjetaResumen";
import { TarjetaStock } from "@/features/products/ui/TarjetaStock";
import { estadoVisible } from "@/features/products/estadoVisible";
import { LoQueTeDeja } from "@/features/products/ui/LoQueTeDeja";
import { PedidosDelProducto } from "@/features/products/ui/PedidosDelProducto";
import { StickerVendido } from "@/features/products/ui/StickerVendido";
import { TablaVariantes } from "@/features/products/ui/TablaVariantes";
import { VerVariantes } from "@/features/products/ui/VerVariantes";
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
  const d = t.detalle;

  const estado = estadoVisible(p, negocio.umbralPocoStock);
  const chipEstado =
    r.disponibles === 0 && r.vendidas > 0 && r.apartadas === 0
      ? { texto: d.estadoVendido, clase: "bg-chip-celeste text-chip-texto-celeste" }
      : r.disponibles === 0
        ? { texto: t.lista.agotado, clase: "bg-chip-rojo text-chip-texto-rojo" }
        : estado === "poco_stock"
          ? { texto: textos.productos.pocoStock, clase: "bg-chip-amarillo text-chip-texto-amarillo" }
          : { texto: d.estadoDisponible, clase: "bg-chip-verde text-chip-texto-verde" };
  const chips = [chipEstado, ...etiquetas.map((texto) => ({ texto, clase: "bg-gris-100 text-texto-2" }))];

  const avisosFranja = [
    avisos.length > 0 ? d.esperanAviso(avisos.length) : null,
    r.apartadas > 0 ? d.apartadasPorCobrar(r.apartadas) : null,
  ].filter((x): x is string => !!x);

  const nombreFoto = general ? base : p.nombre;
  const resumenVentas = r.apartadas > 0 ? d.apartadasPorCobrar(r.apartadas) : d.nadaPorCobrar;
  const hayPocas = estado === "poco_stock";

  const tarjetas3 = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <TarjetaStock
        codigo={p.codigo}
        disponibles={r.disponibles}
        cantidad={r.cantidad}
        apartadas={r.apartadas}
        poco={hayPocas}
        variantes={sumaVariantes}
        cuentas={cuentas}
        tarjetas={tarjetas}
        puedeReponer={negocio.puedeGestionar}
      />
      <LoQueTeDeja productos={general ? variantes : [p]} hrefCosto={negocio.puedeGestionar ? ruta(`/productos/${p.codigo}/editar`) : undefined} />
      <TarjetaResumen
        etiqueta={d.vendiste}
        icono="pedidos"
        color="celeste"
        numero={r.vendidas}
        detalle={d.ventasNota(r.vendidas)}
        aviso={r.apartadas > 0}
        accion={
          <a href="#pedidos-producto" className={estiloBotonPunch("secundario")}>
            {d.verPedidos}
          </a>
        }
      >
        <p>{resumenVentas}</p>
      </TarjetaResumen>
    </div>
  );

  const compartir = negocio.slug && (
    <CompartirProducto
      slug={negocio.slug}
      // Solo lo que el componente usa: un objeto completo viajaría al navegador con sus costos.
      producto={{
        codigo: p.codigo,
        nombre: nombreFoto,
        descripcion: p.descripcion,
        precio: r.precioBajo,
        estado: r.estado,
        disponibles: r.disponibles,
      }}
    />
  );

  return (
    <div className="flex flex-col gap-5">
      <CabeceraProducto
        foto={fotos[0] ?? null}
        nombre={nombreFoto}
        precio={r.precioTexto}
        nota={general ? d.resumenVariantes(variantes.length) : p.variante ? d.soloVariante(p.variante, p.codigo) : `#${p.codigo}`}
        descripcion={p.descripcion}
        chips={chips}
        acciones={
          <>
            {negocio.puedeGestionar && (
              <EnlacePunch href={`/productos/${p.codigo}/editar`} variante="primario" className="max-md:flex-1">
                <Icon nombre="editar" className="size-5 shrink-0" />
                {t.editar.boton}
              </EnlacePunch>
            )}
            {negocio.slug && negocio.vitrinaActiva && (
              <a
                href={`/c/${negocio.slug}/${p.codigo}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${d.verEnVitrina} (se abre en una pestaña nueva)`}
                title={d.verEnVitrina}
                className={estiloBotonPunch("secundario", true)}
              >
                <Icon nombre="enlace" className="size-5 shrink-0" />
              </a>
            )}
            {negocio.puedeGestionar && variantes.length < MAXIMO_VARIANTES && (
              <AccionesProducto codigo={p.codigo} precio={p.precio} esSimple={!conVariantes} />
            )}
          </>
        }
      />

      <FranjaProducto avisos={avisosFranja} />

      {/* Con variantes: ver todas juntas, o una sola */}
      {conVariantes && (
        <VerVariantes
          opciones={[
            { href: urlTodas, texto: d.todas, actual: general },
            ...variantes.map((v) => ({ href: urlDe(v), texto: v.variante ?? "", actual: !general && v.codigo === p.codigo })),
          ]}
        />
      )}

      {tarjetas3}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-4">
          {conVariantes &&
            (general ? (
              <TablaVariantes variantes={variantes} umbral={negocio.umbralPocoStock} url={urlDe} />
            ) : (
              <div className={`${TARJETA_PUNCH} flex flex-wrap items-center justify-between gap-3`}>
                <p className="text-sm text-texto-2">{d.soloUnaVariante}</p>
                <EnlacePunch href={urlTodas}>{d.verTodas}</EnlacePunch>
              </div>
            ))}
          <PedidosDelProducto pedidos={pedidos} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <AvisosDeStock avisos={avisos} producto={base} />
          {compartir}
        </div>
      </div>

      {negocio.puedeGestionar && (
        <OfertaProducto codigo={p.codigo} todas={general} precios={general ? variantes.map((v) => v.precio) : [p.precio]} ofertas={ofertas} />
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {fotos.length > 0 && (
          <section aria-label={t.fotos.etiqueta} className={`${TARJETA_PUNCH} flex flex-col gap-4 lg:col-span-2`}>
            <EncabezadoTarjeta icono="camara" color="celeste" titulo={t.fotos.etiqueta} />
            <GaleriaProducto fotos={fotos} nombre={nombreFoto} de={deVariante} />
          </section>
        )}
        {!general && p.estado === "vendido" && p.fotos[0] && (
          <StickerVendido foto={urlFoto(p.fotos[0])} nombre={p.nombre} codigo={p.codigo} negocio={negocio.nombre} />
        )}
        {!general && negocio.puedeGestionar && negocio.tieneLocal && <CodigoDeBarrasForm productoId={p.id} actual={codigoDeBarras} />}
      </div>

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
  );
}
