"use server";

import { revalidatePath } from "next/cache";
import { contactoGuardable, leerDolares, limpiarContactoEscrito, repartirEnvio, telefonoElSalvador, type QuienPagaEnvio } from "@/domain";
import { leerPedido } from "@/features/orders/formulario";
import { marcarContraEntrega, registrarPago, registrarPedido, saldoDelPedido, type ErrorPedido } from "@/features/orders/repositorio";
import { guardarEnvio, type ModoEntrega } from "@/features/shipping/repositorio";
import { guardarContactoDeVenta } from "../repositorio";
import { esDepartamento } from "@/lib/departamentos";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";
import { ENTREGAS, llevaEnvio, planDeVenta, type CanalDeVenta, type Entrega, type PagoClave } from "../plan";

const t = textos.pedidos.form;
const te = textos.pedidos.envio;

const PAGOS: PagoClave[] = ["efectivo", "transferencia", "despues", "contra_entrega"];

/** Cosas que no salieron aunque el pedido quedó guardado: la pantalla las avisa para que se terminen a mano. */
export type Problema = "anticipo" | "pago" | "contra" | "envio" | "contacto";

export type ResultadoPedido = { ok: true; codigo: number; tipo: "venta" | "apartado"; problemas: Problema[] } | { ok: false; error: string };

function textoDeError(e: ErrorPedido): string {
  switch (e.tipo) {
    case "sin_disponibilidad":
      return e.quien ? t.yaApartado(e.quien) : t.sinUnidades;
    case "falta_cliente":
      return t.errorCliente;
    case "descuento_invalido":
      return t.errorDescuento;
    case "sin_permiso":
      return t.errorPermiso;
    default:
      return t.errorGeneral;
  }
}

/** Los datos de entrega que vienen del formulario, revisados. `error` si falta algo que el pedido necesita. */
function leerEntrega(formData: FormData, entrega: Entrega): { error: string } | { envio: Parameters<typeof guardarEnvio>[2] } {
  const campo = (n: string) => String(formData.get(n) ?? "").trim();
  if (!llevaEnvio(entrega)) {
    return { envio: { modo: "retiro", paquetera: null, guia: null, nombre: null, telefono: null, departamento: null, municipio: null, direccion: null, referencia: null, costo: 0, paga: "cliente", cobrado: 0, absorbido: 0 } };
  }
  const departamento = campo("departamento");
  const direccion = campo("direccion");
  if (!esDepartamento(departamento) || !direccion) return { error: te.errorDireccion };
  const telefonoCrudo = campo("telefono");
  const telefono = telefonoCrudo ? telefonoElSalvador(telefonoCrudo) : null;
  if (telefonoCrudo && !telefono) return { error: te.errorTelefono };
  const costo = campo("costo") === "" ? 0 : leerDolares(campo("costo"));
  if (costo === null) return { error: te.errorCosto };
  const paga: QuienPagaEnvio = campo("paga") === "vendedora" ? "vendedora" : "cliente";
  const { cobrado, absorbido } = repartirEnvio(costo, paga);
  return {
    envio: {
      modo: entrega as ModoEntrega,
      paquetera: entrega === "paquetera" ? campo("paquetera") || null : null,
      guia: null,
      nombre: campo("nombre") || null,
      telefono,
      departamento,
      municipio: campo("municipio") || null,
      direccion,
      referencia: campo("referencia") || null,
      costo,
      paga,
      cobrado,
      absorbido,
    },
  };
}

/**
 * Registra una venta o un apartado desde Vender: por chat, con retiro o envío, ya pagado o por pagar.
 * Lo que se hace lo decide `planDeVenta` según cómo paga y cuándo se entrega; el orden importa: primero el envío (mientras el
 * costo todavía se puede fijar), después lo que se cobra o se marca. Devuelve el resultado en vez de redirigir.
 */
