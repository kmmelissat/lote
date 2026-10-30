"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { destacar } from "../repositorio";

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
