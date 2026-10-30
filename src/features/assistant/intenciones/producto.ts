import { costoPromedio } from "@/domain";
import { formatearDolares } from "@/lib/formato";
import { textos } from "@/lib/textos";
import type { Ctx, Respuesta } from "../tipos";
import { productoDe, registrar, textoDeError } from "../ayudas";

const t = textos.asistente;

export async function crearProducto(c: Ctx<"crear_producto">): Promise<Respuesta> {
  if (c.intencion.variantes.length) return crearConVariantes(c);
  const { d, entrada, intencion, salida, extras } = c;
  return registrar(d, entrada, intencion, salida, async () => {
    const r = await d.puerto.crearProducto({
      nombre: intencion.nombre,
      precio: intencion.precio,
      cantidad: intencion.cantidad,
      costo: intencion.costo,
      descripcion: extras?.descripcion ?? null,
      categoria: extras?.categoria ?? null,
      fotoRuta: extras?.fotoRuta ?? null,
    });
    if (!r.ok) return { respuesta: { texto: textoDeError(r.error) } };
    return {
      respuesta: {
        texto: t.productoCreado(
          r.valor.codigo,
          intencion.nombre,
          formatearDolares(intencion.precio),
          intencion.cantidad,
          intencion.costo === null ? null : formatearDolares(intencion.costo),
        ),
        enlaces: [{ etiqueta: t.verProducto(r.valor.codigo), href: `/productos/${r.valor.codigo}` }],
      },
      inverso: { tipo: "producto", producto_id: r.valor.id },
      descripcion: t.descProducto(intencion.nombre),
    };
  });
}

/** "Galletas: chocolate 3, red velvet 3.5": un producto con una variante por cada versión, cada una con su precio. */
async function crearConVariantes({ d, entrada, intencion, salida, extras }: Ctx<"crear_producto">): Promise<Respuesta> {
  return registrar(d, entrada, intencion, salida, async () => {
    const r = await d.puerto.crearProductoConVariantes({
      nombre: intencion.nombre,
      variantes: intencion.variantes,
      opcion: intencion.opcion,
      costo: intencion.costo,
      descripcion: extras?.descripcion ?? null,
      categoria: extras?.categoria ?? null,
      fotoRuta: extras?.fotoRuta ?? null,
    });
    if (!r.ok) return { respuesta: { texto: textoDeError(r.error) } };
    const lineas = r.valor.productos.map((p, i) => {
      const v = intencion.variantes[i];
      return t.lineaVariante(p.codigo, p.etiqueta, formatearDolares(v.precio), v.cantidad);
    });
    const primero = r.valor.productos[0];
    return {
      respuesta: {
        texto: [
          t.productoConVariantes(intencion.nombre, intencion.variantes.length, intencion.opcion),
          ...lineas,
          intencion.costo === null ? t.faltaCostoVariantes : t.costoVariantes(formatearDolares(intencion.costo)),
        ].join("\n"),
        enlaces: primero ? [{ etiqueta: t.verProducto(primero.codigo), href: `/productos/${primero.codigo}` }] : undefined,
      },
      inverso: { tipo: "grupo", grupo: r.valor.grupo },
      descripcion: t.descProducto(intencion.nombre),
    };
  });
}

export async function reponer({ d, entrada, intencion, salida }: Ctx<"reponer">): Promise<Respuesta> {
  const elegido = await productoDe(d, salida, intencion.producto);
  if ("respuesta" in elegido) return elegido.respuesta;
  const p = elegido.producto;
  // Con costo previo se promedia entre lo que hay (sin vendido) y lo que llega; si no, queda el nuevo.
  const nuevoCosto =
    intencion.costo !== null && p.costoUnitario != null
      ? costoPromedio(p.cantidad - p.vendidas, p.costoUnitario, intencion.cantidad, intencion.costo)
      : intencion.costo;
  return registrar(d, entrada, intencion, salida, async () => {
    const r = await d.puerto.reponer(p.id, intencion.cantidad, nuevoCosto);
    if (!r.ok) return { respuesta: { texto: textoDeError(r.error, p.nombre) } };
    const costosAntes = Object.entries(p.desglose ?? {}).map(([tipo, c]) => ({
      tipo,
      monto: (c as number) / 100,
      por_unidad: true,
    }));
    return {
      respuesta: { texto: t.repuesto(intencion.cantidad, p.nombre, p.disponibles + intencion.cantidad) },
      inverso: {
        tipo: "reposicion",
        producto_id: p.id,
        llegan: intencion.cantidad,
        costos: nuevoCosto === null ? null : costosAntes,
      },
      descripcion: t.descRepuesto(intencion.cantidad, p.nombre),
    };
  });
}