export async function registrarPedidoDesdeVender(formData: FormData): Promise<ResultadoPedido> {
  const entrega = ENTREGAS.find((e) => e === formData.get("entrega")) ?? "ahora";
  const pago = PAGOS.find((p) => p === formData.get("pago")) ?? "efectivo";
  const datos = leerPedido(formData);
  const { cliente, canal, contacto, acepta, metodo, items, descuento } = datos;
  const plan = planDeVenta({ entrega, pago, canal: canal as CanalDeVenta });
  const tipo = plan.tipo;

  if (!items) return { ok: false, error: t.errorProductos };
  // Un apartado y un contra entrega son para alguien: sin nombre no se sabe quién
  if (tipo === "apartado" && !cliente) return { ok: false, error: t.errorCliente };
  // Un contacto sin nombre no se guarda en ningún lado
  // Usuario y correo vienen sueltos; el teléfono es el `contacto` de siempre. Se normalizan acá aunque la pantalla ya lo haga.
  const usuario = contactoGuardable("usuario", limpiarContactoEscrito("usuario", String(formData.get("usuario") ?? "")));
  const correo = contactoGuardable("correo", String(formData.get("correo") ?? ""));
  if ((contacto || usuario || correo) && !cliente) return { ok: false, error: t.errorContactoSinNombre };
  if (descuento === "invalido") return { ok: false, error: t.errorDescuento };
  // Un anticipo es lo que ya pagó quien aparta; vacío o cero es que no pagó nada
  const textoAnticipo = String(formData.get("anticipo") ?? "").trim();
  const anticipo = pago === "despues" && textoAnticipo ? leerDolares(textoAnticipo) : 0;
  if (anticipo === null || anticipo < 0) return { ok: false, error: textos.mostrador.anticipo.errorFormato };
  const entregaLeida = plan.conEntrega ? leerEntrega(formData, entrega) : null;
  if (entregaLeida && "error" in entregaLeida) return { ok: false, error: entregaLeida.error };

  // El permiso y la disponibilidad los decide la base; acá solo se resuelve el negocio.
  const { supabase, negocio } = await negocioActual();
  const r = await registrarPedido(supabase, negocio.id, {
    cliente,
    canal,
    tipo,
    items,
    metodo: tipo === "venta" ? metodo : undefined,
    contacto: contacto || undefined,
    aceptaWhatsapp: acepta,
    descuento: descuento ?? undefined,
  });
  if (!r.ok) return { ok: false, error: textoDeError(r.error) };

  const problemas: Problema[] = [];
  const medio = metodo ?? "efectivo";

  // 0. El usuario y el correo de la clienta (el teléfono ya se guardó con el pedido)
  if (usuario || correo) {
    const guardado = await guardarContactoDeVenta(supabase, r.id, { usuario, correo });
    if (!guardado) problemas.push("contacto");
  }

  // 1. La entrega, mientras el pedido está pendiente: el envío que cobra la clienta suma al total
  if (entregaLeida && "envio" in entregaLeida) {
    const guardado = await guardarEnvio(supabase, r.id, entregaLeida.envio);
    if (!guardado.ok) problemas.push("envio");
  }

  // 2. Ya pagó pero se entrega después: se paga completo (con el envío incluido) y queda "pagado", a la espera de entregarse
  if (plan.pagarTodo) {
    const debe = await saldoDelPedido(supabase, r.id);
    if (debe && debe > 0) {
      const pagado = await registrarPago(supabase, r.id, debe, medio);
      if (!pagado.ok) problemas.push("pago");
    }
  }

  // 3. Un anticipo es un pago más del pedido: la base verifica que no pase del saldo
  if (anticipo > 0) {
    const pagado = await registrarPago(supabase, r.id, anticipo, medio);
    if (!pagado.ok) problemas.push("anticipo");
  }

  // 4. Contra entrega: se deja marcado ya, para que el apartado no venza esperando que alguien lo active
  if (plan.contraEntrega) {
    const marca = await marcarContraEntrega(supabase, r.id, true);
    if (!marca.ok) problemas.push("contra");
  }

  revalidatePath("/", "layout");
  return { ok: true, codigo: r.codigo, tipo: plan.pagarTodo ? "venta" : tipo, problemas };
}
