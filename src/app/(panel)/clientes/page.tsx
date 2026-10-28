import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/nav/PageHeader";
import { Pestanas } from "@/components/nav/Pestanas";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { filtrarClientes } from "@/features/customers/filtro";
import { listarClientes } from "@/features/customers/repositorio";
import { formatearDolares } from "@/lib/formato";
import { negocioActual } from "@/lib/negocio";
import { textos } from "@/lib/textos";

const t = textos.clientes;

export const metadata: Metadata = { title: t.titulo };

export default function Page({ searchParams }: PageProps<"/clientes">) {
  return (
    <>
      <PageHeader titulo={t.titulo} descripcion={t.descripcion} />
      <Lista searchParams={searchParams} />
    </>
  );
}

async function Lista({ searchParams }: Pick<PageProps<"/clientes">, "searchParams">) {
  const params = await searchParams;
  const texto = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const soloConSaldo = params.saldo === "1";

  const { supabase, negocio } = await negocioActual();
  const todos = await listarClientes(supabase, negocio.id);

  if (!todos.length) return <EmptyState texto={t.vacioTexto} />;

  const clientes = filtrarClientes(todos, { texto, soloConSaldo });
  const debenTotal = todos.reduce((suma, c) => suma + c.resumen.saldo, 0);
  const enlace = (conSaldo: boolean) => {
    const q = new URLSearchParams();
    if (texto.trim()) q.set("q", texto);
    if (conSaldo) q.set("saldo", "1");
    const cadena = q.toString();
    return cadena ? `/clientes?${cadena}` : "/clientes";
  };

  return (
    <div className="flex flex-col gap-4">
      <form role="search" className="flex items-end gap-2 md:max-w-md">
        {soloConSaldo && <input type="hidden" name="saldo" value="1" />}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-medium">
            {t.buscar}
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={texto}
            placeholder={t.placeholder}
            className="h-12 rounded-xl border border-borde bg-superficie px-4 text-base"
          />
        </div>
        <Button type="submit" variante="secundario">
          {t.buscarBoton}
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Pestanas
          etiqueta={t.filtros}
          activa={soloConSaldo ? "saldo" : "todos"}
          pestanas={[
            { valor: "todos", etiqueta: t.todos, href: enlace(false) },
            { valor: "saldo", etiqueta: t.conSaldo, href: enlace(true) },
          ]}
        />
        {debenTotal > 0 && <p className="font-medium">{t.debeTotal(formatearDolares(debenTotal))}</p>}
      </div>

      {!clientes.length ? (
        <EmptyState
          texto={soloConSaldo && !texto.trim() ? t.sinDeudores : t.sinResultados}
          accion={
            <ButtonLink href="/clientes" variante="secundario">
              {t.limpiar}
            </ButtonLink>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {clientes.map((c) => (
            <li key={c.id}>
              <Link href={`/clientes/${c.id}`} className="block">
                <Card className="flex flex-col gap-1 border border-borde hover:bg-teal-fondo">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate font-medium">{c.nombre}</p>
                    {c.resumen.saldo > 0 && (
                      <p className="font-bold text-ambar-texto">{t.debe(formatearDolares(c.resumen.saldo))}</p>
                    )}
                  </div>
                  <p className="text-sm text-texto-2">
                    {c.contacto ?? t.sinContacto} · {t.pedidos(c.resumen.pedidos)}
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
