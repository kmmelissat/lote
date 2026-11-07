import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Migas } from "@/components/nav/Migas";
import { Logo } from "@/components/ui/Logo";
import { estiloBoton } from "@/components/ui/Button";
import { alternarDestacado, alternarTiendaDelMomento } from "@/features/admin/actions/destacar";
import { esAdmin, productosAdmin, tiendasAdmin } from "@/features/admin/repositorio";
import { urlFoto } from "@/lib/fotos";
import { formatearDolares } from "@/lib/formato";
import { createClient } from "@/lib/supabase/server";
import { textos } from "@/lib/textos";

const t = textos.admin;

export const metadata: Metadata = { title: t.titulo, robots: { index: false, follow: false } };

/** El panel de la admin de Lote: elegir los destacados del Marketplace. Para cualquier otra cuenta, no existe. */
export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await connection();
  const supabase = await createClient();
  if (!(await esAdmin(supabase))) notFound();

  const q = (await searchParams).q;
  const busqueda = typeof q === "string" ? q.slice(0, 80) : "";
  const [productos, tiendas] = await Promise.all([productosAdmin(supabase, busqueda), tiendasAdmin(supabase)]);
  const destacados = productos?.filter((p) => p.destacado).length ?? 0;

  return (
    <div className="min-h-dvh bg-crema">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" aria-label={textos.nombre}>
            <Logo />
          </Link>
          <Link href="/marketplace" target="_blank" className={`${estiloBoton("secundario")} h-10 px-5 text-sm`}>
            {t.verMarketplace}
          </Link>
        </header>
        <Migas />

        <div>
          <h1 className="text-2xl font-bold">{t.titulo}</h1>
          <p className="text-texto-2">{t.descripcion}</p>
        </div>

        <section aria-labelledby="tiendas-momento" className="flex flex-col gap-3">
          <div>
            <h2 id="tiendas-momento" className="text-lg font-bold">
              {t.tiendasTitulo}
            </h2>
            <p className="text-sm text-texto-2">{t.tiendasDescripcion}</p>
          </div>
          {tiendas === null ? (
            <p className="rounded-2xl border border-dashed border-teal-oscuro bg-white p-5 font-bold">{t.tiendasSinSql}</p>
          ) : (
            <>
              <p className="text-sm font-bold">{t.tiendasMarcadas(tiendas.filter((x) => x.destacada).length)}</p>
              <ul className="flex flex-col gap-2">
                {tiendas.map((x) => (
                  <li key={x.slug} className={`flex items-center gap-3 rounded-2xl border border-teal-oscuro p-2 pr-3 ${x.destacada ? "bg-limon" : "bg-white"}`}>
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-teal-fondo">
                      {x.logo && <Image src={urlFoto(x.logo)} alt="" fill sizes="56px" className="object-cover" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/c/${x.slug}`} target="_blank" className="block truncate font-bold hover:underline">
                        {x.nombre}
                      </Link>
                      <p className="truncate text-sm text-texto-2">{t.productosDe(x.productos)}</p>
                    </div>
                    <form action={alternarTiendaDelMomento}>
                      <input type="hidden" name="tienda" value={x.slug} />
                      <input type="hidden" name="destacar" value={x.destacada ? "0" : "1"} />
                      <button type="submit" className={`${estiloBoton(x.destacada ? "secundario" : "primario")} h-10 px-4 text-sm`}>
                        {x.destacada ? t.quitar : `★ ${t.marcar}`}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <form action="/admin" role="search" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={busqueda}
            aria-label={t.buscar}
            placeholder={t.buscar}
            className="h-12 min-w-0 flex-1 rounded-full border border-teal-oscuro bg-white px-5"
          />
          <button type="submit" className={estiloBoton("mango")}>
            {t.buscarBoton}
          </button>
        </form>

        {productos === null ? (
          <p className="rounded-2xl border border-dashed border-teal-oscuro bg-white p-5 font-bold">{t.sinSql}</p>
        ) : productos.length === 0 ? (
          <p className="text-texto-2">{t.vacio}</p>
        ) : (
          <>
            <p className="text-sm font-bold">{t.destacados(destacados)}</p>
            <ul className="flex flex-col gap-2">
              {productos.map((p) => (
                <li
                  key={p.productoId}
                  className={`flex items-center gap-3 rounded-2xl border border-teal-oscuro p-2 pr-3 ${p.destacado ? "bg-limon" : "bg-white"}`}
                >
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-teal-fondo">
                    {p.foto && <Image src={urlFoto(p.foto)} alt="" fill sizes="56px" className="object-cover" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/c/${p.tiendaSlug}/${p.codigo}`} target="_blank" className="block truncate font-bold hover:underline">
                      {p.nombre}
                    </Link>
                    <p className="truncate text-sm text-texto-2">
                      {p.tiendaNombre} · {formatearDolares(p.precio)}
                      {p.estrellas !== null && p.resenas > 0 && ` · ${t.resenas(p.estrellas, p.resenas)}`}
                    </p>
                  </div>
                  <form action={alternarDestacado}>
                    <input type="hidden" name="producto" value={p.productoId} />
                    <input type="hidden" name="destacar" value={p.destacado ? "0" : "1"} />
                    <button type="submit" className={`${estiloBoton(p.destacado ? "secundario" : "primario")} h-10 px-4 text-sm`}>
                      {p.destacado ? t.quitar : `★ ${t.destacar}`}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
