import Link from "next/link";
import { connection } from "next/server";
import { Icon } from "@/components/ui/Icon";
import { createPublicClient } from "@/lib/supabase/publico";
import { textos } from "@/lib/textos";
import { explorarTiendas, RUTA_TIENDAS, type TiendaExplorar } from "../explorar";
import { esRubro, nombreDeRubro, rubroDeCategoria, RUBROS, type RubroId } from "../rubros";
import { TarjetaTiendaLista } from "./TarjetaTiendaLista";

const t = textos.explorar.tiendasPagina;

const foco = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-oscuro";
const chip = (activo: boolean) =>
  `inline-flex h-11 items-center rounded-full border px-4 md:h-9 text-sm font-bold text-teal-oscuro transition-colors ${foco} ${
    activo ? "border-2 border-teal-oscuro bg-limon" : "border-[#b9c7c9] bg-white hover:bg-teal-fondo/50"
  }`;

/** Los rubros en los que una tienda vende (según las categorías de sus productos). */
const rubrosDe = (tienda: TiendaExplorar) => new Set(tienda.categorias.map((c) => rubroDeCategoria(c)).filter((r): r is RubroId => !!r));

const enlace = (categoria: string, q: string) => {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (categoria) p.set("categoria", categoria);
  const texto = p.toString();
  return (texto ? `${RUTA_TIENDAS}?${texto}` : RUTA_TIENDAS) as typeof RUTA_TIENDAS;
};

/** Todas las tiendas del Marketplace: cabecera con buscador, chips por categoría y la lista de tarjetas. */
export async function PaginaTiendas({ searchParams }: Pick<PageProps<"/marketplace/tiendas">, "searchParams">) {
  await connection();
  const params = await searchParams;
  const q = (typeof params.q === "string" ? params.q : "").trim().slice(0, 80);
  const pedida = typeof params.categoria === "string" ? params.categoria : "";
  const categoria = esRubro(pedida) ? pedida : "";

  const supabase = createPublicClient();
  const todas = (await explorarTiendas(supabase)).sort((a, b) => b.piezas - a.piezas);
  const buscadas = q ? (await explorarTiendas(supabase, q)).sort((a, b) => b.piezas - a.piezas) : todas;
  const visibles = categoria ? buscadas.filter((x) => rubrosDe(x).has(categoria)) : buscadas;

  const conteo = new Map<RubroId, number>();
  for (const x of todas) for (const r of rubrosDe(x)) conteo.set(r, (conteo.get(r) ?? 0) + 1);
  const rubros = RUBROS.filter((r) => conteo.has(r.id));

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label={t.migas} className="text-[13px] text-[#35525a]">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/marketplace" className={`inline-flex min-h-11 items-center rounded hover:underline ${foco}`}>
              {t.inicio}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-bold">
            {t.actual}
          </li>
        </ol>
      </nav>

      <section className="relative overflow-hidden rounded-3xl bg-teal-oscuro p-5 text-white md:p-8">
        <span aria-hidden="true" className="pointer-events-none absolute -top-5 right-[22%] hidden size-14 rounded-full bg-rosa md:block" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-4 right-[8%] hidden size-10 rounded-full bg-limon md:block" />
        <div className="relative flex flex-col gap-3">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight md:text-[34px]">
            {t.h1Inicio} <span className="text-limon">{t.h1Destacado}</span>
          </h1>
          <p className="max-w-[620px] text-[15px] leading-relaxed text-celeste">{t.intro(todas.length)}</p>
          <form action={RUTA_TIENDAS} role="search" className="mt-2 flex h-[46px] w-full max-w-xl items-center rounded-full bg-white pl-4 pr-1 text-teal-oscuro focus-within:ring-4 focus-within:ring-accion/60">
            {categoria && <input type="hidden" name="categoria" value={categoria} />}
            <Icon nombre="buscar" className="size-5 shrink-0 text-texto-2" />
            <input type="search" name="q" defaultValue={q} aria-label={t.buscar} placeholder={t.buscar} className="h-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-texto-2" />
            <button type="submit" className={`h-11 shrink-0 rounded-full bg-accion px-5 text-sm font-bold text-accion-texto ${foco}`}>
              {t.buscarBoton}
            </button>
          </form>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <nav aria-label={t.categorias}>
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link href={enlace("", q)} aria-current={!categoria ? "true" : undefined} className={chip(!categoria)}>
                {t.todas(buscadas.length)}
              </Link>
            </li>
            {rubros.map((r) => (
              <li key={r.id}>
                <Link href={enlace(r.id, q)} aria-current={categoria === r.id ? "true" : undefined} className={chip(categoria === r.id)}>
                  {t.conteo(r.nombre, conteo.get(r.id) ?? 0)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Hoy solo hay un orden: más productos primero */}
        <label className="flex items-center gap-2 text-sm font-bold">
          {t.ordenar}
          <select className={`h-11 rounded-full border-2 border-teal-oscuro bg-white px-3 text-sm font-bold ${foco}`}>
            <option>{t.masProductos}</option>
          </select>
        </label>
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-teal-oscuro bg-white px-6 py-12 text-center text-texto-2">{t.vacio}</p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(256px,1fr))] gap-5">
          {visibles.map((x, i) => (
            <li key={x.slug}>
              <TarjetaTiendaLista tienda={x} eager={i < 4} />
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="como-funcionan" className="mt-6 flex flex-col gap-3 border-t border-borde pt-8">
        <h2 id="como-funcionan" className="font-logo text-xl font-bold leading-tight">
          {t.seoTitulo}
        </h2>
        <p className="max-w-[760px] text-[15px] leading-[1.6] text-[#35525a]">{t.seoTexto}</p>
        <h3 className="mt-2 text-base font-bold">{t.seoCategorias}</h3>
        <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
          {rubros.map((r) => (
            <li key={r.id}>
              <Link href={enlace(r.id, "")} className={`inline-flex min-h-11 items-center rounded text-sm font-semibold text-teal-oscuro hover:underline ${foco}`}>
                {t.tiendasDe(nombreDeRubro(r.id))}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
