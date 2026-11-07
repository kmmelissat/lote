import Link from "next/link";
import { conBusqueda } from "@/lib/ruta";
import { textos } from "@/lib/textos";
import { haySesion } from "../compradorDispositivo";

const t = textos.vitrina.confirmacion.guardarCuenta;

/**
 * Invita a entrar con Google para ver el carrito y los pedidos desde otro aparato. Quien ya entró no lo ve.
 * Al volver, la cuenta se une con el comprador de este dispositivo (ver /auth/callback).
 */
export async function GuardarCuenta({ destino }: { destino: string }) {
  if (await haySesion()) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-(--store-soft) px-4 py-3 text-(--store-on-soft)">
      <div>
        <p className="font-semibold">{t.titulo}</p>
        <p className="text-sm opacity-80">{t.ayuda}</p>
      </div>
      <Link href={conBusqueda("/login", new URLSearchParams({ next: destino }))} className="inline-flex min-h-11 items-center rounded-full bg-(--store-button) px-5 text-sm font-bold text-(--store-on-button) max-sm:w-full max-sm:justify-center">
        {t.boton}
      </Link>
    </div>
  );
}
