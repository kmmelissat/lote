import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { telefonoElSalvador, type EstadoPedido } from "@/domain";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/servicio";

// El comprador se reconoce solo en el dispositivo donde compró: una cookie httpOnly con un token al azar.
// En la base queda únicamente el hash del token, así que robarse la tabla no sirve para entrar.
// El teléfono es obligatorio al comprar (para que repartidores y tienda escriban) pero no se verifica con código:
// para ver todo desde otro aparato hay que entrar con Google.

const COOKIE = "lote_comprador";
const UN_ANIO = 60 * 60 * 24 * 365;

// Las tablas comprador, comprador_dispositivo y carrito_item todavía no están en database.types.ts.
// Al regenerar los tipos, cambiar esto por createServiceClient() a secas.
const baseSinTipos = () => createServiceClient() as unknown as SupabaseClient;

const hashDe = (token: string) => createHash("sha256").update(token).digest("hex");

/** El comprador de este dispositivo, o null si no se ha reconocido. */
export async function compradorDelDispositivo(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length < 32) return null;
  const base = baseSinTipos();
  const { data } = await base
    .from("comprador_dispositivo")
    .select("id, comprador_id")
    .eq("token_hash", hashDe(token))
    .maybeSingle();
  if (!data) return null;
  // Mejor esfuerzo: saber cuándo se usó por última vez
  await base.from("comprador_dispositivo").update({ visto_en: new Date().toISOString() }).eq("id", data.id);
  return data.comprador_id as string;
}

/** La cuenta con la que se entró (Google o enlace al correo), o null. */
async function sesionActual(): Promise<{ id: string; correo: string | null } | null> {
  const { data } = await (await createClient()).auth.getClaims();
  const id = data?.claims?.sub as string | undefined;
  return id ? { id, correo: (data?.claims?.email as string | undefined) ?? null } : null;
}
const usuarioActual = async () => (await sesionActual())?.id ?? null;

/** El comprador de quien está mirando: el de su cuenta de Google si entró (se crea vacío si no tenía), si no el de este dispositivo. */
export async function compradorActual(): Promise<string | null> {
  const usuario = await usuarioActual();
  if (usuario) {
    const { data } = await baseSinTipos().rpc("comprador_de_usuario", { p_usuario: usuario });
    if (data) return data as string;
  }
  return compradorDelDispositivo();
}

/** Al entrar con un correo confirmado: la cuenta reclama el comprador no verificado de ese correo y queda verificada. */
export async function reclamarCuentaPorCorreo(usuario: string, correo: string | null | undefined): Promise<void> {
  if (!correo) return;
  try {
    await baseSinTipos().rpc("reclamar_comprador_por_correo", { p_usuario: usuario, p_correo: correo });
  } catch {
    // Sin comprador_correo.sql la cuenta entra igual
  }
}

export type DatosDeCuenta = {
  nombre: string;
  /** "+503 70000000" o "" */
  telefono: string;
  correo: string;
  departamento: string;
  municipio: string;
  direccion: string;
  referencia: string;
  /** Cuándo se verificó el correo (al reclamar los pedidos hechos como invitado); null si nunca hubo pedidos sin cuenta */
  verificadoEn: string | null;
};

const texto = (v: unknown) => (typeof v === "string" ? v : "");

/** Los datos de la cuenta con sesión: perfil del comprador y el correo con el que entró. Sin sesión, null. */
export async function datosDeCuenta(): Promise<DatosDeCuenta | null> {
  const sesion = await sesionActual();
  if (!sesion) return null;
  const { data } = await baseSinTipos()
    .from("comprador")
    .select("nombre, telefono, departamento, municipio, direccion, referencia, verificado_en")
    .eq("usuario_id", sesion.id)
    .maybeSingle();
  return {
    nombre: texto(data?.nombre),
    telefono: telefonoElSalvador(texto(data?.telefono)) ?? "",
    correo: sesion.correo ?? "",
    departamento: texto(data?.departamento),
    municipio: texto(data?.municipio),
    direccion: texto(data?.direccion),
    referencia: texto(data?.referencia),
    verificadoEn: (data?.verificado_en as string | null | undefined) ?? null,
  };
}

export type PerfilDeCuenta = Pick<DatosDeCuenta, "nombre" | "departamento" | "municipio" | "direccion" | "referencia"> & { telefono: string | null };

/** Guarda el perfil de la cuenta con sesión (el comprador se crea si no existía). Devuelve false si no hay sesión. */
export async function guardarPerfilDeCuenta(perfil: PerfilDeCuenta): Promise<boolean> {
  const usuario = await usuarioActual();
  if (!usuario) return false;
  const base = baseSinTipos();
  const { data: id } = await base.rpc("comprador_de_usuario", { p_usuario: usuario });
  if (!id) return false;
  const digitos = perfil.telefono ? perfil.telefono.replace(/\D/g, "") : null;
  const { error } = await base
    .from("comprador")
    .update({
      nombre: perfil.nombre || null,
      telefono: digitos,
      departamento: perfil.departamento || null,
      municipio: perfil.municipio || null,
      direccion: perfil.direccion || null,
      referencia: perfil.referencia || null,
    })
    .eq("id", id);
  return !error;
}

