"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { destacar, destacarTienda } from "../repositorio";

/** Destaca o quita un producto del Marketplace. La base rechaza a cualquiera que no sea la admin. */
export async function alternarDestacado(formData: FormData): Promise<void> {
  const productoId = String(formData.get("producto") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(productoId)) return;
  const supabase = await createClient();
  if (await destacar(supabase, productoId, formData.get("destacar") === "1")) {
    revalidatePath("/admin");
    revalidatePath("/marketplace", "layout");
  }
}

/** Marca o quita una tienda como "tienda del momento" del Marketplace. La base rechaza a cualquiera que no sea la admin. */
export async function alternarTiendaDelMomento(formData: FormData): Promise<void> {
  const slug = String(formData.get("tienda") ?? "");
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return;
  const supabase = await createClient();
  if (await destacarTienda(supabase, slug, formData.get("destacar") === "1")) {
    revalidatePath("/admin");
    revalidatePath("/marketplace", "layout");
  }
}
