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
    <div className="mx-auto mt-4 flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-current/20 px-4 py-3">
      <div>
        <p className="font-semibold">{t.titulo}</p>
        <p className="text-sm opacity-80">{t.ayuda}</p>
      </div>
      <Link href={conBusqueda("/login", new URLSearchParams({ next: destino }))} className="rounded-full border-2 border-current px-4 py-2 text-sm font-semibold">
        {t.boton}
      </Link>
    </div>
  );
}