/** El correo con el que se hizo un pedido, solo para quien es su dueño (su cuenta o este dispositivo). Si no, null. */
export async function correoDelPedido(pedidoId: string): Promise<string | null> {
  try {
    const comprador = await compradorActual();
    if (!comprador) return null;
    const base = baseSinTipos();
    const { data: pedido } = await base.from("pedido").select("comprador_id").eq("id", pedidoId).maybeSingle();
    if (pedido?.comprador_id !== comprador) return null;
    const { data } = await base.from("comprador").select("correo").eq("id", comprador).maybeSingle();
    return texto(data?.correo) || null;
  } catch {
    // Sin comprador_correo.sql no hay correo que mostrar
    return null;
  }
}

/** Si hay una sesión (para mostrar "Verificá tu cuenta" solo a quien aún no entró). */
export const haySesion = async () => (await usuarioActual()) !== null;

/** Después de crear un pedido: se enlaza a su comprador y este dispositivo queda reconocido como suyo. Nunca rompe la compra. */
export async function reconocerDispositivo(pedidoId: string, correo: string): Promise<void> {
  try {
    const base = baseSinTipos();
    // Con sesión el pedido va a la cuenta; sin sesión, a la cuenta no verificada de ese correo (se crea si no existe)
    const { data } = await base.rpc("registrar_comprador_de_pedido", { p_pedido: pedidoId, p_correo: correo, p_usuario: await usuarioActual() });
    const comprador = data as string | null;
    if (!comprador) return;
    if ((await compradorDelDispositivo()) === comprador) return;

    const token = randomBytes(32).toString("hex");
    const { error } = await base.from("comprador_dispositivo").insert({ comprador_id: comprador, token_hash: hashDe(token) });
    if (error) return;
    (await cookies()).set(COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: UN_ANIO,
    });
  } catch {
    // Si falta compradores.sql o carritos.sql, comprar sigue funcionando
  }
}

/** Lo que el servidor sabe del carrito de este comprador en una tienda. */
export async function leerCarritoGuardado(slug: string, comprador: string): Promise<{ codigo: number; cantidad: number }[]> {
  const base = baseSinTipos();
  const { data: negocio } = await base.from("negocio").select("id").eq("slug", slug.toLowerCase()).maybeSingle();
  if (!negocio) return [];
  const { data } = await base
    .from("carrito_item")
    .select("codigo, cantidad")
    .eq("comprador_id", comprador)
    .eq("negocio_id", negocio.id)
    .order("actualizado_en");
  return (data ?? []) as { codigo: number; cantidad: number }[];
}

/** Lo que el servidor sabe del carrito de este comprador en TODAS las tiendas (para el panel del encabezado del Marketplace). */
export async function leerCarritosGuardados(comprador: string): Promise<{ slug: string; lineas: { codigo: number; cantidad: number }[] }[]> {
  const { data } = await baseSinTipos()
    .from("carrito_item")
    .select("codigo, cantidad, negocio:negocio_id(slug)")
    .eq("comprador_id", comprador)
    .order("actualizado_en");
  const porTienda = new Map<string, { codigo: number; cantidad: number }[]>();
  for (const f of (data ?? []) as unknown as { codigo: number; cantidad: number; negocio: { slug: string } | null }[]) {
    if (!f.negocio?.slug) continue;
    porTienda.set(f.negocio.slug, [...(porTienda.get(f.negocio.slug) ?? []), { codigo: f.codigo, cantidad: f.cantidad }]);
  }
  return [...porTienda].map(([slug, lineas]) => ({ slug, lineas }));
}

export async function guardarCarritoDelComprador(
  slug: string,
  comprador: string,
  lineas: { codigo: number; cantidad: number }[],
): Promise<void> {
  const base = baseSinTipos();
  const { data: negocio } = await base.from("negocio").select("id").eq("slug", slug.toLowerCase()).maybeSingle();
  if (!negocio) return;
  await base.rpc("guardar_carrito", { p_comprador: comprador, p_negocio: negocio.id, p_items: lineas });
}

type FilaDePedido = {
  id: string;
  codigo: number;
  total: number;
  estado: EstadoPedido;
  creado_en: string;
  negocio: { slug: string; nombre: string } | null;
  pedido_item: { producto: { nombre: string } | null }[];
};

/** Los pedidos de la vitrina de un comprador, el más reciente primero, con la forma de "Mis pedidos" (total en centavos). */
export async function pedidosDeComprador(comprador: string) {
  const { data } = await baseSinTipos()
    .from("pedido")
    .select("id, codigo, total, estado, creado_en, negocio:negocio_id(slug, nombre), pedido_item(producto:producto_id(nombre))")
    .eq("comprador_id", comprador)
    .order("creado_en", { ascending: false })
    .limit(30);
  return ((data ?? []) as unknown as FilaDePedido[])
    .filter((p) => p.negocio)
    .map((p) => ({
      id: p.id,
      slug: p.negocio!.slug,
      tienda: p.negocio!.nombre,
      codigo: p.codigo,
      total: Math.round(Number(p.total) * 100),
      estado: p.estado,
      resumen: p.pedido_item.map((i) => i.producto?.nombre).filter(Boolean).join(", "),
      fecha: new Date(p.creado_en).getTime(),
    }));
}

/** Los pedidos de quien tiene sesión, para su cuenta. */
export async function pedidosDeLaCuenta() {
  const usuario = await usuarioActual();
  if (!usuario) return [];
  const { data: id } = await baseSinTipos().rpc("comprador_de_usuario", { p_usuario: usuario });
  return id ? pedidosDeComprador(id as string) : [];
}
