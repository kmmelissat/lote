"use server";

import { redirect } from "next/navigation";
import { telefonoElSalvador } from "@/domain";
import { esDepartamento, MUNICIPIOS } from "@/lib/departamentos";
import { createClient } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";
import { datosDeCuenta, guardarPerfilDeCuenta, type DatosDeCuenta } from "../compradorDispositivo";

const t = textos.explorar.cuenta;

/** Los datos de quien entró con su cuenta, para no pedírselos de nuevo. Sin sesión, null. */
export async function datosDeMiCuenta(): Promise<DatosDeCuenta | null> {
  return datosDeCuenta();
}

export type EstadoPerfil = { error?: string; errores?: Record<string, string>; guardado?: boolean };

const campo = (f: FormData, nombre: string, max: number) => String(f.get(nombre) ?? "").trim().slice(0, max);

/** Guarda los datos y la dirección de entrega de la cuenta. La entrega es opcional, pero si hay dirección tiene que traer el departamento. */
export async function guardarPerfil(_anterior: EstadoPerfil, formData: FormData): Promise<EstadoPerfil> {
  const nombre = campo(formData, "nombre", 80);
  const crudoTelefono = campo(formData, "telefono", 30);
  const telefono = crudoTelefono ? telefonoElSalvador(crudoTelefono) : null;
  const departamento = campo(formData, "departamento", 40);
  const municipio = campo(formData, "municipio", 60);
  const direccion = campo(formData, "direccion", 200);
  const referencia = campo(formData, "referencia", 200);

  const errores: Record<string, string> = {};
  if (!nombre) errores.nombre = t.errorNombre;
  if (crudoTelefono && !telefono) errores.telefono = t.errorTelefono;
  if (departamento && !esDepartamento(departamento)) errores.departamento = t.errorEntrega;
  if (esDepartamento(departamento) && municipio && !MUNICIPIOS[departamento].includes(municipio)) errores.municipio = t.errorEntrega;
  if (direccion && !departamento) errores.departamento = t.errorEntrega;
  if (Object.keys(errores).length) return { error: Object.values(errores)[0], errores };

  const ok = await guardarPerfilDeCuenta({ nombre, telefono, departamento, municipio: departamento ? municipio : "", direccion, referencia });
  return ok ? { guardado: true } : { error: t.errorGuardar };
}

/** Cerrar sesión desde el Marketplace: se vuelve al Marketplace, no a la pantalla de entrar del panel. */
export async function cerrarSesionDelMarketplace() {
  await (await createClient()).auth.signOut();
  redirect("/marketplace");
}
